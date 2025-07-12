import { fetchStopTimetable, parseStopTimetableDepartures } from './transit-api';

// Hardcoded constants
export const TRAVEL_TIMES = {
  bart: {
    north_concord_to_powell: 51,
    powell_to_north_concord: 49,
  },
  muni: {
    union_square_to_ucsf: 15,
    ucsf_to_union_square: 15,
  },
};

export const WALK_TIMES = {
  parking_to_bart: 5,
  bart_to_muni: 8,
  muni_to_office: 7,
};

export const STOP_CODES = {
  bart: {
    north_concord_southbound: '903702',
    north_concord_northbound: '903701',
    powell_southbound: '901301',
    powell_northbound: '901302',
  },
  muni: {
    union_square_northbound: '17877',
    ucsf_northbound: '17360',
    ucsf_southbound: '17361',
    union_square_southbound: '17874',
  },
};

export interface OptimizationRequest {
  direction: 'to_work' | 'to_home';
  preferred_departure_window: {
    start: string; // HH:MM format
    end: string;   // HH:MM format
  };
  drive_time_minutes: number;
  current_time: string; // ISO string
}

export interface JourneySegment {
  mode: 'drive' | 'bart' | 'muni' | 'walk';
  from: string;
  to: string;
  duration: number;
  departure: string;
  arrival: string;
  wait_time?: number;
  line?: string;
}

export interface OptimizationResult {
  optimal_departure: string;
  total_journey_time: number;
  arrival_time: string;
  confidence: number;
  segments: JourneySegment[];
}

export interface OptimizationResponse {
  results: OptimizationResult[];
  raw_schedules: {
    bart_departures: any[];
    muni_departures: any[];
  };
}

function parseTime(timeStr: string, baseDate: string): Date {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const baseDateTime = new Date(baseDate);
  
  // Get the date components in UTC
  const year = baseDateTime.getUTCFullYear();
  const month = baseDateTime.getUTCMonth();
  const day = baseDateTime.getUTCDate();
  
  // Create a date with UTC time components
  // The timeStr is already in UTC format from the API route
  const utcDate = new Date(Date.UTC(year, month, day, hours, minutes, 0, 0));
  
  return utcDate;
}

function formatTime(date: Date): string {
  return date.toTimeString().slice(0, 5);
}

function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60000);
}

function getMinutesDiff(later: Date, earlier: Date): number {
  return Math.round((later.getTime() - earlier.getTime()) / 60000);
}

interface State {
  location: 'home' | 'parking' | 'bart' | 'muni' | 'office';
  time: Date;
  cost: number; // Total time elapsed
  parent?: State;
  bartDeparture?: any;
  muniDeparture?: any;
}

interface JourneyConfig {
  startLocation: 'home' | 'office';
  endLocation: 'home' | 'office';
  bartOrigin: 'north_concord' | 'powell';
  bartDestination: 'north_concord' | 'powell';
  muniOrigin: 'union_square' | 'ucsf';
  muniDestination: 'union_square' | 'ucsf';
  bartStopCode: string;
  muniStopCode: string;
  bartTravelKey: 'north_concord_to_powell' | 'powell_to_north_concord';
  muniTravelKey: 'union_square_to_ucsf' | 'ucsf_to_union_square';
}

class MinHeap<T> {
  private heap: T[] = [];
  
  constructor(private compare: (a: T, b: T) => number) {}
  
  push(item: T): void {
    this.heap.push(item);
    this.heapifyUp(this.heap.length - 1);
  }
  
  pop(): T | undefined {
    if (this.heap.length === 0) return undefined;
    if (this.heap.length === 1) return this.heap.pop();
    
    const result = this.heap[0];
    this.heap[0] = this.heap.pop()!;
    this.heapifyDown(0);
    return result;
  }
  
  isEmpty(): boolean {
    return this.heap.length === 0;
  }
  
  private heapifyUp(index: number): void {
    if (index === 0) return;
    
    const parentIndex = Math.floor((index - 1) / 2);
    if (this.compare(this.heap[index], this.heap[parentIndex]) < 0) {
      [this.heap[index], this.heap[parentIndex]] = [this.heap[parentIndex], this.heap[index]];
      this.heapifyUp(parentIndex);
    }
  }
  
