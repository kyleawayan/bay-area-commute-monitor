import { fetchStopMonitoring, parseStopMonitoringDepartures } from './transit-api';
import { TRAVEL_TIMES, WALK_TIMES, STOP_CODES } from './commute-optimizer';
import type { OptimizationRequest, OptimizationResponse, OptimizationResult, JourneySegment } from './commute-optimizer';

interface State {
  location: 'home' | 'parking' | 'bart' | 'muni' | 'office';
  time: Date;
  cost: number; // Total time elapsed
  parent?: State;
  // Which specific departure we're taking
  bartDeparture?: any;
  muniDeparture?: any;
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

function parseTime(timeStr: string, baseDate: string): Date {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const baseDateTime = new Date(baseDate);
  const targetTime = new Date(baseDateTime);
  targetTime.setHours(hours, minutes, 0, 0);
  
  if (targetTime <= baseDateTime) {
    targetTime.setDate(targetTime.getDate() + 1);
  }
  
  return targetTime;
}

function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60000);
}

function getMinutesDiff(later: Date, earlier: Date): number {
  return Math.round((later.getTime() - earlier.getTime()) / 60000);
}

function formatTime(date: Date): string {
  return date.toTimeString().slice(0, 5);
}

function getStateKey(state: State): string {
  return `${state.location}-${state.time.getTime()}`;
}

function heuristic(state: State, request: OptimizationRequest): number {
  // Optimistic estimate of remaining time to destination
  switch (state.location) {
    case 'home':
      return request.drive_time_minutes + WALK_TIMES.parking_to_bart + 
             TRAVEL_TIMES.bart.north_concord_to_powell + WALK_TIMES.bart_to_muni +
             TRAVEL_TIMES.muni.union_square_to_ucsf + WALK_TIMES.muni_to_office;
    case 'parking':
      return WALK_TIMES.parking_to_bart + TRAVEL_TIMES.bart.north_concord_to_powell + 
             WALK_TIMES.bart_to_muni + TRAVEL_TIMES.muni.union_square_to_ucsf + 
             WALK_TIMES.muni_to_office;
    case 'bart':
      return TRAVEL_TIMES.bart.north_concord_to_powell + WALK_TIMES.bart_to_muni +
             TRAVEL_TIMES.muni.union_square_to_ucsf + WALK_TIMES.muni_to_office;
    case 'muni':
      return TRAVEL_TIMES.muni.union_square_to_ucsf + WALK_TIMES.muni_to_office;
    case 'office':
      return 0;
    default:
      return 0;
  }
}

