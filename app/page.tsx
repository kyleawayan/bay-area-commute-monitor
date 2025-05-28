"use client"
import { useState, useEffect } from "react"
import { MuniSignage } from "@/components/muni-signage"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DebugPanel } from "@/components/debug-panel"
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

      {/* Floating button to toggle controls */}
      <button
        onClick={() => setShowControls(!showControls)}
        className="absolute top-4 right-4 bg-gray-200 hover:bg-gray-300 text-gray-800 p-2 rounded-full shadow-md z-10"
        aria-label={showControls ? "Hide controls" : "Show controls"}
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
          {showControls ? (
            <>
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </>
          ) : (
            <>
              <line x1="4" y1="12" x2="20" y2="12"></line>
              <line x1="4" y1="6" x2="20" y2="6"></line>
              <line x1="4" y1="18" x2="20" y2="18"></line>
            </>
          )}
        </svg>
      </button>

      {/* Debug button */}
      <button
        onClick={() => setShowDebug(!showDebug)}
        className="absolute top-4 right-20 bg-yellow-200 hover:bg-yellow-300 text-gray-800 p-2 rounded-full shadow-md z-10"
        aria-label={showDebug ? "Hide debug" : "Show debug"}
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
          <path d="M12 20v-6M12 10V4M12 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM12 20a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />
        </svg>
      </button>

      {/* Stop Selector button */}
      <button
        onClick={() => setShowSelector(!showSelector)}
        className="absolute top-4 right-36 bg-blue-200 hover:bg-blue-300 text-gray-800 p-2 rounded-full shadow-md z-10"
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

      {/* Controls panel */}
      {showControls && hasCompleteSelection && (
        <div className="absolute top-16 right-4 w-96 z-10">
          <Card>
            <CardHeader>
              <CardTitle>Current Selection</CardTitle>
              <CardDescription>Your selected transit stop</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="font-medium">Operator:</span>
                  <span>{selection.operator?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Line:</span>
                  <span>{selection.line?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Direction:</span>
                  <span>{selection.pattern?.direction}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Destination:</span>
                  <span>{selection.pattern?.destination}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Stop:</span>
                  <span>{selection.stop?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Stop Code:</span>
                  <span className="font-mono">{selection.stop?.code}</span>
                </div>
              </div>

              <div className="pt-4 space-y-2">
                <Button onClick={() => setShowSelector(true)} variant="outline" className="w-full">
                  Change Selection
                </Button>
                <Button
                  onClick={() => {
                    localStorage.removeItem("transitSelection")
                    setSelection(null)
                    setShowSelector(true)
                  }}
                  variant="outline"
                  className="w-full"
                >
                  Clear Selection
                </Button>
                <Button onClick={() => setShowControls(false)} className="w-full">
                  Close
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Debug panel */}
      {showDebug && (
        <div className="absolute top-16 right-24 w-96 z-10">
          <DebugPanel />
        </div>
      )}

      {/* Transit Selector modal */}
      {showSelector && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-20 p-4">
          <div className="relative">
            <TransitSelector onSelectionComplete={handleSelectionComplete} currentSelection={selection || undefined} />
            {selection && (
              <button
                onClick={() => setShowSelector(false)}
                className="absolute top-4 right-4 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
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