  private heapifyDown(index: number): void {
    const leftChild = 2 * index + 1;
    const rightChild = 2 * index + 2;
    let smallest = index;
    
    if (leftChild < this.heap.length && this.compare(this.heap[leftChild], this.heap[smallest]) < 0) {
      smallest = leftChild;
    }
    
    if (rightChild < this.heap.length && this.compare(this.heap[rightChild], this.heap[smallest]) < 0) {
      smallest = rightChild;
    }
    
    if (smallest !== index) {
      [this.heap[index], this.heap[smallest]] = [this.heap[smallest], this.heap[index]];
      this.heapifyDown(smallest);
    }
  }
}

function getStateKey(state: State): string {
  return `${state.location}-${state.time.getTime()}`;
}

function getJourneyConfig(direction: 'to_work' | 'to_home'): JourneyConfig {
  if (direction === 'to_work') {
    return {
      startLocation: 'home',
      endLocation: 'office',
      bartOrigin: 'north_concord',
      bartDestination: 'powell',
      muniOrigin: 'union_square',
      muniDestination: 'ucsf',
      bartStopCode: STOP_CODES.bart.north_concord_southbound,
      muniStopCode: STOP_CODES.muni.union_square_northbound,
      bartTravelKey: 'north_concord_to_powell',
      muniTravelKey: 'union_square_to_ucsf',
    };
  } else {
    return {
      startLocation: 'office',
      endLocation: 'home',
      bartOrigin: 'powell',
      bartDestination: 'north_concord',
      muniOrigin: 'ucsf',
      muniDestination: 'union_square',
      bartStopCode: STOP_CODES.bart.powell_northbound,
      muniStopCode: STOP_CODES.muni.ucsf_southbound,
      bartTravelKey: 'powell_to_north_concord',
      muniTravelKey: 'ucsf_to_union_square',
    };
  }
}

function heuristic(state: State, driveTimeMinutes: number, config: JourneyConfig): number {
  // Optimistic estimate of remaining time to destination
  if (config.startLocation === 'home') {
    // To work direction
    switch (state.location) {
      case 'home':
        return driveTimeMinutes + WALK_TIMES.parking_to_bart + 
               TRAVEL_TIMES.bart[config.bartTravelKey] + WALK_TIMES.bart_to_muni +
               TRAVEL_TIMES.muni[config.muniTravelKey] + WALK_TIMES.muni_to_office;
      case 'parking':
        return WALK_TIMES.parking_to_bart + TRAVEL_TIMES.bart[config.bartTravelKey] + 
               WALK_TIMES.bart_to_muni + TRAVEL_TIMES.muni[config.muniTravelKey] + 
               WALK_TIMES.muni_to_office;
      case 'bart':
        return TRAVEL_TIMES.bart[config.bartTravelKey] + WALK_TIMES.bart_to_muni +
               TRAVEL_TIMES.muni[config.muniTravelKey] + WALK_TIMES.muni_to_office;
      case 'muni':
        return TRAVEL_TIMES.muni[config.muniTravelKey] + WALK_TIMES.muni_to_office;
      case 'office':
        return 0;
    }
  } else {
    // To home direction
    switch (state.location) {
      case 'office':
        return WALK_TIMES.muni_to_office + TRAVEL_TIMES.muni[config.muniTravelKey] + 
               WALK_TIMES.bart_to_muni + TRAVEL_TIMES.bart[config.bartTravelKey] +
               WALK_TIMES.parking_to_bart + driveTimeMinutes;
      case 'muni':
        return TRAVEL_TIMES.muni[config.muniTravelKey] + WALK_TIMES.bart_to_muni +
               TRAVEL_TIMES.bart[config.bartTravelKey] + WALK_TIMES.parking_to_bart + driveTimeMinutes;
      case 'bart':
        return TRAVEL_TIMES.bart[config.bartTravelKey] + WALK_TIMES.parking_to_bart + driveTimeMinutes;
      case 'parking':
        return driveTimeMinutes;
      case 'home':
        return 0;
    }
  }
  return 0;
}

