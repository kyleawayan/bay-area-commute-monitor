export interface StopMonitoringResponse {
  ServiceDelivery: {
    ResponseTimestamp: string;
    ProducerRef: string;
    Status: boolean;
    StopMonitoringDelivery?: {
      version: string;
      ResponseTimestamp: string;
      Status: boolean;
      MonitoredStopVisit?: Array<{
        RecordedAtTime: string;
        MonitoringRef: string;
        MonitoredVehicleJourney: {
          LineRef: string;
          DirectionRef: string;
          FramedVehicleJourneyRef: {
            DataFrameRef: string;
            DatedVehicleJourneyRef: string;
          };
          PublishedLineName: string;
          OperatorRef: string;
          OriginRef: string;
          OriginName: string;
          DestinationRef: string;
          DestinationName: string;
          Monitored: boolean;
          VehicleLocation?: {
            Longitude: string;
            Latitude: string;
          };
          Bearing?: string;
          Occupancy?: string;
          VehicleRef: string;
          MonitoredCall: {
            StopPointRef: string;
            StopPointName: string;
            VehicleLocationAtStop: string;
            VehicleAtStop: boolean;
            DestinationDisplay: string;
            AimedArrivalTime?: string;
            ExpectedArrivalTime?: string;
            AimedDepartureTime?: string;
            ExpectedDepartureTime?: string;
            Distances?: string;
          };
        };
      }>;
    };
  };
}

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

    // Validate the response structure
    if (!data.ServiceDelivery?.StopMonitoringDelivery) {
      throw new Error("Invalid API response structure");
    }

    return data;
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