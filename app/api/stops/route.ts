import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const operatorId = searchParams.get("operator_id") || searchParams.get("agency") || "SF"
  const patternId = searchParams.get("pattern_id")

  const apiKey = process.env.FIVEONEONE_TOKEN || process.env.fiveoneone_token

  if (!apiKey) {
    return NextResponse.json({ error: "API key not configured" }, { status: 500 })
  }

  try {
    let url = `https://api.511.org/transit/stops?api_key=${apiKey}&operator_id=${operatorId}&format=json`

    // If pattern_id is provided, get stops for that specific pattern
    if (patternId) {
      url = `https://api.511.org/transit/patterns?api_key=${apiKey}&operator_id=${operatorId}&pattern_id=${patternId}&format=json`
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
    const stops = []

    if (patternId) {
      // Parse stops from pattern response
      if (data.journeyPatterns && Array.isArray(data.journeyPatterns)) {
        // Find the specific pattern by serviceJourneyPatternRef
        const pattern = data.journeyPatterns.find((p: any) => p.serviceJourneyPatternRef === patternId)

        if (pattern && pattern.PointsInSequence?.StopPointInJourneyPattern) {
          for (const stop of pattern.PointsInSequence.StopPointInJourneyPattern) {
            stops.push({
              code: stop.ScheduledStopPointRef,
              name: stop.Name || `Stop ${stop.ScheduledStopPointRef}`,
              order: Number.parseInt(stop.Order),
            })
          }

          // Sort by order
          stops.sort((a, b) => (a.order || 0) - (b.order || 0))
        }
      }
    } else {
      // Parse stops from regular stops endpoint
      if (Array.isArray(data) && data[0]?.dataObjects?.ScheduledStopPoint) {
        const stopPoints = data[0].dataObjects.ScheduledStopPoint

        for (const stop of stopPoints) {
          stops.push({
            code: stop.id,
            name: stop.Name,
            location: stop.Location
              ? {
                  lat: Number.parseFloat(stop.Location.Latitude),
                  lng: Number.parseFloat(stop.Location.Longitude),
                }
              : null,
            stopType: stop.StopType,
            url: stop.Url,
          })
        }
      }
    }

    console.log(`Found ${stops.length} stops for operator ${operatorId}`)

    return NextResponse.json({ stops })
  } catch (error) {
    console.error("Error fetching stops:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch stops",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