function getNeighbors(state: State, bartDeps: any[], muniDeps: any[], driveTimeMinutes: number, config: JourneyConfig): State[] {
  const neighbors: State[] = [];
  
  if (config.startLocation === 'home') {
    // To work direction
    switch (state.location) {
      case 'home':
        neighbors.push({
          location: 'parking',
          time: addMinutes(state.time, driveTimeMinutes),
          cost: state.cost + driveTimeMinutes,
          parent: state
        });
        break;

      case 'parking':
        neighbors.push({
          location: 'bart',
          time: addMinutes(state.time, WALK_TIMES.parking_to_bart),
          cost: state.cost + WALK_TIMES.parking_to_bart,
          parent: state
        });
        break;

      case 'bart':
        const bartArrivalTime = state.time;
        console.log(`    Looking for BART after ${bartArrivalTime.toISOString()}`);
        console.log(`    Available BART departures: ${bartDeps.length}`);
        
        // Show what BART we would need to catch
        const idealBartTime = addMinutes(bartArrivalTime, -25); // Need to leave home 25 min before BART
        console.log(`    To catch BART at ${bartArrivalTime.toISOString()}, need to leave home at ${idealBartTime.toISOString()}`);
        
        const nextBart = bartDeps.find(d => {
          const depTime = new Date(d.departureTime!);
          const isAfter = depTime >= bartArrivalTime;
          console.log(`      BART ${d.lineName} departs ${depTime.toISOString()} - ${isAfter ? 'YES catches this' : 'NO too late'}`);
          return isAfter;
        });
        
        if (nextBart) {
          const bartDepTime = new Date(nextBart.departureTime!);
          const waitTime = getMinutesDiff(bartDepTime, bartArrivalTime);
          console.log(`    ✓ Found BART: ${nextBart.lineName} at ${bartDepTime.toISOString()}, wait: ${waitTime}min`);
          
          neighbors.push({
            location: 'muni',
            time: addMinutes(bartDepTime, TRAVEL_TIMES.bart[config.bartTravelKey] + 
                                         WALK_TIMES.bart_to_muni),
            cost: state.cost + waitTime + TRAVEL_TIMES.bart[config.bartTravelKey] + 
                  WALK_TIMES.bart_to_muni,
            parent: state,
            bartDeparture: nextBart
          });
        } else {
          console.log(`    ✗ No BART found after ${bartArrivalTime.toISOString()}`);
        }
        break;

      case 'muni':
        const muniArrivalTime = state.time;
        console.log(`    Looking for Muni after ${muniArrivalTime.toISOString()}`);
        console.log(`    Available Muni departures: ${muniDeps.length}`);
        
        const nextMuni = muniDeps.find(d => {
          const depTime = new Date(d.departureTime!);
          const isAfter = depTime >= muniArrivalTime;
          console.log(`      Muni ${d.lineName} at ${depTime.toISOString()} - after arrival? ${isAfter}`);
          return isAfter;
        });
        
        if (nextMuni) {
          const muniDepTime = new Date(nextMuni.departureTime!);
          const waitTime = getMinutesDiff(muniDepTime, muniArrivalTime);
          console.log(`    ✓ Found Muni: ${nextMuni.lineName} at ${muniDepTime.toISOString()}, wait: ${waitTime}min`);
          
          neighbors.push({
            location: 'office',
            time: addMinutes(muniDepTime, TRAVEL_TIMES.muni[config.muniTravelKey] + 
                                         WALK_TIMES.muni_to_office),
            cost: state.cost + waitTime + TRAVEL_TIMES.muni[config.muniTravelKey] + 
                  WALK_TIMES.muni_to_office,
            parent: state,
            muniDeparture: nextMuni
          });
        } else {
          console.log(`    ✗ No Muni found after ${muniArrivalTime.toISOString()}`);
        }
        break;
    }
  } else {
    // To home direction
    switch (state.location) {
      case 'office':
        neighbors.push({
          location: 'muni',
          time: addMinutes(state.time, WALK_TIMES.muni_to_office),
          cost: state.cost + WALK_TIMES.muni_to_office,
          parent: state
        });
        break;

      case 'muni':
        const muniArrivalTime2 = state.time;
        console.log(`    Looking for Muni (home) after ${muniArrivalTime2.toISOString()}`);
        console.log(`    Available Muni departures: ${muniDeps.length}`);
        
        const nextMuni2 = muniDeps.find(d => {
          const depTime = new Date(d.departureTime!);
          const isAfter = depTime >= muniArrivalTime2;
          console.log(`      Muni ${d.lineName} at ${depTime.toISOString()} - after arrival? ${isAfter}`);
          return isAfter;
        });
        
        if (nextMuni2) {
          const muniDepTime = new Date(nextMuni2.departureTime!);
          const waitTime = getMinutesDiff(muniDepTime, muniArrivalTime2);
          console.log(`    ✓ Found Muni (home): ${nextMuni2.lineName} at ${muniDepTime.toISOString()}, wait: ${waitTime}min`);
          
          neighbors.push({
            location: 'bart',
            time: addMinutes(muniDepTime, TRAVEL_TIMES.muni[config.muniTravelKey] + 
                                         WALK_TIMES.bart_to_muni),
            cost: state.cost + waitTime + TRAVEL_TIMES.muni[config.muniTravelKey] + 
                  WALK_TIMES.bart_to_muni,
            parent: state,
            muniDeparture: nextMuni2
          });
        } else {
          console.log(`    ✗ No Muni (home) found after ${muniArrivalTime2.toISOString()}`);
        }
        break;

      case 'bart':
        const bartArrivalTime2 = state.time;
        console.log(`    Looking for BART (home) after ${bartArrivalTime2.toISOString()}`);
        console.log(`    Available BART departures: ${bartDeps.length}`);
        
        const nextBart2 = bartDeps.find(d => {
          const depTime = new Date(d.departureTime!);
          const isAfter = depTime >= bartArrivalTime2;
          console.log(`      BART ${d.lineName} at ${depTime.toISOString()} - after arrival? ${isAfter}`);
          return isAfter;
        });
        
        if (nextBart2) {
          const bartDepTime = new Date(nextBart2.departureTime!);
          const waitTime = getMinutesDiff(bartDepTime, bartArrivalTime2);
          console.log(`    ✓ Found BART (home): ${nextBart2.lineName} at ${bartDepTime.toISOString()}, wait: ${waitTime}min`);
          
          neighbors.push({
            location: 'parking',
            time: addMinutes(bartDepTime, TRAVEL_TIMES.bart[config.bartTravelKey] + 
                                         WALK_TIMES.parking_to_bart),
            cost: state.cost + waitTime + TRAVEL_TIMES.bart[config.bartTravelKey] + 
                  WALK_TIMES.parking_to_bart,
            parent: state,
            bartDeparture: nextBart2
          });
        } else {
          console.log(`    ✗ No BART (home) found after ${bartArrivalTime2.toISOString()}`);
        }
        break;

      case 'parking':
        neighbors.push({
          location: 'home',
          time: addMinutes(state.time, driveTimeMinutes),
          cost: state.cost + driveTimeMinutes,
          parent: state
        });
        break;
    }
  }
  
  return neighbors;
}

