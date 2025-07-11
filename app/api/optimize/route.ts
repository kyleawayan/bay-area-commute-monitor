import { NextResponse } from "next/server";
import { optimizeCommute, OptimizationRequest } from "@/app/lib/commute-optimizer";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // Validate request
    const { direction, drive_time_minutes } = body;
    
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
    
    // Use server's current time and create departure window
    const now = new Date();
    const currentTime = now.toISOString();
    
    // Create departure window: from now to 60 minutes from now
    // Use UTC hours since the optimizer expects UTC times
    const startTime = `${now.getUTCHours().toString().padStart(2, '0')}:${now.getUTCMinutes().toString().padStart(2, '0')}`;
    const endDate = new Date(now.getTime() + 60 * 60 * 1000);
    const endTime = `${endDate.getUTCHours().toString().padStart(2, '0')}:${endDate.getUTCMinutes().toString().padStart(2, '0')}`;
    
    // Run optimization with A* algorithm
    const result = await optimizeCommute(
      startTime,
      endTime,
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
        error: "Failed to optimize commute",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}