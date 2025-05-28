"use client"
import { useState, useEffect } from "react"
import { MuniSignage } from "@/components/muni-signage"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { TransitSelector } from "@/components/transit-selector"

interface TransitSelection {
  operator: { id: string; name: string } | null
  line: { id: string; name: string; color?: string } | null
  pattern: { id: string; name: string; direction: string; destination: string } | null
  stop: { code: string; name: string } | null
}

export default function Home() {
  const [showControls, setShowControls] = useState(false)
  const [showDebug, setShowDebug] = useState(false)
  const [showSelector, setShowSelector] = useState(false)
  const [selection, setSelection] = useState<TransitSelection | null>(null)

  // Load saved selection on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("transitSelection")
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          setSelection(parsed)
        } catch (e) {
          console.error("Error loading saved selection:", e)
        }
      } else {
        // Show selector if no saved selection
        setShowSelector(true)
      }
    }
  }, [])

  const handleSelectionComplete = (newSelection: TransitSelection) => {
    setSelection(newSelection)
    setShowSelector(false)
  }

  const hasCompleteSelection = selection?.operator && selection?.line && selection?.pattern && selection?.stop

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
          <Card>
            <CardHeader>
              <CardTitle>No Stop Selected</CardTitle>
              <CardDescription>Please select a stop to display arrivals</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => setShowSelector(true)}>Select Stop</Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Stop Selector button */}
      <button
        onClick={() => setShowSelector(!showSelector)}
        className="absolute top-4 right-4 bg-blue-200 hover:bg-blue-300 text-gray-800 p-2 rounded-full shadow-md z-10"
        aria-label={showSelector ? "Hide stop selector" : "Show stop selector"}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
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