function reconstructPath(goalState: State): State[] {
  const path: State[] = [];
  let current: State | undefined = goalState;
  
  while (current) {
    path.unshift(current);
    current = current.parent;
  }
  
  return path;
}

function formatSolutions(solutions: State[], bartDepartures: any[], muniDepartures: any[], config: JourneyConfig): OptimizationResponse {
  const results: OptimizationResult[] = [];
  
  for (const solution of solutions) {
    const path = reconstructPath(solution);
    const segments: JourneySegment[] = [];
    
    // Build segments from path
    for (let i = 0; i < path.length - 1; i++) {
      const current = path[i];
      const next = path[i + 1];
      
      if (config.startLocation === 'home') {
        // To work segments
        if (current.location === 'home' && next.location === 'parking') {
          segments.push({
            mode: 'drive',
            from: 'Home',
            to: 'North Concord BART Parking',
            duration: getMinutesDiff(next.time, current.time),
            departure: formatTime(current.time),
            arrival: formatTime(next.time)
          });
        } else if (current.location === 'parking' && next.location === 'bart') {
          segments.push({
            mode: 'walk',
            from: 'BART Parking',
            to: 'North Concord BART Station',
            duration: WALK_TIMES.parking_to_bart,
            departure: formatTime(current.time),
            arrival: formatTime(next.time)
          });
        } else if (current.location === 'bart' && next.location === 'muni') {
          const bartWaitTime = getMinutesDiff(new Date(next.bartDeparture!.departureTime!), current.time);
          const bartDepTime = new Date(next.bartDeparture!.departureTime!);
          const bartArrTime = addMinutes(bartDepTime, TRAVEL_TIMES.bart[config.bartTravelKey]);
          
          segments.push({
            mode: 'bart',
            from: 'North Concord BART',
            to: 'Powell St BART',
            duration: TRAVEL_TIMES.bart[config.bartTravelKey],
            departure: formatTime(bartDepTime),
            arrival: formatTime(bartArrTime),
            wait_time: bartWaitTime,
            line: next.bartDeparture!.lineName
          });
          
          segments.push({
            mode: 'walk',
            from: 'Powell St BART',
            to: 'Union Square Muni',
            duration: WALK_TIMES.bart_to_muni,
            departure: formatTime(bartArrTime),
            arrival: formatTime(addMinutes(bartArrTime, WALK_TIMES.bart_to_muni))
          });
        } else if (current.location === 'muni' && next.location === 'office') {
          const muniWaitTime = getMinutesDiff(new Date(next.muniDeparture!.departureTime!), current.time);
          const muniDepTime = new Date(next.muniDeparture!.departureTime!);
          const muniArrTime = addMinutes(muniDepTime, TRAVEL_TIMES.muni[config.muniTravelKey]);
          
          segments.push({
            mode: 'muni',
            from: 'Union Square Muni',
            to: 'UCSF/Chase Center',
            duration: TRAVEL_TIMES.muni[config.muniTravelKey],
            departure: formatTime(muniDepTime),
            arrival: formatTime(muniArrTime),
            wait_time: muniWaitTime,
            line: next.muniDeparture!.lineName
          });
          
          segments.push({
            mode: 'walk',
            from: 'UCSF/Chase Center',
            to: 'Office',
            duration: WALK_TIMES.muni_to_office,
            departure: formatTime(muniArrTime),
            arrival: formatTime(addMinutes(muniArrTime, WALK_TIMES.muni_to_office))
          });
        }
      } else {
        // To home segments
        if (current.location === 'office' && next.location === 'muni') {
          segments.push({
            mode: 'walk',
            from: 'Office',
            to: 'UCSF/Chase Center',
            duration: WALK_TIMES.muni_to_office,
            departure: formatTime(current.time),
            arrival: formatTime(next.time)
          });
        } else if (current.location === 'muni' && next.location === 'bart') {
          const muniWaitTime = getMinutesDiff(new Date(next.muniDeparture!.departureTime!), current.time);
          const muniDepTime = new Date(next.muniDeparture!.departureTime!);
          const muniArrTime = addMinutes(muniDepTime, TRAVEL_TIMES.muni[config.muniTravelKey]);
          
          segments.push({
            mode: 'muni',
            from: 'UCSF/Chase Center',
            to: 'Union Square Muni',
            duration: TRAVEL_TIMES.muni[config.muniTravelKey],
            departure: formatTime(muniDepTime),
            arrival: formatTime(muniArrTime),
            wait_time: muniWaitTime,
            line: next.muniDeparture!.lineName
          });
          
          segments.push({
            mode: 'walk',
            from: 'Union Square Muni',
            to: 'Powell St BART',
            duration: WALK_TIMES.bart_to_muni,
            departure: formatTime(muniArrTime),
            arrival: formatTime(addMinutes(muniArrTime, WALK_TIMES.bart_to_muni))
          });
        } else if (current.location === 'bart' && next.location === 'parking') {
          const bartWaitTime = getMinutesDiff(new Date(next.bartDeparture!.departureTime!), current.time);
          const bartDepTime = new Date(next.bartDeparture!.departureTime!);
          const bartArrTime = addMinutes(bartDepTime, TRAVEL_TIMES.bart[config.bartTravelKey]);
          
          segments.push({
            mode: 'bart',
            from: 'Powell St BART',
            to: 'North Concord BART',
            duration: TRAVEL_TIMES.bart[config.bartTravelKey],
            departure: formatTime(bartDepTime),
            arrival: formatTime(bartArrTime),
            wait_time: bartWaitTime,
            line: next.bartDeparture!.lineName
          });
          
          segments.push({
            mode: 'walk',
            from: 'North Concord BART Station',
            to: 'BART Parking',
            duration: WALK_TIMES.parking_to_bart,
            departure: formatTime(bartArrTime),
            arrival: formatTime(addMinutes(bartArrTime, WALK_TIMES.parking_to_bart))
          });
        } else if (current.location === 'parking' && next.location === 'home') {
          segments.push({
            mode: 'drive',
            from: 'North Concord BART Parking',
            to: 'Home',
            duration: getMinutesDiff(next.time, current.time),
            departure: formatTime(current.time),
            arrival: formatTime(next.time)
          });
        }
      }
    }
    
    const startTime = path[0].time;
    const endTime = path[path.length - 1].time;
    const totalWaitTime = segments
      .filter(s => s.wait_time)
      .reduce((sum, s) => sum + s.wait_time!, 0);
    
    const confidence = Math.max(50, 100 - (totalWaitTime * 2));
    
    results.push({
      optimal_departure: formatTime(startTime),
      total_journey_time: solution.cost,
      arrival_time: formatTime(endTime),
      confidence,
      segments
    });
  }
  
  return {
    results,
    raw_schedules: {
      bart_departures: bartDepartures,
      muni_departures: muniDepartures
    }
  };
}