function getNeighbors(state: State, bartDeps: any[], muniDeps: any[], request: OptimizationRequest): State[] {
  const neighbors: State[] = [];
  
  switch (state.location) {
    case 'home':
      // Next: drive to parking
      neighbors.push({
        location: 'parking',
        time: addMinutes(state.time, request.drive_time_minutes),
        cost: state.cost + request.drive_time_minutes,
        parent: state
      });
      break;

    case 'parking':
      // Next: walk to BART
      neighbors.push({
        location: 'bart',
        time: addMinutes(state.time, WALK_TIMES.parking_to_bart),
        cost: state.cost + WALK_TIMES.parking_to_bart,
        parent: state
      });
      break;

    case 'bart':
      // Next: take BART (must wait for next departure)
      const bartArrivalTime = state.time;
      const nextBart = bartDeps.find(d => 
        new Date(d.departureTime!) >= bartArrivalTime
      );
      
      if (nextBart) {
        const bartDepTime = new Date(nextBart.departureTime!);
        const waitTime = getMinutesDiff(bartDepTime, bartArrivalTime);
        
        neighbors.push({
          location: 'muni',
          time: addMinutes(bartDepTime, TRAVEL_TIMES.bart.north_concord_to_powell + 
                                       WALK_TIMES.bart_to_muni),
          cost: state.cost + waitTime + TRAVEL_TIMES.bart.north_concord_to_powell + 
                WALK_TIMES.bart_to_muni,
          parent: state,
          bartDeparture: nextBart
        });
      }
      break;

    case 'muni':
      // Next: take Muni
      const muniArrivalTime = state.time;
      const nextMuni = muniDeps.find(d => 
        new Date(d.departureTime!) >= muniArrivalTime
      );
      
      if (nextMuni) {
        const muniDepTime = new Date(nextMuni.departureTime!);
        const waitTime = getMinutesDiff(muniDepTime, muniArrivalTime);
        
        neighbors.push({
          location: 'office',
          time: addMinutes(muniDepTime, TRAVEL_TIMES.muni.union_square_to_ucsf + 
                                       WALK_TIMES.muni_to_office),
          cost: state.cost + waitTime + TRAVEL_TIMES.muni.union_square_to_ucsf + 
                WALK_TIMES.muni_to_office,
          parent: state,
          muniDeparture: nextMuni
        });
      }
      break;
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

function formatSolutions(solutions: State[], bartDepartures: any[], muniDepartures: any[]): OptimizationResponse {
  const results: OptimizationResult[] = [];
  
  for (const solution of solutions) {
    const path = reconstructPath(solution);
    const segments: JourneySegment[] = [];
    
    // Build segments from path
    for (let i = 0; i < path.length - 1; i++) {
      const current = path[i];
      const next = path[i + 1];
      
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
        const bartArrTime = addMinutes(bartDepTime, TRAVEL_TIMES.bart.north_concord_to_powell);
        
        segments.push({
          mode: 'bart',
          from: 'North Concord BART',
          to: 'Powell St BART',
          duration: TRAVEL_TIMES.bart.north_concord_to_powell,
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
        const muniArrTime = addMinutes(muniDepTime, TRAVEL_TIMES.muni.union_square_to_ucsf);
        
        segments.push({
          mode: 'muni',
          from: 'Union Square Muni',
          to: 'UCSF/Chase Center',
          duration: TRAVEL_TIMES.muni.union_square_to_ucsf,
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

export async function optimizeCommuteAStar(request: OptimizationRequest): Promise<OptimizationResponse> {
  const currentTime = new Date(request.current_time);
  const windowStart = parseTime(request.preferred_departure_window.start, request.current_time);
  const windowEnd = parseTime(request.preferred_departure_window.end, request.current_time);

  // Fetch all departures upfront
  const [bartDepartures, muniDepartures] = await Promise.all([
    fetchStopMonitoring('BA', STOP_CODES.bart.north_concord).then(r => 
      parseStopMonitoringDepartures(r).filter(d => d.departureTime)
    ),
    fetchStopMonitoring('SF', STOP_CODES.muni.union_square_northbound).then(r =>
      parseStopMonitoringDepartures(r).filter(d => d.departureTime && d.lineName?.includes('T'))
    )
  ]);

  // A* priority queue (min-heap based on f = g + h)
  const openSet = new MinHeap<State>((a, b) => 
    (a.cost + heuristic(a, request)) - (b.cost + heuristic(b, request))
  );

  // Track best cost to reach each state
  const gScore = new Map<string, number>();

  // Start states: any departure time within window (every 5 minutes)
  for (let minutes = 0; minutes <= getMinutesDiff(windowEnd, windowStart); minutes += 5) {
    const departTime = addMinutes(windowStart, minutes);
    const startState: State = {
      location: 'home',
      time: departTime,
      cost: 0
    };
    openSet.push(startState);
    gScore.set(getStateKey(startState), 0);
  }

  const solutions: State[] = [];

  while (!openSet.isEmpty() && solutions.length < 3) {
    const current = openSet.pop()!;

    // Goal reached
    if (current.location === 'office') {
      solutions.push(current);
      continue;
    }

    // Generate neighbors based on current location
    const neighbors = getNeighbors(current, bartDepartures, muniDepartures, request);

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

  // Convert solutions to response format
  return formatSolutions(solutions, bartDepartures, muniDepartures);
}