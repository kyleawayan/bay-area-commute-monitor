import { NextResponse } from "next/server";
import { StopMonitoringResponseSchema } from "@/app/lib/transit-api";

export async function GET() {
  // Only allow this route in development mode
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: "This endpoint is only available in development mode" }, { status: 404 });
  }
  
  try {
    const apiKey = process.env.FIVEONEONE_TOKEN || process.env.fiveoneone_token;
    
    if (!apiKey) {
      return NextResponse.json({ error: "511 API key not configured" }, { status: 500 });
    }

    console.log("Testing Zod schema against real 511 API responses...");
    
    // Test BART API
    const bartUrl = `https://api.511.org/transit/StopMonitoring?api_key=${apiKey}&agency=BA&stopCode=903702&format=json`;
    const bartResponse = await fetch(bartUrl, {
      headers: { Accept: "application/json" }
    });
    
    if (!bartResponse.ok) {
      throw new Error(`BART API error: ${bartResponse.status}`);
    }
    
    const bartData = await bartResponse.json();
    
    // Test Muni API  
    const muniUrl = `https://api.511.org/transit/StopMonitoring?api_key=${apiKey}&agency=SF&stopCode=17877&format=json`;
    const muniResponse = await fetch(muniUrl, {
      headers: { Accept: "application/json" }
    });
    
    if (!muniResponse.ok) {
      throw new Error(`Muni API error: ${muniResponse.status}`);
    }
    
    const muniData = await muniResponse.json();
    
    // Test Zod schema validation
    const results = {
      bart: { success: false, error: null as any, data: null as any },
      muni: { success: false, error: null as any, data: null as any }
    };
    
    try {
      results.bart.data = StopMonitoringResponseSchema.parse(bartData);
      results.bart.success = true;
      console.log("✅ BART schema validation passed!");
    } catch (error) {
      results.bart.error = error;
      console.error("❌ BART schema validation failed:", error);
    }
    
    try {
      results.muni.data = StopMonitoringResponseSchema.parse(muniData);
      results.muni.success = true;
      console.log("✅ Muni schema validation passed!");
    } catch (error) {
      results.muni.error = error;
      console.error("❌ Muni schema validation failed:", error);
    }
    
    return NextResponse.json({
      message: "Schema validation test completed",
      results: {
        bart: {
          success: results.bart.success,
          error: results.bart.error?.message || null,
          visitCount: results.bart.data?.ServiceDelivery?.StopMonitoringDelivery?.MonitoredStopVisit?.length || 0
        },
        muni: {
          success: results.muni.success,
          error: results.muni.error?.message || null,
          visitCount: results.muni.data?.ServiceDelivery?.StopMonitoringDelivery?.MonitoredStopVisit?.length || 0
        }
      },
      rawResponses: {
        bart: bartData,
        muni: muniData
      }
    });
    
  } catch (error) {
    console.error("Error testing schema:", error);
    return NextResponse.json(
      { 
        error: "Failed to test schema",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}