export async function optimizeCommute(
  departureWindowStart: string,
  departureWindowEnd: string,
  driveTimeMinutes: number,
  currentTime: string,
  direction: 'to_work' | 'to_home' = 'to_work'
): Promise<OptimizationResponse> {
  console.log('\n=== OPTIMIZER DEBUG START ===');
  console.log('Direction:', direction);
  console.log('Current time:', currentTime);
  console.log('Departure window:', departureWindowStart, 'to', departureWindowEnd);
  console.log('Drive time minutes:', driveTimeMinutes);
  
  const config = getJourneyConfig(direction);
  console.log('Journey config:', JSON.stringify(config, null, 2));
  
  // Parse departure window times in Pacific timezone  
  const currentDate = new Date(currentTime);
  const targetDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
  
  // Parse times as Pacific timezone
  const [startHours, startMinutes] = departureWindowStart.split(':').map(Number);
  const [endHours, endMinutes] = departureWindowEnd.split(':').map(Number);
  
  // Create dates in Pacific timezone by setting UTC time appropriately
  // Pacific is UTC-8, so 8:30 AM Pacific = 16:30 UTC
  const windowStart = new Date(targetDate);
  windowStart.setUTCHours(startHours + 8, startMinutes, 0, 0); // Add 8 hours to convert Pacific to UTC
  
  const windowEnd = new Date(targetDate);
  windowEnd.setUTCHours(endHours + 8, endMinutes, 0, 0);
  
  // Note: Time validation is handled at the API route level
  
  console.log('Target date:', targetDate.toDateString());
  console.log('Window start (UTC):', windowStart.toISOString());
  console.log('Window end (UTC):', windowEnd.toISOString());
  console.log('Window start (Pacific equivalent):', new Date(windowStart.getTime() - 8*60*60*1000).toISOString());
  console.log('Window end (Pacific equivalent):', new Date(windowEnd.getTime() - 8*60*60*1000).toISOString());

  // Fetch all departures upfront using timetable API
  console.log('\nFetching departures...');
  console.log('BART stop code:', config.bartStopCode);
  console.log('Muni stop code:', config.muniStopCode);
  
  // Format start/end times for API (HH:MM in UTC)
  const apiStartTime = `${windowStart.getUTCHours().toString().padStart(2, '0')}:${windowStart.getUTCMinutes().toString().padStart(2, '0')}`;
  const apiEndTime = `${windowEnd.getUTCHours().toString().padStart(2, '0')}:${windowEnd.getUTCMinutes().toString().padStart(2, '0')}`;
  console.log('API time window (UTC):', apiStartTime, 'to', apiEndTime);
  
  const [bartResponse, muniResponse] = await Promise.all([
    fetchStopTimetable('BA', config.bartStopCode, apiStartTime, apiEndTime),
    fetchStopTimetable('SF', config.muniStopCode, apiStartTime, apiEndTime)
  ]);
  
  console.log('\nBART API Response:', JSON.stringify(bartResponse, null, 2));
  console.log('\nMuni API Response:', JSON.stringify(muniResponse, null, 2));
  
  const bartDepartures = parseStopTimetableDepartures(bartResponse).filter(d => d.departureTime);
  const muniDepartures = parseStopTimetableDepartures(muniResponse).filter(d => d.departureTime && d.lineName?.includes('T'));
  
  console.log('\nParsed BART departures:', bartDepartures.length);
  bartDepartures.forEach((d, i) => {
    console.log(`  BART ${i}: ${d.lineName} at ${d.departureTime} (${new Date(d.departureTime).toLocaleString()})`);
  });
  
  console.log('\nParsed Muni departures:', muniDepartures.length);
  muniDepartures.forEach((d, i) => {
    console.log(`  Muni ${i}: ${d.lineName} at ${d.departureTime} (${new Date(d.departureTime).toLocaleString()})`);
  });

  // A* priority queue (min-heap based on f = g + h)
  const openSet = new MinHeap<State>((a, b) => 
    (a.cost + heuristic(a, driveTimeMinutes, config)) - (b.cost + heuristic(b, driveTimeMinutes, config))
  );

  // Track best cost to reach each state
  const gScore = new Map<string, number>();

  // Start states: any departure time within window (every 5 minutes) 
  // Convert back to Pacific time for the A* search since all our logic expects Pacific time
  const pacificWindowStart = new Date(windowStart.getTime() - 8*60*60*1000);
  const pacificWindowEnd = new Date(windowEnd.getTime() - 8*60*60*1000);
  
  console.log('\nGenerating start states...');
  const windowDurationMinutes = getMinutesDiff(pacificWindowEnd, pacificWindowStart);
  console.log('Window duration minutes:', windowDurationMinutes);
  
  for (let minutes = 0; minutes <= windowDurationMinutes; minutes += 5) {
    const departTime = addMinutes(pacificWindowStart, minutes);
    const startState: State = {
      location: config.startLocation,
      time: departTime,
      cost: 0
    };
    console.log(`  Start state ${minutes}min: ${config.startLocation} at ${departTime.toISOString()}`);
    openSet.push(startState);
    gScore.set(getStateKey(startState), 0);
  }

  const solutions: State[] = [];
  let iterations = 0;
  
  console.log('\nStarting A* search...');

  while (!openSet.isEmpty() && solutions.length < 3) {
    const current = openSet.pop()!;
    iterations++;
    
    if (iterations <= 10) {
      console.log(`\nIteration ${iterations}:`);
      console.log(`  Current state: ${current.location} at ${current.time.toISOString()} (cost: ${current.cost})`);
    }

    // Goal reached
    if (current.location === config.endLocation) {
      console.log(`  ✓ SOLUTION FOUND! Total cost: ${current.cost} minutes`);
      solutions.push(current);
      continue;
    }

    // Generate neighbors based on current location
    const neighbors = getNeighbors(current, bartDepartures, muniDepartures, driveTimeMinutes, config);
    
    if (iterations <= 10) {
      console.log(`  Generated ${neighbors.length} neighbors`);
      neighbors.forEach((n, i) => {
        console.log(`    Neighbor ${i}: ${n.location} at ${n.time.toISOString()} (cost: ${n.cost})`);
      });
    }

    for (const neighbor of neighbors) {
      const tentativeGScore = neighbor.cost;
      const neighborKey = getStateKey(neighbor);

      if (!gScore.has(neighborKey) || tentativeGScore < gScore.get(neighborKey)!) {
        gScore.set(neighborKey, tentativeGScore);
        neighbor.parent = current;
        openSet.push(neighbor);
      }
    }
  }

  console.log(`\nA* search completed after ${iterations} iterations`);
  console.log(`Found ${solutions.length} solutions`);
  
  if (solutions.length === 0) {
    console.log('\n=== NO SOLUTIONS FOUND ANALYSIS ===');
    console.log('Possible reasons:');
    console.log('1. No BART/Muni departures available in the time window');
    console.log('2. Transit connections don\'t align properly');
    console.log('3. Departure window too narrow');
    console.log('4. API returned no data or incorrect data');
  }

  // Convert solutions to response format
  const result = formatSolutions(solutions, bartDepartures, muniDepartures, config);
  console.log('\n=== OPTIMIZER DEBUG END ===\n');
  return result;
}
