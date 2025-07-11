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
    departureTime: '2025-07-14T16:36:00Z', // 9:36 AM PST - After BART arrival + walk
    arrivalTime: '2025-07-14T16:35:00Z',
    vehicleRef: '2024',
    occupancy: 'seatsAvailable',
  },
  {
    lineRef: 'T',
    lineName: 'T Third Street',
    direction: 'N',
    origin: 'Bayshore Blvd & Sunnydale Ave',
    destination: 'Chinatown - Rose Pak Station',
    departureTime: '2025-07-14T16:46:00Z', // 9:46 AM PST
    arrivalTime: '2025-07-14T16:45:00Z',
    vehicleRef: '2025',
    occupancy: 'seatsAvailable',
  },
  {
    lineRef: 'T',
    lineName: 'T Third Street',
    direction: 'N',
    origin: 'Bayshore Blvd & Sunnydale Ave',
    destination: 'Chinatown - Rose Pak Station',
    departureTime: '2025-07-14T16:56:00Z', // 9:56 AM PST
    arrivalTime: '2025-07-14T16:55:00Z',
    vehicleRef: '2026',
    occupancy: 'seatsAvailable',
  },
  {
    lineRef: 'T',
    lineName: 'T Third Street',
    direction: 'N',
    origin: 'Bayshore Blvd & Sunnydale Ave',
    destination: 'Chinatown - Rose Pak Station',
    departureTime: '2025-07-14T17:06:00Z', // 10:06 AM PST
    arrivalTime: '2025-07-14T17:05:00Z',
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
    departureTime: '2025-07-14T15:55:00Z', // 8:55 AM PST
    arrivalTime: '2025-07-14T15:54:00Z',
    vehicleRef: '3001',
    occupancy: 'standingAvailable',
  },
  {
    lineRef: 'T',
    lineName: 'T Third Street',
    direction: 'N',
    origin: 'Bayshore Blvd & Sunnydale Ave',
    destination: 'Chinatown - Rose Pak Station',
    departureTime: '2025-07-14T16:05:00Z', // 9:05 AM PST
    arrivalTime: '2025-07-14T16:04:00Z',
    vehicleRef: '3002',
    occupancy: 'standingAvailable',
  },
  {
    lineRef: 'T',
    lineName: 'T Third Street',
    direction: 'N',
    origin: 'Bayshore Blvd & Sunnydale Ave',
    destination: 'Chinatown - Rose Pak Station',
    departureTime: '2025-07-14T16:15:00Z', // 9:15 AM PST
    arrivalTime: '2025-07-14T16:14:00Z',
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
    departureTime: '2025-07-14T17:25:00Z', // 10:25 AM PST
    arrivalTime: '2025-07-14T17:24:00Z',
    vehicleRef: '4001',
    occupancy: 'seatsAvailable',
  },
  {
    lineRef: 'T',
    lineName: 'T Third Street',
    direction: 'N',
    origin: 'Bayshore Blvd & Sunnydale Ave',
    destination: 'Chinatown - Rose Pak Station',
    departureTime: '2025-07-14T17:40:00Z', // 10:40 AM PST
    arrivalTime: '2025-07-14T17:39:00Z',
    vehicleRef: '4002',
    occupancy: 'seatsAvailable',
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
};