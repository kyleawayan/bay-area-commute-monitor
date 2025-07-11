import { z } from 'zod';

// Zod schema for 511 API StopMonitoring response
export const StopMonitoringResponseSchema = z.object({
  ServiceDelivery: z.object({
    ResponseTimestamp: z.string(),
    ProducerRef: z.string(),
    Status: z.boolean(),
    StopMonitoringDelivery: z.object({
      version: z.string(),
      ResponseTimestamp: z.string(),
      Status: z.boolean(),
      MonitoredStopVisit: z.array(z.object({
        RecordedAtTime: z.string(),
        MonitoringRef: z.string(),
        MonitoredVehicleJourney: z.object({
          LineRef: z.string(),
          DirectionRef: z.string(),
          FramedVehicleJourneyRef: z.object({
            DataFrameRef: z.string(),
            DatedVehicleJourneyRef: z.string(),
          }),
          PublishedLineName: z.string(),
          OperatorRef: z.string(),
          OriginRef: z.string(),
          OriginName: z.string(),
          DestinationRef: z.string(),
          DestinationName: z.string(),
          Monitored: z.boolean(),
          InCongestion: z.string().nullable(),
          VehicleLocation: z.object({
            Longitude: z.string(),
            Latitude: z.string(),
          }).optional(),
          Bearing: z.string().nullable(),
          Occupancy: z.string().nullable(),
          VehicleRef: z.string().nullable(),
          MonitoredCall: z.object({
            StopPointRef: z.string(),
            StopPointName: z.string(),
            VehicleLocationAtStop: z.string(),
            VehicleAtStop: z.string(),
            DestinationDisplay: z.string(),
            AimedArrivalTime: z.string().optional(),
            ExpectedArrivalTime: z.string().optional(),
            AimedDepartureTime: z.string().optional(),
            ExpectedDepartureTime: z.string().nullable().optional(),
            Distances: z.string().optional(),
          }),
        }),
      })).optional(),
    }).optional(),
  }),
});

// Infer TypeScript type from Zod schema
export type StopMonitoringResponse = z.infer<typeof StopMonitoringResponseSchema>;

export async function fetchStopMonitoring(
  agency: string,
  stopCode: string
): Promise<StopMonitoringResponse> {
  const apiKey = process.env.FIVEONEONE_TOKEN || process.env.fiveoneone_token;

  if (!apiKey) {
    throw new Error("511 API key not configured");
  }

  const url = `https://api.511.org/transit/StopMonitoring?api_key=${apiKey}&agency=${agency}&stopCode=${stopCode}&format=json`;

  try {
    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`511 API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    // Validate the response structure with Zod
    const validatedData = StopMonitoringResponseSchema.parse(data);

    return validatedData;
  } catch (error) {
    console.error("Error fetching transit data:", error);
    throw error;
  }
}

export function parseStopMonitoringDepartures(response: StopMonitoringResponse) {
  const visits = response.ServiceDelivery.StopMonitoringDelivery?.MonitoredStopVisit || [];
  
  return visits.map(visit => {
    const journey = visit.MonitoredVehicleJourney;
    const call = journey.MonitoredCall;
    
    return {
      lineRef: journey.LineRef,
      lineName: journey.PublishedLineName,
      direction: journey.DirectionRef,
      origin: journey.OriginName,
      destination: journey.DestinationName,
      departureTime: call.ExpectedDepartureTime || call.AimedDepartureTime,
      arrivalTime: call.ExpectedArrivalTime || call.AimedArrivalTime,
      vehicleRef: journey.VehicleRef,
      occupancy: journey.Occupancy,
    };
  });
}