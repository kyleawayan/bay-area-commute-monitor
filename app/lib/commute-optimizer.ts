import { fetchStopMonitoring, parseStopMonitoringDepartures } from './transit-api';

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
    north_concord: '903702',
    powell: '901302',
  },
  muni: {
    union_square_northbound: '17877',
    ucsf_northbound: '17360',
    // TODO: Add southbound stops for evening commute
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
  const targetTime = new Date(baseDateTime);
  targetTime.setHours(hours, minutes, 0, 0);
  
  // If the target time is before current time, assume it's for the next day
  if (targetTime <= baseDateTime) {
    targetTime.setDate(targetTime.getDate() + 1);
  }
  
  return targetTime;
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

export async function optimizeCommute(request: OptimizationRequest): Promise<OptimizationResponse> {
  const currentTime = new Date(request.current_time);
  const windowStart = parseTime(request.preferred_departure_window.start, request.current_time);
  const windowEnd = parseTime(request.preferred_departure_window.end, request.current_time);

  // Determine which stops to use based on direction
  const bartOrigin = request.direction === 'to_work' 
    ? STOP_CODES.bart.north_concord 
    : STOP_CODES.bart.powell;
  
  const muniOrigin = request.direction === 'to_work'
    ? STOP_CODES.muni.union_square_northbound
    : STOP_CODES.muni.ucsf_northbound; // TODO: Need southbound stops

  const bartTravelTime = request.direction === 'to_work'
    ? TRAVEL_TIMES.bart.north_concord_to_powell
    : TRAVEL_TIMES.bart.powell_to_north_concord;

  const muniTravelTime = request.direction === 'to_work'
    ? TRAVEL_TIMES.muni.union_square_to_ucsf
    : TRAVEL_TIMES.muni.ucsf_to_union_square;

  // Fetch BART departures
  const bartResponse = await fetchStopMonitoring('BA', bartOrigin);
  const allBartDepartures = parseStopMonitoringDepartures(bartResponse)
    .filter(dep => dep.departureTime);
  
  
  const bartDepartures = allBartDepartures.slice(0, 6);

  // Fetch Muni departures
  const muniResponse = await fetchStopMonitoring('SF', muniOrigin);
  const allMuniDepartures = parseStopMonitoringDepartures(muniResponse)
    .filter(dep => dep.departureTime);
    
  
  const muniDepartures = allMuniDepartures
    .filter(dep => dep.lineName?.includes('T'))
    .slice(0, 8);

  const results: OptimizationResult[] = [];

  // Analyze each BART departure
  for (const bartDep of bartDepartures) {
    const bartDepartureTime = new Date(bartDep.departureTime!);
    
    // Calculate when we need to leave the house
    const driveArrivalTime = addMinutes(bartDepartureTime, -(WALK_TIMES.parking_to_bart));
    const houseDepartureTime = addMinutes(driveArrivalTime, -(request.drive_time_minutes));

    // Skip if outside preferred window
    if (houseDepartureTime < windowStart || houseDepartureTime > windowEnd) {
      continue;
    }

    // Calculate arrival at Muni station
    const bartArrivalTime = addMinutes(bartDepartureTime, bartTravelTime);
    const muniStationArrival = addMinutes(bartArrivalTime, WALK_TIMES.bart_to_muni);

    // Find next available Muni train
    const nextMuni = muniDepartures.find(muniDep => {
      const muniDepTime = new Date(muniDep.departureTime!);
      return muniDepTime >= muniStationArrival;
    });

    if (!nextMuni) {
      continue;
    }

    const muniDepartureTime = new Date(nextMuni.departureTime!);
    const muniWaitTime = getMinutesDiff(muniDepartureTime, muniStationArrival);
    const muniArrivalTime = addMinutes(muniDepartureTime, muniTravelTime);
    const officeArrivalTime = addMinutes(muniArrivalTime, WALK_TIMES.muni_to_office);

    const totalJourneyTime = getMinutesDiff(officeArrivalTime, houseDepartureTime);
    const bartWaitTime = getMinutesDiff(bartDepartureTime, driveArrivalTime);

    // Calculate confidence based on wait times
    const totalWaitTime = bartWaitTime + muniWaitTime;
    const confidence = Math.max(50, 100 - (totalWaitTime * 2));

    const segments: JourneySegment[] = [
      {
        mode: 'drive',
        from: 'house',
        to: 'north_concord_bart_parking',
        duration: request.drive_time_minutes,
        departure: formatTime(houseDepartureTime),
        arrival: formatTime(driveArrivalTime),
      },
      {
        mode: 'walk',
        from: 'parking',
        to: 'north_concord_bart',
        duration: WALK_TIMES.parking_to_bart,
        departure: formatTime(driveArrivalTime),
        arrival: formatTime(addMinutes(driveArrivalTime, WALK_TIMES.parking_to_bart)),
      },
      {
        mode: 'bart',
        from: 'north_concord',
        to: 'powell_st',
        duration: bartTravelTime,
        departure: formatTime(bartDepartureTime),
        arrival: formatTime(bartArrivalTime),
        wait_time: bartWaitTime,
        line: bartDep.lineName,
      },
      {
        mode: 'walk',
        from: 'powell_bart',
        to: 'union_square_muni',
        duration: WALK_TIMES.bart_to_muni,
        departure: formatTime(bartArrivalTime),
        arrival: formatTime(muniStationArrival),
      },
      {
        mode: 'muni',
        from: 'union_square',
        to: 'ucsf_chase',
        duration: muniTravelTime,
        departure: formatTime(muniDepartureTime),
        arrival: formatTime(muniArrivalTime),
        wait_time: muniWaitTime,
        line: nextMuni.lineName,
      },
      {
        mode: 'walk',
        from: 'ucsf_stop',
        to: 'office',
        duration: WALK_TIMES.muni_to_office,
        departure: formatTime(muniArrivalTime),
        arrival: formatTime(officeArrivalTime),
      },
    ];

    results.push({
      optimal_departure: formatTime(houseDepartureTime),
      total_journey_time: totalJourneyTime,
      arrival_time: formatTime(officeArrivalTime),
      confidence,
      segments,
    });
  }

  // Sort by total time + wait penalty
  results.sort((a, b) => {
    const waitPenaltyA = a.segments
      .filter(s => s.wait_time)
      .reduce((sum, s) => sum + (s.wait_time! > 5 ? s.wait_time! - 5 : 0), 0);
    const waitPenaltyB = b.segments
      .filter(s => s.wait_time)
      .reduce((sum, s) => sum + (s.wait_time! > 5 ? s.wait_time! - 5 : 0), 0);
    
    return (a.total_journey_time + waitPenaltyA) - (b.total_journey_time + waitPenaltyB);
  });

  
  return {
    results: results.slice(0, 3),
    raw_schedules: {
      bart_departures: bartDepartures,
      muni_departures: muniDepartures,
    },
  };
}
