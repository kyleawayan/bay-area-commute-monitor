import { z } from 'zod';

// Zod schema for 511 API StopTimetable response
export const StopTimetableResponseSchema = z.object({
  Siri: z.object({
    ServiceDelivery: z.object({
      ResponseTimestamp: z.string(),
      Status: z.boolean(),
      StopTimetableDelivery: z.object({
        ResponseTimestamp: z.string(),
        TimetabledStopVisit: z.array(z.object({
          RecordedAtTime: z.string(),
          MonitoringRef: z.string(),
          TargetedVehicleJourney: z.object({
            LineRef: z.string(),
            DirectionRef: z.string(),
            DatedVehicleJourneyRef: z.string(),
            PublishedLineName: z.string(),
            OperatorRef: z.string(),
            OriginRef: z.string(),
            OriginName: z.string(),
            DestinationRef: z.string(),
            DestinationName: z.string(),
            VehicleJourneyName: z.string(),
            TargetedCall: z.object({
              StopPointRef: z.string(),
              StopPointName: z.string(),
              DestinationDisplay: z.string(),
              VisitNumber: z.string(),
              AimedArrivalTime: z.string(),
              AimedDepartureTime: z.string(),
            }),
          }),
        })).optional(),
      }).optional(),
    }),
  }),
});

export type StopTimetableResponse = z.infer<typeof StopTimetableResponseSchema>;

export async function fetchStopTimetable(
  operatorRef: string,
  monitoringRef: string,
  startTime: string,
  endTime: string
): Promise<StopTimetableResponse> {
  const apiKey = process.env.FIVEONEONE_TOKEN || process.env.fiveoneone_token;

  if (!apiKey) {
    throw new Error("511 API key not configured");
  }

  const url = `https://api.511.org/transit/stoptimetable?api_key=${apiKey}&MonitoringRef=${monitoringRef}&OperatorRef=${operatorRef}&StartTime=${startTime}&EndTime=${endTime}&format=json`;

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
    const validatedData = StopTimetableResponseSchema.parse(data);

    return validatedData;
  } catch (error) {
    console.error("Error fetching timetable data:", error);
    throw error;
  }
}

export function parseStopTimetableDepartures(response: StopTimetableResponse) {
  const visits = response.Siri.ServiceDelivery.StopTimetableDelivery?.TimetabledStopVisit || [];
  
  return visits.map(visit => {
    const journey = visit.TargetedVehicleJourney;
    const call = journey.TargetedCall;
    
    // Convert Pacific time to UTC ISO string
    const departureTime = new Date(call.AimedDepartureTime).toISOString();
    const arrivalTime = new Date(call.AimedArrivalTime).toISOString();
    
    return {
      lineRef: journey.LineRef,
      lineName: journey.PublishedLineName,
      direction: journey.DirectionRef,
      origin: journey.OriginName,
      destination: journey.DestinationName,
      departureTime,
      arrivalTime,
      vehicleRef: null, // Not available in timetable
      occupancy: null, // Not available in timetable
    };
  });
}