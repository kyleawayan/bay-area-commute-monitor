import { NextResponse } from "next/server"

export async function GET() {
  const apiKey = process.env.FIVEONEONE_TOKEN || process.env.fiveoneone_token

  if (!apiKey) {
    return NextResponse.json({ error: "API key not configured" }, { status: 500 })
  }

  try {
    const url = `https://api.511.org/transit/operators?api_key=${apiKey}&format=json`

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

    // Filter out test/emergency operators and only include monitored ones
    const operators = data
      .filter((op: any) => op.Monitored !== false && !op.Name.includes("Emergency") && !op.Name.includes("Test"))
      .map((op: any) => ({
        id: op.Id,
        name: op.Name,
        shortName: op.ShortName || op.Name,
        primaryMode: op.PrimaryMode,
      }))

    return NextResponse.json({ operators })
  } catch (error) {
    console.error("Error fetching operators:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch operators",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
