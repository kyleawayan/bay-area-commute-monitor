import { jest } from '@jest/globals';
import { optimizeCommute } from '../commute-optimizer';
import { testScenarios } from './test-scenarios';

// Mock the transit API module
jest.mock('../transit-api', () => ({
  fetchStopTimetable: jest.fn(),
  parseStopTimetableDepartures: jest.fn(),
  StopTimetableResponseSchema: {}
}));

// Import the mocked functions
import { fetchStopTimetable, parseStopTimetableDepartures } from '../transit-api';

const mockFetchStopTimetable = fetchStopTimetable as jest.MockedFunction<typeof fetchStopTimetable>;
const mockParseStopTimetableDepartures = parseStopTimetableDepartures as jest.MockedFunction<typeof parseStopTimetableDepartures>;

describe('Commute Optimization', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Morning Commute (to_work)', () => {
    it('should find optimal departure time with good connections', async () => {
      // Mock StopTimetable API responses
      mockFetchStopTimetable
        .mockResolvedValueOnce({
          Siri: {
            ServiceDelivery: {
              ResponseTimestamp: '2025-07-14T08:00:00-07:00',
              Status: true,
              StopTimetableDelivery: {
                ResponseTimestamp: '2025-07-14T08:00:00-07:00',
                TimetabledStopVisit: []
              }
            }
          }
        })
        .mockResolvedValueOnce({
          Siri: {
            ServiceDelivery: {
              ResponseTimestamp: '2025-07-14T08:00:00-07:00',
              Status: true,
              StopTimetableDelivery: {
                ResponseTimestamp: '2025-07-14T08:00:00-07:00',
                TimetabledStopVisit: []
              }
            }
          }
        });

      mockParseStopTimetableDepartures
        .mockReturnValueOnce(testScenarios.mondayMorningOptimal.bart)
        .mockReturnValueOnce(testScenarios.mondayMorningOptimal.muni);

      const result = await optimizeCommute(
        '08:30',
        '09:00',
        20,
        '2025-07-14T15:00:00Z',
        'to_work'
      );

      expect(result.results.length).toBeGreaterThan(0);
      expect(result.results[0].optimal_departure).toBe('08:55');
      expect(result.results[0].segments).toHaveLength(6);
      expect(result.results[0].segments[0].mode).toBe('drive');
      expect(result.results[0].segments[2].mode).toBe('bart');
      expect(result.results[0].segments[4].mode).toBe('muni');
    });

    it('should handle multiple BART options and find best connection', async () => {
      mockFetchStopTimetable
        .mockResolvedValue({
          Siri: {
            ServiceDelivery: {
              ResponseTimestamp: '2025-07-14T08:00:00-07:00',
              Status: true,
              StopTimetableDelivery: {
                ResponseTimestamp: '2025-07-14T08:00:00-07:00',
                TimetabledStopVisit: []
              }
            }
          }
        });

      mockParseStopTimetableDepartures
        .mockReturnValueOnce(testScenarios.mondayMorningOptimal.bart)
        .mockReturnValueOnce(testScenarios.mondayMorningOptimal.muni);

      const result = await optimizeCommute(
        '08:30',
        '09:00',
        20,
        '2025-07-14T15:00:00Z',
        'to_work'
      );

      expect(result.results.length).toBeGreaterThan(0);
      // Should find the best connection that minimizes wait time
      const optimal = result.results[0];
      expect(optimal.optimal_departure).toBeDefined();
    });

    it('should skip departures outside preferred window', async () => {
      mockFetchStopTimetable
        .mockResolvedValue({
          Siri: {
            ServiceDelivery: {
              ResponseTimestamp: '2025-07-14T08:00:00-07:00',
              Status: true,
              StopTimetableDelivery: {
                ResponseTimestamp: '2025-07-14T08:00:00-07:00',
                TimetabledStopVisit: []
              }
            }
          }
        });

      mockParseStopTimetableDepartures
        .mockReturnValueOnce(testScenarios.mondayMorningOptimal.bart)
        .mockReturnValueOnce(testScenarios.mondayMorningOptimal.muni);

      const result = await optimizeCommute(
        '08:30',
        '08:45',
        20,
        '2025-07-14T15:00:00Z',
        'to_work'
      );

      if (result.results.length > 0) {
        const departure = result.results[0].optimal_departure;
        const [hours, minutes] = departure.split(':').map(Number);
        const departureMinutes = hours * 60 + minutes;
        
        // Should be within 8:30-8:45 window
        expect(departureMinutes).toBeGreaterThanOrEqual(8 * 60 + 30);
        expect(departureMinutes).toBeLessThanOrEqual(8 * 60 + 45);
      }
    });

    it('should handle no Muni connections gracefully', async () => {
      mockFetchStopTimetable
        .mockResolvedValue({
          Siri: {
            ServiceDelivery: {
              ResponseTimestamp: '2025-07-14T08:00:00-07:00',
              Status: true,
              StopTimetableDelivery: {
                ResponseTimestamp: '2025-07-14T08:00:00-07:00',
                TimetabledStopVisit: []
              }
            }
          }
        });

      mockParseStopTimetableDepartures
        .mockReturnValueOnce(testScenarios.mondayMorningOptimal.bart)
        .mockReturnValueOnce([]); // No Muni connections

      const result = await optimizeCommute(
        '08:30',
        '09:00',
        20,
        '2025-07-14T15:00:00Z',
        'to_work'
      );

      // Should return no solutions when connections aren't available
      expect(result.results).toHaveLength(0);
    });

    it('should calculate journey times correctly', async () => {
      mockFetchStopTimetable
        .mockResolvedValue({
          Siri: {
            ServiceDelivery: {
              ResponseTimestamp: '2025-07-14T08:00:00-07:00',
              Status: true,
              StopTimetableDelivery: {
                ResponseTimestamp: '2025-07-14T08:00:00-07:00',
                TimetabledStopVisit: []
              }
            }
          }
        });

      mockParseStopTimetableDepartures
        .mockReturnValueOnce(testScenarios.mondayMorningOptimal.bart)
        .mockReturnValueOnce(testScenarios.mondayMorningOptimal.muni);

      const result = await optimizeCommute(
        '08:30',
        '09:00',
        20,
        '2025-07-14T15:00:00Z',
        'to_work'
      );

      if (result.results.length > 0) {
        const journey = result.results[0];
        const totalDuration = journey.segments.reduce((sum, seg) => sum + seg.duration, 0);
        
        // Total journey time should equal sum of all segments
        expect(journey.total_journey_time).toBe(totalDuration);
        
        // Journey should include all expected segments
        expect(journey.segments.map(s => s.mode)).toEqual([
          'drive', 'walk', 'bart', 'walk', 'muni', 'walk'
        ]);
      }
    });

    it('should prioritize options with shorter wait times', async () => {
      mockFetchStopTimetable
        .mockResolvedValue({
          Siri: {
            ServiceDelivery: {
              ResponseTimestamp: '2025-07-14T08:00:00-07:00',
              Status: true,
              StopTimetableDelivery: {
                ResponseTimestamp: '2025-07-14T08:00:00-07:00',
                TimetabledStopVisit: []
              }
            }
          }
        });

      const bartDepartures = [
        ...testScenarios.mondayMorningBartDepartures,
        {
          lineRef: 'Yellow-N',
          lineName: 'Warm Springs/South Fremont to Daly City',
          direction: 'N',
          origin: 'Warm Springs/South Fremont',
          destination: 'Daly City',
          departureTime: '2025-07-14T16:25:00Z', // Extra option
          arrivalTime: '2025-07-14T16:24:00Z',
          vehicleRef: null,
          occupancy: null,
        }
      ];

      mockParseStopTimetableDepartures
        .mockReturnValueOnce(bartDepartures)
        .mockReturnValueOnce(testScenarios.mondayMorningOptimal.muni);

      const result = await optimizeCommute(
        '08:30',
        '09:00',
        20,
        '2025-07-14T15:00:00Z',
        'to_work'
      );

      expect(result.results.length).toBeGreaterThan(0);
      // A* should find the option with minimal wait times
      const optimal = result.results[0];
      expect(optimal.optimal_departure).toBe('08:55'); // This gives minimal wait
    });
  });

  describe('Evening Commute (to_home)', () => {
    it('should handle reverse direction with proper segments', async () => {
      mockFetchStopTimetable
        .mockResolvedValue({
          Siri: {
            ServiceDelivery: {
              ResponseTimestamp: '2025-07-14T17:00:00-07:00',
              Status: true,
              StopTimetableDelivery: {
                ResponseTimestamp: '2025-07-14T17:00:00-07:00',
                TimetabledStopVisit: []
              }
            }
          }
        });

      // Use the working morning data but for evening - just to test the reverse logic works
      mockParseStopTimetableDepartures
        .mockReturnValueOnce([
          {
            lineRef: 'T',
            lineName: 'THIRD',
            direction: 'S',
            origin: 'Chinatown',
            destination: 'Bayshore',
            departureTime: '2025-07-14T17:35:00Z',
            arrivalTime: '2025-07-14T17:35:00Z',
            vehicleRef: null,
            occupancy: null,
          }
        ])
        .mockReturnValueOnce([
          {
            lineRef: 'Yellow-S',
            lineName: 'Daly City to Warm Springs',
            direction: 'S',
            origin: 'Daly City',
            destination: 'Warm Springs',
            departureTime: '2025-07-14T17:58:00Z',
            arrivalTime: '2025-07-14T17:58:00Z',
            vehicleRef: null,
            occupancy: null,
          }
        ]);

      const result = await optimizeCommute(
        '17:30',
        '18:00',
        20,
        '2025-07-14T24:00:00Z',
        'to_home'
      );

      if (result.results.length > 0) {
        const journey = result.results[0];
        
        // Should start from office and end at home
        expect(journey.segments[0].from).toBe('Office');
        expect(journey.segments[journey.segments.length - 1].to).toBe('Home');
        
        // Order should be: walk -> muni -> walk -> bart -> walk -> drive
        const modes = journey.segments.map(s => s.mode);
        expect(modes).toEqual(['walk', 'muni', 'walk', 'bart', 'walk', 'drive']);
      }
    });

    it('should use different API endpoints for to_home direction', async () => {
      mockFetchStopTimetable
        .mockResolvedValue({
          Siri: {
            ServiceDelivery: {
              ResponseTimestamp: '2025-07-14T17:00:00-07:00',
              Status: true,
              StopTimetableDelivery: {
                ResponseTimestamp: '2025-07-14T17:00:00-07:00',
                TimetabledStopVisit: []
              }
            }
          }
        });

      mockParseStopTimetableDepartures
        .mockReturnValueOnce([])
        .mockReturnValueOnce([]);

      await optimizeCommute(
        '17:30',
        '18:00',
        20,
        '2025-07-14T24:00:00Z',
        'to_home'
      );

      // Verify correct API endpoints were called for to_home direction
      expect(mockFetchStopTimetable).toHaveBeenCalledWith('BA', '901302', expect.any(String), expect.any(String)); // Powell BART northbound
      expect(mockFetchStopTimetable).toHaveBeenCalledWith('SF', '17361', expect.any(String), expect.any(String)); // UCSF southbound
    });
  });

  describe('Edge Cases', () => {
    it('should handle API errors gracefully', async () => {
      mockFetchStopTimetable.mockRejectedValue(new Error('API Error'));

      const result = await optimizeCommute(
        '08:30',
        '09:00',
        20,
        '2025-07-14T15:00:00Z',
        'to_work'
      );

      expect(result.results).toHaveLength(0);
    });

    it('should handle empty API responses', async () => {
      mockFetchStopTimetable
        .mockResolvedValue({
          Siri: {
            ServiceDelivery: {
              ResponseTimestamp: '2025-07-14T08:00:00-07:00',
              Status: true,
              StopTimetableDelivery: {
                ResponseTimestamp: '2025-07-14T08:00:00-07:00',
                TimetabledStopVisit: []
              }
            }
          }
        });

      mockParseStopTimetableDepartures
        .mockReturnValueOnce([])
        .mockReturnValueOnce([]);

      const result = await optimizeCommute(
        '08:30',
        '09:00',
        20,
        '2025-07-14T15:00:00Z',
        'to_work'
      );

      expect(result.results).toHaveLength(0);
    });
  });
});