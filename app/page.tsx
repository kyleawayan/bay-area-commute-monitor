"use client"
import { useState, useEffect, Suspense } from "react"
import { MuniSignage } from "@/components/muni-signage"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { TransitSelector } from "@/components/transit-selector"
import { useSearchParams } from "next/navigation"

interface TransitSelection {
  operator: { id: string; name: string } | null
  line: { id: string; name: string; color?: string } | null
  pattern: { id: string; name: string; direction: string; destination: string } | null
  stop: { code: string; name: string } | null
}

function HomeContent() {
  const [showControls, setShowControls] = useState(false)
  const [showDebug, setShowDebug] = useState(false)
  const [showSelector, setShowSelector] = useState(false)
  const [selection, setSelection] = useState<TransitSelection | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isCompact, setIsCompact] = useState(false)
  const searchParams = useSearchParams()

  // Extract search params once
  const operatorId = searchParams.get("operator")
  const lineId = searchParams.get("line")
  const patternId = searchParams.get("pattern")
  const stopCode = searchParams.get("stop")

  // Detect if we're in a small viewport
  useEffect(() => {
    const checkSize = () => {
      setIsCompact(window.innerHeight < 400 || window.innerWidth < 600)
    }

    checkSize()
    window.addEventListener("resize", checkSize)
    return () => window.removeEventListener("resize", checkSize)
  }, [])

  // Load selection from URL parameters or localStorage
  useEffect(() => {
    const loadFromLocalStorage = () => {
      if (typeof window !== "undefined") {
        const saved = localStorage.getItem("transitSelection")
        if (saved) {
          try {
            const parsed = JSON.parse(saved)
            setSelection(parsed)
          } catch (e) {
            console.error("Error loading saved selection:", e)
            setShowSelector(true)
          }
        } else {
          // Show selector if no saved selection
          setShowSelector(true)
        }
      }
      setIsLoading(false)
    }

    const loadFromUrlParams = async () => {
      try {
        // Fetch operator details
        const operatorRes = await fetch("/api/operators")
        const operatorData = await operatorRes.json()
        const operator = operatorData.operators.find((op: any) => op.id === operatorId)

        if (!operator) throw new Error("Operator not found")

        // Fetch line details
        const linesRes = await fetch(`/api/patterns?operator_id=${operatorId}`)
        const linesData = await linesRes.json()
        const line = linesData.lines.find((l: any) => l.id === lineId)

        if (!line) throw new Error("Line not found")

        // Fetch pattern details
        const patternsRes = await fetch(`/api/patterns?operator_id=${operatorId}&line_id=${lineId}`)
        const patternsData = await patternsRes.json()
        const pattern = patternsData.patterns.find((p: any) => p.id === patternId)

        if (!pattern) throw new Error("Pattern not found")

        // Fetch stop details
        const stopsRes = await fetch(`/api/stops?operator_id=${operatorId}&pattern_id=${patternId}`)
        const stopsData = await stopsRes.json()
        const stop = stopsData.stops.find((s: any) => s.code === stopCode)

        if (!stop) throw new Error("Stop not found")

        // Create selection object
        const newSelection = {
          operator: { id: operator.id, name: operator.name },
          line: { id: line.id, name: line.name, color: line.color },
          pattern: {
            id: pattern.id,
            name: pattern.name,
            direction: pattern.direction,
            destination: pattern.destination,
          },
          stop: { code: stop.code, name: stop.name },
        }

        // Save to localStorage and update state
        localStorage.setItem("transitSelection", JSON.stringify(newSelection))
        setSelection(newSelection)
      } catch (error) {
        console.error("Error loading from URL parameters:", error)
        // Fall back to localStorage if URL parameters fail
        loadFromLocalStorage()
      } finally {
        setIsLoading(false)
      }
    }

    // Only run this effect once on mount
    if (isLoading) {
      // If we have URL parameters, try to load the selection from them
      if (operatorId && lineId && patternId && stopCode) {
        loadFromUrlParams()
      } else {
        // No URL parameters, try localStorage
        loadFromLocalStorage()
      }
    }
  }, []) // Empty dependency array to run only once on mount

  const handleSelectionComplete = (newSelection: TransitSelection) => {
    setSelection(newSelection)
    setShowSelector(false)
  }

  const hasCompleteSelection = selection?.operator && selection?.line && selection?.pattern && selection?.stop

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-white relative">
      {hasCompleteSelection ? (
        <MuniSignage
          line={selection.line.name}
          destination={selection.pattern.destination}
          stationName={`${selection.stop.name} (${selection.pattern.direction})`}
          agency={selection.operator.id}
          stopCode={selection.stop.code}
          selection={selection}
        />
      ) : (
        <div className="flex items-center justify-center h-screen">
          <Card className={isCompact ? "max-w-xs" : ""}>
            <CardHeader className={isCompact ? "p-4" : ""}>
              <CardTitle className={isCompact ? "text-lg" : ""}>No Stop Selected</CardTitle>
              <CardDescription className={isCompact ? "text-sm" : ""}>
                Please select a stop to display arrivals
              </CardDescription>
            </CardHeader>
            <CardContent className={isCompact ? "p-4 pt-0" : ""}>
              <Button onClick={() => setShowSelector(true)} size={isCompact ? "sm" : "default"}>
                Select Stop
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Stop Selector button - make smaller on compact view */}
      <button
        onClick={() => setShowSelector(!showSelector)}
        className={`absolute ${isCompact ? "top-2 right-2 p-1.5" : "top-4 right-4 p-2"} bg-blue-200 hover:bg-blue-300 text-gray-800 rounded-full shadow-md z-10`}
        aria-label={showSelector ? "Hide stop selector" : "Show stop selector"}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width={isCompact ? "20" : "24"}
          height={isCompact ? "20" : "24"}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
      </button>

      {/* Transit Selector modal */}
      {showSelector && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-20 p-4 overflow-y-auto">
          <div className="relative max-h-[90vh] overflow-y-auto">
            <TransitSelector onSelectionComplete={handleSelectionComplete} currentSelection={selection || undefined} />
            {selection && (
              <button
                onClick={() => setShowSelector(false)}
                className="absolute top-4 right-4 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full bg-white dark:bg-gray-900 shadow-md"
                aria-label="Close"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            )}
          </div>
        </div>
      )}
    </main>
  )
}

export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      }
    >
      <HomeContent />
    </Suspense>
  )
}
