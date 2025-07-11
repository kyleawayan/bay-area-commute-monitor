// Test scenarios for different commute times and conditions
// Using EXACT format from real 511 API responses

export const mondayMorningBartDepartures = [
  {
    lineRef: 'Yellow-N',
    lineName: 'Warm Springs/South Fremont to Daly City',
    direction: 'N',
    origin: 'Warm Springs/South Fremont',
    destination: 'Daly City',
    departureTime: '2025-07-14T15:53:00Z', // 8:53 AM PST - House departure: 8:30 AM
    arrivalTime: '2025-07-14T15:52:00Z',
    vehicleRef: null, // BART returns null for vehicleRef
    occupancy: null,  // BART returns null for occupancy
  },
  {
    lineRef: 'Yellow-N',
    lineName: 'Warm Springs/South Fremont to Daly City',
    direction: 'N',
    origin: 'Warm Springs/South Fremont',
    destination: 'Daly City',
    departureTime: '2025-07-14T16:08:00Z', // 9:08 AM PST - House departure: 8:45 AM
    arrivalTime: '2025-07-14T16:07:00Z',
    vehicleRef: null,
    occupancy: null,
  },
  {
    lineRef: 'Yellow-N',
    lineName: 'Warm Springs/South Fremont to Daly City',
    direction: 'N',
    origin: 'Warm Springs/South Fremont',
    destination: 'Daly City',
    departureTime: '2025-07-14T16:23:00Z', // 9:23 AM PST - House departure: 9:00 AM
    arrivalTime: '2025-07-14T16:22:00Z',
    vehicleRef: null,
    occupancy: null,
  },
  {
    lineRef: 'Yellow-N',
    lineName: 'Warm Springs/South Fremont to Daly City',
    direction: 'N',
    origin: 'Warm Springs/South Fremont',
    destination: 'Daly City',
    departureTime: '2025-07-14T16:38:00Z', // 9:38 AM PST - House departure: 9:15 AM (outside window)
    arrivalTime: '2025-07-14T16:37:00Z',
    vehicleRef: null,
    occupancy: null,
  },
  {
    lineRef: 'Yellow-N',
    lineName: 'Warm Springs/South Fremont to Daly City',
    direction: 'N',
    origin: 'Warm Springs/South Fremont',
    destination: 'Daly City',
    departureTime: '2025-07-14T16:53:00Z', // 9:53 AM PST - House departure: 9:30 AM (outside window)
    arrivalTime: '2025-07-14T16:52:00Z',
    vehicleRef: null,
    occupancy: null,
  },
];

export const mondayMorningMuniDepartures = [
  {
    lineRef: 'T',
    lineName: 'T Third Street',
    direction: 'N',
    origin: 'Bayshore Blvd & Sunnydale Ave',
    destination: 'Chinatown - Rose Pak Station',
    departureTime: '2025-07-14T16:55:00Z', // 9:55 AM PST - After BART arrival + walk
    arrivalTime: '2025-07-14T16:54:00Z',
    vehicleRef: '2024',
    occupancy: 'seatsAvailable',
  },
  {
    lineRef: 'T',
    lineName: 'T Third Street',
    direction: 'N',
    origin: 'Bayshore Blvd & Sunnydale Ave',
    destination: 'Chinatown - Rose Pak Station',
    departureTime: '2025-07-14T17:05:00Z', // 10:05 AM PST
    arrivalTime: '2025-07-14T17:04:00Z',
    vehicleRef: '2025',
    occupancy: 'seatsAvailable',
  },
  {
    lineRef: 'T',
    lineName: 'T Third Street',
    direction: 'N',
    origin: 'Bayshore Blvd & Sunnydale Ave',
    destination: 'Chinatown - Rose Pak Station',
    departureTime: '2025-07-14T17:15:00Z', // 10:15 AM PST
    arrivalTime: '2025-07-14T17:14:00Z',
    vehicleRef: '2026',
    occupancy: 'seatsAvailable',
  },
  {
    lineRef: 'T',
    lineName: 'T Third Street',
    direction: 'N',
    origin: 'Bayshore Blvd & Sunnydale Ave',
    destination: 'Chinatown - Rose Pak Station',
    departureTime: '2025-07-14T17:25:00Z', // 10:25 AM PST
    arrivalTime: '2025-07-14T17:24:00Z',
    vehicleRef: '2027',
    occupancy: 'seatsAvailable',
  },
];

