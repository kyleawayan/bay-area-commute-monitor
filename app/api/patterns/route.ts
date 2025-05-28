import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const operatorId = searchParams.get("operator_id")
  const lineId = searchParams.get("line_id")

  const apiKey = process.env.FIVEONEONE_TOKEN || process.env.fiveoneone_token

  if (!apiKey) {
    return NextResponse.json({ error: "API key not configured" }, { status: 500 })
  }

  if (!operatorId) {
    return NextResponse.json({ error: "operator_id is required" }, { status: 400 })
  }

  try {
    // First, get all lines for the operator if no specific line is requested
    if (!lineId) {
      const linesUrl = `https://api.511.org/transit/lines?api_key=${apiKey}&operator_id=${operatorId}&format=json`

      console.log("Fetching lines from URL:", linesUrl.replace(apiKey, "***"))

      const linesResponse = await fetch(linesUrl, {
        headers: {
          Accept: "application/json",
        },
      })

      if (!linesResponse.ok) {
        throw new Error(`Failed to fetch lines: ${linesResponse.status}`)
      }

      const linesData = await linesResponse.json()
      console.log("Lines API response structure:", Object.keys(linesData))

      // Extract line information
      let lines = []

      if (Array.isArray(linesData)) {
        lines = linesData.map((line: any) => ({
          id: line.Id,
          name: line.Name,
          publicCode: line.PublicCode,
          mode: line.TransportMode,
          color: line.Colour || line.Color,
          textColor: line.TextColour || line.TextColor,
        }))
      } else if (linesData.dataObjects?.Line) {
        // Alternative format
        const lineObjects = Array.isArray(linesData.dataObjects.Line)
          ? linesData.dataObjects.Line
          : [linesData.dataObjects.Line]

        lines = lineObjects.map((line: any) => ({
          id: line.id,
          name: line.Name || line.PublicCode,
          publicCode: line.PublicCode,
          mode: line.TransportMode,
          color: line.Colour || line.Color,
          textColor: line.TextColour || line.TextColor,
        }))
      }

      console.log(`Found ${lines.length} lines for operator ${operatorId}`)

      return NextResponse.json({
        lines,
        debug: {
          responseKeys: Object.keys(linesData),
          sampleLine: lines.length > 0 ? lines[0] : null,
        },
      })
    }

    // If a specific line is requested, get its patterns
    const patternsUrl = `https://api.511.org/transit/patterns?api_key=${apiKey}&operator_id=${operatorId}&line_id=${lineId}&format=json`

    console.log("Fetching patterns from URL:", patternsUrl.replace(apiKey, "***"))

    const response = await fetch(patternsUrl, {
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
    console.log("Patterns API response has directions:", !!data.directions, "journeyPatterns:", !!data.journeyPatterns)

    // Parse patterns from the response
    const patterns = []

    // The response format matches the attachment - it has directions and journeyPatterns at the root level
    if (data.directions && data.journeyPatterns) {
      const directions = data.directions.reduce((acc: any, dir: any) => {
        acc[dir.DirectionId] = dir.Name
        return acc
      }, {})

      console.log("Directions found:", directions)
      console.log(`Found ${data.journeyPatterns.length} journey patterns`)

      for (const pattern of data.journeyPatterns) {
        const directionName = directions[pattern.DirectionRef] || pattern.DirectionRef

        patterns.push({
          id: pattern.serviceJourneyPatternRef,
          name: pattern.Name,
          lineRef: pattern.LineRef,
          direction: directionName,
          directionId: pattern.DirectionRef,
          destination: pattern.DestinationDisplayView?.FontText || pattern.Name,
          tripCount: pattern.TripCount,
          stops:
            pattern.PointsInSequence?.StopPointInJourneyPattern?.map((stop: any) => ({
              id: stop.ScheduledStopPointRef,
              name: stop.Name,
              order: Number.parseInt(stop.Order),
            })) || [],
        })
      }
    }

    console.log(`Found ${patterns.length} patterns for line ${lineId}`)

    return NextResponse.json({
      patterns,
      debug: {
        responseType: typeof data,
        hasDirections: !!data.directions,
        hasJourneyPatterns: !!data.journeyPatterns,
        patternCount: patterns.length,
        samplePattern: patterns.length > 0 ? patterns[0] : null,
      },
    })
  } catch (error) {
    console.error("Error fetching patterns:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch patterns",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
