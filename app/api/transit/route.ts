import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const agency = searchParams.get("agency") || "SF"
  const stopCode = searchParams.get("stopCode")
  const line = searchParams.get("line")

  // Use the correct environment variable name
  const apiKey = process.env.FIVEONEONE_TOKEN || process.env.fiveoneone_token

  if (!apiKey) {
    return NextResponse.json({ error: "API key not configured" }, { status: 500 })
  }

  try {
    // Build the URL for the 511 API StopMonitoring endpoint
    let url = `https://api.511.org/transit/StopMonitoring?api_key=${apiKey}&agency=${agency}`

    if (stopCode) {
      url += `&stopCode=${stopCode}`
    }

    console.log("Fetching from URL:", url.replace(apiKey, "***"))

    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`API responded with status ${response.status}:`, errorText)
      return NextResponse.json(
        {
          error: `511 API error: ${response.status}`,
          details: errorText,
        },
        { status: response.status },
      )
    }

    const data = await response.json()

    // Validate the response structure
    if (!data.ServiceDelivery?.StopMonitoringDelivery) {
      console.error("Invalid API response structure:", JSON.stringify(data).substring(0, 200))
      return NextResponse.json(
        {
          error: "Invalid API response structure",
          details: JSON.stringify(data).substring(0, 500),
        },
        { status: 500 },
      )
    }

    // Filter by line if specified
    if (line && data.ServiceDelivery?.StopMonitoringDelivery?.MonitoredStopVisit) {
      const visits = Array.isArray(data.ServiceDelivery.StopMonitoringDelivery.MonitoredStopVisit)
        ? data.ServiceDelivery.StopMonitoringDelivery.MonitoredStopVisit
        : [data.ServiceDelivery.StopMonitoringDelivery.MonitoredStopVisit]

      const filteredVisits = visits.filter(
        (visit: any) =>
          visit.MonitoredVehicleJourney?.LineRef?.includes(line) ||
          visit.MonitoredVehicleJourney?.PublishedLineName?.includes(line),
      )

      data.ServiceDelivery.StopMonitoringDelivery.MonitoredStopVisit = filteredVisits
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error fetching transit data:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch transit data",
        details: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}