export const rushhourBartDepartures = [
  {
    lineRef: 'Yellow-N',
    lineName: 'Warm Springs/South Fremont to Daly City',
    direction: 'N',
    origin: 'Warm Springs/South Fremont',
    destination: 'Daly City',
    departureTime: '2025-07-14T15:12:00Z', // 8:12 AM PST
    arrivalTime: '2025-07-14T15:11:00Z',
    vehicleRef: null,
    occupancy: null,
  },
  {
    lineRef: 'Yellow-N',
    lineName: 'Warm Springs/South Fremont to Daly City',
    direction: 'N',
    origin: 'Warm Springs/South Fremont',
    destination: 'Daly City',
    departureTime: '2025-07-14T15:22:00Z', // 8:22 AM PST
    arrivalTime: '2025-07-14T15:21:00Z',
    vehicleRef: null,
    occupancy: null,
  },
  {
    lineRef: 'Yellow-N',
    lineName: 'Warm Springs/South Fremont to Daly City',
    direction: 'N',
    origin: 'Warm Springs/South Fremont',
    destination: 'Daly City',
    departureTime: '2025-07-14T15:32:00Z', // 8:32 AM PST
    arrivalTime: '2025-07-14T15:31:00Z',
    vehicleRef: null,
    occupancy: null,
  },
];

export const rushhourMuniDepartures = [
  {
    lineRef: 'T',
    lineName: 'T Third Street',
    direction: 'N',
    origin: 'Bayshore Blvd & Sunnydale Ave',
    destination: 'Chinatown - Rose Pak Station',
    departureTime: '2025-07-14T16:31:00Z', // 9:31 AM PST - After 8:32 BART + 51 min + 8 min walk
    arrivalTime: '2025-07-14T16:30:00Z',
    vehicleRef: '3001',
    occupancy: 'standingAvailable',
  },
  {
    lineRef: 'T',
    lineName: 'T Third Street',
    direction: 'N',
    origin: 'Bayshore Blvd & Sunnydale Ave',
    destination: 'Chinatown - Rose Pak Station',
    departureTime: '2025-07-14T16:35:00Z', // 9:35 AM PST
    arrivalTime: '2025-07-14T16:34:00Z',
    vehicleRef: '3002',
    occupancy: 'standingAvailable',
  },
  {
    lineRef: 'T',
    lineName: 'T Third Street',
    direction: 'N',
    origin: 'Bayshore Blvd & Sunnydale Ave',
    destination: 'Chinatown - Rose Pak Station',
    departureTime: '2025-07-14T16:40:00Z', // 9:40 AM PST
    arrivalTime: '2025-07-14T16:39:00Z',
    vehicleRef: '3003',
    occupancy: 'standingAvailable',
  },
];

export const lateStartBartDepartures = [
  {
    lineRef: 'Yellow-N',
    lineName: 'Warm Springs/South Fremont to Daly City',
    direction: 'N',
    origin: 'Warm Springs/South Fremont',
    destination: 'Daly City',
    departureTime: '2025-07-14T16:45:00Z', // 9:45 AM PST
    arrivalTime: '2025-07-14T16:44:00Z',
    vehicleRef: null,
    occupancy: null,
  },
  {
    lineRef: 'Yellow-N',
    lineName: 'Warm Springs/South Fremont to Daly City',
    direction: 'N',
    origin: 'Warm Springs/South Fremont',
    destination: 'Daly City',
    departureTime: '2025-07-14T17:00:00Z', // 10:00 AM PST
    arrivalTime: '2025-07-14T16:59:00Z',
    vehicleRef: null,
    occupancy: null,
  },
];

export const lateStartMuniDepartures = [
  {
    lineRef: 'T',
    lineName: 'T Third Street',
    direction: 'N',
    origin: 'Bayshore Blvd & Sunnydale Ave',
    destination: 'Chinatown - Rose Pak Station',
    departureTime: '2025-07-14T17:44:00Z', // 10:44 AM PST - After 9:45 BART + 51 min + 8 min walk
    arrivalTime: '2025-07-14T17:43:00Z',
    vehicleRef: '4001',
    occupancy: 'seatsAvailable',
  },
  {
    lineRef: 'T',
    lineName: 'T Third Street',
    direction: 'N',
    origin: 'Bayshore Blvd & Sunnydale Ave',
    destination: 'Chinatown - Rose Pak Station',
    departureTime: '2025-07-14T17:54:00Z', // 10:54 AM PST
    arrivalTime: '2025-07-14T17:53:00Z',
    vehicleRef: '4002',
    occupancy: 'seatsAvailable',
  },
];

// Evening commute scenarios (to_home direction)
// Carefully calculated timing for office departure 5:00-5:30 PM

