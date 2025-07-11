import { NextResponse } from "next/server";

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
    
    // Get current time and time window
    const now = new Date();
    const startTime = `${now.getUTCHours().toString().padStart(2, '0')}:${now.getUTCMinutes().toString().padStart(2, '0')}`;
    const endDate = new Date(now.getTime() + 90 * 60 * 1000); // 90 minutes ahead
    const endTime = `${endDate.getUTCHours().toString().padStart(2, '0')}:${endDate.getUTCMinutes().toString().padStart(2, '0')}`;
    
    console.log('Testing StopTimetable with StartTime:', startTime, 'EndTime:', endTime);
    
    // Test BART StopTimetable
    const bartUrl = `https://api.511.org/transit/stoptimetable?api_key=${apiKey}&MonitoringRef=903702&OperatorRef=BA&StartTime=${startTime}&EndTime=${endTime}&format=json`;
    console.log('BART URL:', bartUrl);
    const bartResponse = await fetch(bartUrl);
    const bartData = await bartResponse.json();
    
    // Test Muni StopTimetable
    const muniUrl = `https://api.511.org/transit/stoptimetable?api_key=${apiKey}&MonitoringRef=17877&OperatorRef=SF&StartTime=${startTime}&EndTime=${endTime}&format=json`;
    console.log('Muni URL:', muniUrl);
    const muniResponse = await fetch(muniUrl);
    const muniData = await muniResponse.json();
    
    return NextResponse.json({
      message: 'StopTimetable API test',
      timeWindow: { startTime, endTime },
      bartResponse: bartData,
      muniResponse: muniData,
    });
  } catch (error) {
    console.error('API test failed:', error);
    return NextResponse.json({
      error: 'API test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}