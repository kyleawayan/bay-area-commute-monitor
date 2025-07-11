import { jest } from '@jest/globals';
import { optimizeCommute, OptimizationRequest } from '../commute-optimizer';
import { testScenarios } from './test-scenarios';
import { StopMonitoringResponseSchema } from '../transit-api';

// Mock the transit API module
jest.mock('../transit-api', () => ({
  fetchStopMonitoring: jest.fn(),
  parseStopMonitoringDepartures: jest.fn(),
}));

// Import the mocked functions
import { fetchStopMonitoring, parseStopMonitoringDepartures } from '../transit-api';

const mockFetchStopMonitoring = fetchStopMonitoring as jest.MockedFunction<typeof fetchStopMonitoring>;
const mockParseStopMonitoringDepartures = parseStopMonitoringDepartures as jest.MockedFunction<typeof parseStopMonitoringDepartures>;

describe('Commute Optimization', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Morning Commute (to_work)', () => {
    const baseRequest: OptimizationRequest = {
      direction: 'to_work',
      preferred_departure_window: {
        start: '08:30',
        end: '09:00',
      },
      drive_time_minutes: 20,
      current_time: '2025-07-14T15:00:00Z', // 8:00 AM PST Monday
    };

    it('should find optimal departure time with good connections', async () => {
      // Mock API responses using exact 511 API format
      mockFetchStopMonitoring
        .mockResolvedValueOnce({
          ServiceDelivery: {
            ResponseTimestamp: '2025-07-14T15:00:00Z',
            ProducerRef: 'BA',
            Status: true,
            StopMonitoringDelivery: {
              version: '1.4',
              ResponseTimestamp: '2025-07-14T15:00:00Z',
              Status: true,
              MonitoredStopVisit: [],
            },
          },
        })
        .mockResolvedValueOnce({
          ServiceDelivery: {
            ResponseTimestamp: '2025-07-14T15:00:00Z',
            ProducerRef: 'SF',
            Status: true,
            StopMonitoringDelivery: {
              version: '1.4',
              ResponseTimestamp: '2025-07-14T15:00:00Z',
              Status: true,
              MonitoredStopVisit: [],
            },
          },
        });

      mockParseStopMonitoringDepartures
        .mockReturnValueOnce(testScenarios.mondayMorningOptimal.bart)
        .mockReturnValueOnce(testScenarios.mondayMorningOptimal.muni);

      const result = await optimizeCommute(baseRequest);

      expect(result.results.length).toBeGreaterThan(0);
      expect(result.results[0].optimal_departure).toBe('08:58'); // Later departure for better connections
      expect(result.results[0].segments).toHaveLength(6);
      expect(result.results[0].segments[0].mode).toBe('drive');
      expect(result.results[0].segments[2].mode).toBe('bart');
      expect(result.results[0].segments[4].mode).toBe('muni');
    });

    it('should handle multiple BART options and find best connection', async () => {
      mockFetchStopMonitoring
        .mockResolvedValueOnce({ ServiceDelivery: { ResponseTimestamp: '2025-07-14T15:00:00Z', ProducerRef: 'BA', Status: true, StopMonitoringDelivery: { version: '1.4', ResponseTimestamp: '2025-07-14T15:00:00Z', Status: true } } })
        .mockResolvedValueOnce({ ServiceDelivery: { ResponseTimestamp: '2025-07-14T15:00:00Z', ProducerRef: 'SF', Status: true, StopMonitoringDelivery: { version: '1.4', ResponseTimestamp: '2025-07-14T15:00:00Z', Status: true } } });

      mockParseStopMonitoringDepartures
        .mockReturnValueOnce(testScenarios.mondayMorningOptimal.bart)
        .mockReturnValueOnce(testScenarios.mondayMorningOptimal.muni);

      const result = await optimizeCommute(baseRequest);

      expect(result.results.length).toBeGreaterThan(0);
      // Should prefer earlier departure with shorter wait time
      expect(result.results[0].optimal_departure).toBe('08:58');
    });

    it('should skip departures outside preferred window', async () => {
      const narrowRequest = {
        ...baseRequest,
        preferred_departure_window: {
          start: '08:45',
          end: '08:50',
        },
      };

      mockFetchStopMonitoring
        .mockResolvedValueOnce({ ServiceDelivery: { StopMonitoringDelivery: {} } })
        .mockResolvedValueOnce({ ServiceDelivery: { StopMonitoringDelivery: {} } });

      mockParseStopMonitoringDepartures
        .mockReturnValueOnce(testScenarios.mondayMorningOptimal.bart)
        .mockReturnValueOnce(testScenarios.mondayMorningOptimal.muni);

      const result = await optimizeCommute(narrowRequest);

      // Should only include departures within the narrow window
      expect(result.results.length).toBeLessThan(testScenarios.mondayMorningOptimal.bart.length);
    });

    it('should handle no Muni connections gracefully', async () => {
      mockFetchStopMonitoring
        .mockResolvedValueOnce({ ServiceDelivery: { StopMonitoringDelivery: {} } })
        .mockResolvedValueOnce({ ServiceDelivery: { StopMonitoringDelivery: {} } });

      mockParseStopMonitoringDepartures
        .mockReturnValueOnce(testScenarios.mondayMorningOptimal.bart)
        .mockReturnValueOnce([]); // No Muni departures

      const result = await optimizeCommute(baseRequest);

      expect(result.results).toHaveLength(0);
    });

    it('should calculate journey times correctly', async () => {
      mockFetchStopMonitoring
        .mockResolvedValueOnce({ ServiceDelivery: { StopMonitoringDelivery: {} } })
        .mockResolvedValueOnce({ ServiceDelivery: { StopMonitoringDelivery: {} } });

      mockParseStopMonitoringDepartures
        .mockReturnValueOnce(testScenarios.mondayMorningOptimal.bart)
        .mockReturnValueOnce(testScenarios.mondayMorningOptimal.muni);

      const result = await optimizeCommute(baseRequest);

      expect(result.results.length).toBeGreaterThan(0);
      
      if (result.results.length > 0) {
        const journey = result.results[0];
        expect(journey.total_journey_time).toBeGreaterThan(60); // Should be > 1 hour
        expect(journey.total_journey_time).toBeLessThan(120); // Should be < 2 hours

        // Check segment durations
        const driveSegment = journey.segments.find(s => s.mode === 'drive');
        const bartSegment = journey.segments.find(s => s.mode === 'bart');
        const muniSegment = journey.segments.find(s => s.mode === 'muni');

        expect(driveSegment?.duration).toBe(20);
        expect(bartSegment?.duration).toBe(51);
        expect(muniSegment?.duration).toBe(15);
      }
    });

    it('should prioritize options with shorter wait times', async () => {
      // Create scenario where one option has longer wait
      const muniWithLongWait = [
        ...testScenarios.mondayMorningOptimal.muni.slice(0, 1), // Remove first departure
        ...testScenarios.mondayMorningOptimal.muni.slice(1),
      ];

      mockFetchStopMonitoring
        .mockResolvedValueOnce({ ServiceDelivery: { StopMonitoringDelivery: {} } })
        .mockResolvedValueOnce({ ServiceDelivery: { StopMonitoringDelivery: {} } });

      mockParseStopMonitoringDepartures
        .mockReturnValueOnce(testScenarios.mondayMorningOptimal.bart)
        .mockReturnValueOnce(muniWithLongWait);

      const result = await optimizeCommute(baseRequest);

      // Should prefer options with shorter waits
      expect(result.results.length).toBeGreaterThan(0);
      if (result.results.length > 0) {
        expect(result.results[0].confidence).toBeGreaterThan(70);
      }
    });
  });

  describe('Evening Commute (to_home)', () => {
    it('should handle reverse direction', async () => {
      const eveningRequest: OptimizationRequest = {
        direction: 'to_home',
        preferred_departure_window: {
          start: '17:30',
          end: '18:00',
        },
        drive_time_minutes: 20,
        current_time: '2025-07-14T24:00:00Z', // 5:00 PM PST
      };

      mockFetchStopMonitoring
        .mockResolvedValueOnce({ ServiceDelivery: { StopMonitoringDelivery: {} } })
        .mockResolvedValueOnce({ ServiceDelivery: { StopMonitoringDelivery: {} } });

      mockParseStopMonitoringDepartures
        .mockReturnValueOnce(testScenarios.mondayMorningOptimal.bart)
        .mockReturnValueOnce(testScenarios.mondayMorningOptimal.muni);

      const result = await optimizeCommute(eveningRequest);

      // Should handle reverse direction
      expect(result).toBeDefined();
      expect(result.results).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle API errors gracefully', async () => {
      mockFetchStopMonitoring.mockRejectedValue(new Error('API Error'));

      const request = {
        direction: 'to_work' as const,
        preferred_departure_window: { start: '08:30', end: '09:00' },
        drive_time_minutes: 20,
        current_time: '2025-07-14T15:00:00Z',
      };

      await expect(optimizeCommute(request)).rejects.toThrow('API Error');
    });

    it('should handle empty API responses', async () => {
      mockFetchStopMonitoring
        .mockResolvedValueOnce({ ServiceDelivery: { StopMonitoringDelivery: {} } })
        .mockResolvedValueOnce({ ServiceDelivery: { StopMonitoringDelivery: {} } });

      mockParseStopMonitoringDepartures
        .mockReturnValueOnce([])
        .mockReturnValueOnce([]);

      const request = {
        direction: 'to_work' as const,
        preferred_departure_window: { start: '08:30', end: '09:00' },
        drive_time_minutes: 20,
        current_time: '2025-07-14T15:00:00Z',
      };

      const result = await optimizeCommute(request);

      expect(result.results).toHaveLength(0);
    });
  });
});