// CALCULATION FOR ALGORITHM:
// Algorithm departure window: 5:00-5:30 PM (every 5 minutes: 5:00, 5:05, 5:10, 5:15, 5:20, 5:25, 5:30)
// Office departure: 5:00 PM
// + 7min walk to UCSF/Chase Center Muni stop = 5:07 PM arrival
// Need Muni departure at 5:08 PM or later
// + 15min Muni travel = 5:23 PM arrive Union Square
// + 8min walk to Powell BART = 5:31 PM arrival  
// Need BART departure at 5:32 PM or later
// + 49min BART travel = 6:21 PM arrive North Concord
// + 5min walk to parking = 6:26 PM
// + 20min drive = 6:46 PM arrive home

export const mondayEveningMuniDepartures = [
  {
    lineRef: 'T',
    lineName: 'T Third Street',
    direction: 'S',
    origin: 'Chinatown - Rose Pak Station',
    destination: 'Bayshore Blvd & Sunnydale Ave',
    departureTime: '2025-07-15T00:08:00Z', // 5:08 PM PST - Office departure: 5:00 + 7min walk + 1min wait
    arrivalTime: '2025-07-15T00:07:00Z',
    vehicleRef: '2104',
    occupancy: 'seatsAvailable',
  },
  {
    lineRef: 'T',
    lineName: 'T Third Street',
    direction: 'S',
    origin: 'Chinatown - Rose Pak Station',
    destination: 'Bayshore Blvd & Sunnydale Ave',
    departureTime: '2025-07-15T00:18:00Z', // 5:18 PM PST
    arrivalTime: '2025-07-15T00:17:00Z',
    vehicleRef: '2105',
    occupancy: 'seatsAvailable',
  },
  {
    lineRef: 'T',
    lineName: 'T Third Street',
    direction: 'S',
    origin: 'Chinatown - Rose Pak Station',
    destination: 'Bayshore Blvd & Sunnydale Ave',
    departureTime: '2025-07-15T00:28:00Z', // 5:28 PM PST
    arrivalTime: '2025-07-15T00:27:00Z',
    vehicleRef: '2106',
    occupancy: 'seatsAvailable',
  },
  {
    lineRef: 'T',
    lineName: 'T Third Street',
    direction: 'S',
    origin: 'Chinatown - Rose Pak Station',
    destination: 'Bayshore Blvd & Sunnydale Ave',
    departureTime: '2025-07-15T00:38:00Z', // 5:38 PM PST
    arrivalTime: '2025-07-15T00:37:00Z',
    vehicleRef: '2107',
    occupancy: 'seatsAvailable',
  },
];

export const mondayEveningBartDepartures = [
  {
    lineRef: 'Yellow-N',
    lineName: 'Daly City to Antioch',
    direction: 'N',
    origin: 'Daly City',
    destination: 'Antioch',
    departureTime: '2025-07-15T00:32:00Z', // 5:32 PM PST - After 5:08 Muni + 15min + 8min walk + 1min wait
    arrivalTime: '2025-07-15T00:31:00Z',
    vehicleRef: null,
    occupancy: null,
  },
  {
    lineRef: 'Yellow-N',
    lineName: 'Daly City to Antioch',
    direction: 'N',
    origin: 'Daly City',
    destination: 'Antioch',
    departureTime: '2025-07-15T00:42:00Z', // 5:42 PM PST - Connects with 5:18 Muni
    arrivalTime: '2025-07-15T00:41:00Z',
    vehicleRef: null,
    occupancy: null,
  },
  {
    lineRef: 'Yellow-N',
    lineName: 'Daly City to Antioch',
    direction: 'N',
    origin: 'Daly City',
    destination: 'Antioch',
    departureTime: '2025-07-15T00:52:00Z', // 5:52 PM PST - Connects with 5:28 Muni
    arrivalTime: '2025-07-15T00:51:00Z',
    vehicleRef: null,
    occupancy: null,
  },
  {
    lineRef: 'Yellow-N',
    lineName: 'Daly City to Antioch',
    direction: 'N',
    origin: 'Daly City',
    destination: 'Antioch',
    departureTime: '2025-07-15T01:02:00Z', // 6:02 PM PST - Connects with 5:38 Muni
    arrivalTime: '2025-07-15T01:01:00Z',
    vehicleRef: null,
    occupancy: null,
  },
];

export const testScenarios = {
  mondayMorningOptimal: {
    bart: mondayMorningBartDepartures,
    muni: mondayMorningMuniDepartures,
    description: 'Optimal Monday morning with good connections',
  },
  rushhourCrowded: {
    bart: rushhourBartDepartures,
    muni: rushhourMuniDepartures,
    description: 'Rush hour with frequent trains but crowded',
  },
  lateStart: {
    bart: lateStartBartDepartures,
    muni: lateStartMuniDepartures,
    description: 'Late start with fewer options',
  },
  mondayEveningOptimal: {
    bart: mondayEveningBartDepartures,
    muni: mondayEveningMuniDepartures,
    description: 'Optimal Monday evening commute home',
  },
};