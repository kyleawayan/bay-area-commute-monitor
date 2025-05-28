import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const operatorId = searchParams.get("operator_id")
  const lineId = searchParams.get("line_id")

  const apiKey = process.env.FIVEONEONE_TOKEN || process.env.fiveoneone_token

  if (!apiKey) {
    return NextResponse.json({ error: "API key not configured" }, { status: 500 })
  }

  if (!operatorId || !lineId) {
    return NextResponse.json({ error: "operator_id and line_id are required" }, { status: 400 })
  }

  try {
    // Get patterns for the line
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

    // Return raw response for debugging
    return NextResponse.json({
      responseType: typeof data,
      isArray: Array.isArray(data),
      responseKeys: typeof data === "object" ? Object.keys(data) : null,
      firstItemKeys: Array.isArray(data) && data.length > 0 ? Object.keys(data[0]) : null,
      sampleData: data,
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
