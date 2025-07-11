import { NextResponse } from "next/server";
import { optimizeCommute, OptimizationRequest } from "@/app/lib/commute-optimizer";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // Validate request
    const { direction, preferred_departure_window, drive_time_minutes, current_time } = body;
    
    if (!direction || !['to_work', 'to_home'].includes(direction)) {
      return NextResponse.json(
        { error: "Invalid direction. Must be 'to_work' or 'to_home'" },
        { status: 400 }
      );
    }
    
    if (!preferred_departure_window?.start || !preferred_departure_window?.end) {
      return NextResponse.json(
        { error: "Missing preferred_departure_window with start and end times" },
        { status: 400 }
      );
    }
    
    if (typeof drive_time_minutes !== 'number' || drive_time_minutes < 0 || drive_time_minutes > 60) {
      return NextResponse.json(
        { error: "Invalid drive_time_minutes. Must be a number between 0 and 60" },
        { status: 400 }
      );
    }
    
    if (!current_time) {
      return NextResponse.json(
        { error: "Missing current_time" },
        { status: 400 }
      );
    }
    
    const optimizationRequest: OptimizationRequest = {
      direction,
      preferred_departure_window,
      drive_time_minutes,
      current_time,
    };
    
    // Run optimization with A* algorithm
    const result = await optimizeCommute(optimizationRequest);
    
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
        error: "Failed to optimize commute",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}