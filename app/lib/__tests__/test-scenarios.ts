// Test scenarios for different commute times and conditions

export const mondayMorningBartDepartures = [
  {
    lineRef: 'Yellow-N',
    lineName: 'Warm Springs/South Fremont to Daly City',
    direction: 'N',
    origin: 'Warm Springs/South Fremont',
    destination: 'Daly City',
    departureTime: '2025-07-14T15:35:00Z', // 8:35 AM PST
    arrivalTime: '2025-07-14T15:34:00Z',
    vehicleRef: 'BART123',
    occupancy: 'seatsAvailable',
  },
  {
    lineRef: 'Yellow-N',
    lineName: 'Warm Springs/South Fremont to Daly City',
    direction: 'N',
    origin: 'Warm Springs/South Fremont',
    destination: 'Daly City',
    departureTime: '2025-07-14T15:45:00Z', // 8:45 AM PST
    arrivalTime: '2025-07-14T15:44:00Z',
    vehicleRef: 'BART124',
    occupancy: 'seatsAvailable',
  },
  {
    lineRef: 'Yellow-N',
    lineName: 'Warm Springs/South Fremont to Daly City',
    direction: 'N',
    origin: 'Warm Springs/South Fremont',
    destination: 'Daly City',
    departureTime: '2025-07-14T15:55:00Z', // 8:55 AM PST
    arrivalTime: '2025-07-14T15:54:00Z',
    vehicleRef: 'BART125',
    occupancy: 'seatsAvailable',
  },
  {
    lineRef: 'Yellow-N',
    lineName: 'Warm Springs/South Fremont to Daly City',
    direction: 'N',
    origin: 'Warm Springs/South Fremont',
    destination: 'Daly City',
    departureTime: '2025-07-14T16:05:00Z', // 9:05 AM PST
    arrivalTime: '2025-07-14T16:04:00Z',
    vehicleRef: 'BART126',
    occupancy: 'seatsAvailable',
  },
  {
    lineRef: 'Yellow-N',
    lineName: 'Warm Springs/South Fremont to Daly City',
    direction: 'N',
    origin: 'Warm Springs/South Fremont',
    destination: 'Daly City',
    departureTime: '2025-07-14T16:15:00Z', // 9:15 AM PST
    arrivalTime: '2025-07-14T16:14:00Z',
    vehicleRef: 'BART127',
    occupancy: 'seatsAvailable',
  },
];

export const mondayMorningMuniDepartures = [
  {
    lineRef: 'T',
    lineName: 'T Third Street',
    direction: 'N',
    origin: 'Bayshore Blvd & Sunnydale Ave',
    destination: 'Chinatown - Rose Pak Station',
    departureTime: '2025-07-14T16:15:00Z', // 9:15 AM PST
    arrivalTime: '2025-07-14T16:14:00Z',
    vehicleRef: 'MUNI2024',
    occupancy: 'seatsAvailable',
  },
  {
    lineRef: 'T',
    lineName: 'T Third Street',
    direction: 'N',
    origin: 'Bayshore Blvd & Sunnydale Ave',
    destination: 'Chinatown - Rose Pak Station',
    departureTime: '2025-07-14T16:25:00Z', // 9:25 AM PST
    arrivalTime: '2025-07-14T16:24:00Z',
    vehicleRef: 'MUNI2025',
    occupancy: 'seatsAvailable',
  },
  {
    lineRef: 'T',
    lineName: 'T Third Street',
    direction: 'N',
    origin: 'Bayshore Blvd & Sunnydale Ave',
    destination: 'Chinatown - Rose Pak Station',
    departureTime: '2025-07-14T16:35:00Z', // 9:35 AM PST
    arrivalTime: '2025-07-14T16:34:00Z',
    vehicleRef: 'MUNI2026',
    occupancy: 'seatsAvailable',
  },
  {
    lineRef: 'T',
    lineName: 'T Third Street',
    direction: 'N',
    origin: 'Bayshore Blvd & Sunnydale Ave',
    destination: 'Chinatown - Rose Pak Station',
    departureTime: '2025-07-14T16:45:00Z', // 9:45 AM PST
    arrivalTime: '2025-07-14T16:44:00Z',
    vehicleRef: 'MUNI2027',
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
    vehicleRef: 'BART201',
    occupancy: 'standingAvailable',
  },
  {
    lineRef: 'Yellow-N',
    lineName: 'Warm Springs/South Fremont to Daly City',
    direction: 'N',
    origin: 'Warm Springs/South Fremont',
    destination: 'Daly City',
    departureTime: '2025-07-14T15:22:00Z', // 8:22 AM PST
    arrivalTime: '2025-07-14T15:21:00Z',
    vehicleRef: 'BART202',
    occupancy: 'standingAvailable',
  },
  {
    lineRef: 'Yellow-N',
    lineName: 'Warm Springs/South Fremont to Daly City',
    direction: 'N',
    origin: 'Warm Springs/South Fremont',
    destination: 'Daly City',
    departureTime: '2025-07-14T15:32:00Z', // 8:32 AM PST
    arrivalTime: '2025-07-14T15:31:00Z',
    vehicleRef: 'BART203',
    occupancy: 'standingAvailable',
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
    vehicleRef: 'MUNI3001',
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
    vehicleRef: 'MUNI3002',
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
    vehicleRef: 'MUNI3003',
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
    vehicleRef: 'BART301',
    occupancy: 'seatsAvailable',
  },
  {
    lineRef: 'Yellow-N',
    lineName: 'Warm Springs/South Fremont to Daly City',
    direction: 'N',
    origin: 'Warm Springs/South Fremont',
    destination: 'Daly City',
    departureTime: '2025-07-14T17:00:00Z', // 10:00 AM PST
    arrivalTime: '2025-07-14T16:59:00Z',
    vehicleRef: 'BART302',
    occupancy: 'seatsAvailable',
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
    vehicleRef: 'MUNI4001',
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
    vehicleRef: 'MUNI4002',
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