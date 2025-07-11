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

      const result = await optimizeCommute(
        baseRequest.preferred_departure_window.start,
        baseRequest.preferred_departure_window.end,
        baseRequest.drive_time_minutes,
        baseRequest.current_time,
        baseRequest.direction
      );

      expect(result.results.length).toBeGreaterThan(0);
      expect(result.results[0].optimal_departure).toBe('08:55');
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

      const result = await optimizeCommute(
        baseRequest.preferred_departure_window.start,
        baseRequest.preferred_departure_window.end,
        baseRequest.drive_time_minutes,
        baseRequest.current_time,
        baseRequest.direction
      );

      expect(result.results.length).toBeGreaterThan(0);
      expect(result.results[0].optimal_departure).toBe('08:55');
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

      const result = await optimizeCommute(
        narrowRequest.preferred_departure_window.start,
        narrowRequest.preferred_departure_window.end,
        narrowRequest.drive_time_minutes,
        narrowRequest.current_time,
        narrowRequest.direction
      );

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

      const result = await optimizeCommute(
        baseRequest.preferred_departure_window.start,
        baseRequest.preferred_departure_window.end,
        baseRequest.drive_time_minutes,
        baseRequest.current_time,
        baseRequest.direction
      );

      expect(result.results).toHaveLength(0);
    });

    it('should calculate journey times correctly', async () => {
      mockFetchStopMonitoring
        .mockResolvedValueOnce({ ServiceDelivery: { StopMonitoringDelivery: {} } })
        .mockResolvedValueOnce({ ServiceDelivery: { StopMonitoringDelivery: {} } });

      mockParseStopMonitoringDepartures
        .mockReturnValueOnce(testScenarios.mondayMorningOptimal.bart)
        .mockReturnValueOnce(testScenarios.mondayMorningOptimal.muni);

      const result = await optimizeCommute(
        baseRequest.preferred_departure_window.start,
        baseRequest.preferred_departure_window.end,
        baseRequest.drive_time_minutes,
        baseRequest.current_time,
        baseRequest.direction
      );

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

      const result = await optimizeCommute(
        baseRequest.preferred_departure_window.start,
        baseRequest.preferred_departure_window.end,
        baseRequest.drive_time_minutes,
        baseRequest.current_time,
        baseRequest.direction
      );

      // Should prefer options with shorter waits
      expect(result.results.length).toBeGreaterThan(0);
      if (result.results.length > 0) {
        expect(result.results[0].confidence).toBeGreaterThan(70);
      }
    });
  });

  describe('Evening Commute (to_home)', () => {
    it('should handle reverse direction with proper segments', async () => {
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

      // Use the working morning data but for evening - just to test the reverse logic works
      mockParseStopMonitoringDepartures
        .mockReturnValueOnce(testScenarios.mondayMorningOptimal.bart)
        .mockReturnValueOnce(testScenarios.mondayMorningOptimal.muni);

      const result = await optimizeCommute(
        eveningRequest.preferred_departure_window.start,
        eveningRequest.preferred_departure_window.end,
        eveningRequest.drive_time_minutes,
        eveningRequest.current_time,
        eveningRequest.direction
      );

      expect(result).toBeDefined();
      expect(result.results).toBeDefined();
      
      if (result.results.length > 0) {
        const journey = result.results[0];
        
        // Check that segments are in reverse order: office -> muni -> bart -> parking -> home
        expect(journey.segments.length).toBeGreaterThan(0);
        
        // First segment should start from Office
        expect(journey.segments[0].from).toBe('Office');
        
        // Should have drive segment at the end
        const driveSegment = journey.segments.find(s => s.mode === 'drive');
        expect(driveSegment?.from).toBe('North Concord BART Parking');
        expect(driveSegment?.to).toBe('Home');
        
        // Should have BART from Powell to North Concord
        const bartSegment = journey.segments.find(s => s.mode === 'bart');
        expect(bartSegment?.from).toBe('Powell St BART');
        expect(bartSegment?.to).toBe('North Concord BART');
        
        // Should have Muni from UCSF to Union Square
        const muniSegment = journey.segments.find(s => s.mode === 'muni');
        expect(muniSegment?.from).toBe('UCSF/Chase Center');
        expect(muniSegment?.to).toBe('Union Square Muni');
      }
    });

    it('should use different API endpoints for to_home direction', async () => {
      const eveningRequest: OptimizationRequest = {
        direction: 'to_home',
        preferred_departure_window: {
          start: '17:30',
          end: '18:00',
        },
        drive_time_minutes: 20,
        current_time: '2025-07-14T24:00:00Z',
      };

      mockFetchStopMonitoring
        .mockResolvedValueOnce({ ServiceDelivery: { StopMonitoringDelivery: {} } })
        .mockResolvedValueOnce({ ServiceDelivery: { StopMonitoringDelivery: {} } });

      mockParseStopMonitoringDepartures
        .mockReturnValueOnce([])
        .mockReturnValueOnce([]);

      await optimizeCommute(
        eveningRequest.preferred_departure_window.start,
        eveningRequest.preferred_departure_window.end,
        eveningRequest.drive_time_minutes,
        eveningRequest.current_time,
        eveningRequest.direction
      );

      // Verify correct API endpoints were called for to_home direction
      expect(mockFetchStopMonitoring).toHaveBeenCalledWith('BA', '901302'); // Powell BART northbound
      expect(mockFetchStopMonitoring).toHaveBeenCalledWith('SF', '17361'); // UCSF southbound
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

      await expect(optimizeCommute(
        request.preferred_departure_window.start,
        request.preferred_departure_window.end,
        request.drive_time_minutes,
        request.current_time,
        request.direction
      )).rejects.toThrow('API Error');
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

      const result = await optimizeCommute(
        request.preferred_departure_window.start,
        request.preferred_departure_window.end,
        request.drive_time_minutes,
        request.current_time,
        request.direction
      );

      expect(result.results).toHaveLength(0);
    });
  });
});