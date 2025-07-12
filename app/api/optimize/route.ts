import { NextResponse } from "next/server";
import { optimizeCommute } from "@/app/lib/commute-optimizer";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // Validate request
    const { direction, drive_time_minutes, preferred_departure_window } = body;
    
    if (!direction || !['to_work', 'to_home'].includes(direction)) {
      return NextResponse.json(
        { error: "Invalid direction. Must be 'to_work' or 'to_home'" },
        { status: 400 }
      );
    }
    
    if (typeof drive_time_minutes !== 'number' || drive_time_minutes < 0 || drive_time_minutes > 60) {
      return NextResponse.json(
        { error: "Invalid drive_time_minutes. Must be a number between 0 and 60" },
        { status: 400 }
      );
    }

    if (!preferred_departure_window || !preferred_departure_window.start || !preferred_departure_window.end) {
      return NextResponse.json(
        { error: "Missing preferred_departure_window. Must include start and end times in HH:MM format" },
        { status: 400 }
      );
    }

    // Validate time format (HH:MM)
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(preferred_departure_window.start) || !timeRegex.test(preferred_departure_window.end)) {
      return NextResponse.json(
        { error: "Invalid time format. Use HH:MM format (e.g., '08:30', '17:45')" },
        { status: 400 }
      );
    }
    
    // Use server's current time as reference
    const currentTime = new Date().toISOString();
    
    // Run optimization with user's preferred departure window
    const result = await optimizeCommute(
      preferred_departure_window.start,
      preferred_departure_window.end,
      drive_time_minutes,
      currentTime,
      direction
    );
    
    // Transform the response to match the expected format
    const response = {
      optimal_departure: result.results[0]?.optimal_departure || null,
      total_journey_time: result.results[0]?.total_journey_time || null,
      arrival_time: result.results[0]?.arrival_time || null,
      confidence: result.results[0]?.confidence || null,
      segments: result.results[0]?.segments || [],
      alternatives: result.results.slice(1).map(r => ({
        departure: r.optimal_departure,
        total_time: r.total_journey_time,
        arrival: r.arrival_time,
        confidence: r.confidence,
      })),
    };
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error("Error in optimize API:", error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : "Failed to optimize commute",
      },
      { status: 400 }
    );
  }
}