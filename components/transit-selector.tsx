"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Share2, Check } from "lucide-react"

interface TransitSelection {
  operator: { id: string; name: string } | null
  line: { id: string; name: string; color?: string } | null
  pattern: { id: string; name: string; direction: string; destination: string } | null
  stop: { code: string; name: string } | null
}

interface TransitSelectorProps {
  onSelectionComplete: (selection: TransitSelection) => void
  currentSelection?: TransitSelection
}

export function TransitSelector({ onSelectionComplete, currentSelection }: TransitSelectorProps) {
  const [selection, setSelection] = useState<TransitSelection>(
    currentSelection || {
      operator: null,
      line: null,
      pattern: null,
      stop: null,
    },
  )

  const [operators, setOperators] = useState<any[]>([])
  const [lines, setLines] = useState<any[]>([])
  const [patterns, setPatterns] = useState<any[]>([])
  const [stops, setStops] = useState<any[]>([])

  const [loading, setLoading] = useState({
    operators: false,
    lines: false,
    patterns: false,
    stops: false,
  })

  const [error, setError] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const [copied, setCopied] = useState(false)

  // Load operators on mount
  useEffect(() => {
    fetchOperators()
  }, [])

  // Load lines when operator changes
  useEffect(() => {
    if (selection.operator) {
      fetchLines(selection.operator.id)
    }
  }, [selection.operator])

  // Load patterns when line changes
  useEffect(() => {
    if (selection.operator && selection.line) {
      fetchPatterns(selection.operator.id, selection.line.id)
    }
  }, [selection.operator, selection.line])

  // Load stops when pattern changes
  useEffect(() => {
    if (selection.operator && selection.pattern) {
      fetchStopsForPattern(selection.operator.id, selection.pattern.id)
    }
  }, [selection.operator, selection.pattern])

  const fetchOperators = async () => {
    setLoading((prev) => ({ ...prev, operators: true }))
    setError(null)
    try {
      const response = await fetch("/api/operators")
      if (!response.ok) throw new Error("Failed to fetch operators")
      const data = await response.json()
      setOperators(data.operators || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setLoading((prev) => ({ ...prev, operators: false }))
    }
  }

  const fetchLines = async (operatorId: string) => {
    setLoading((prev) => ({ ...prev, lines: true }))
    setError(null)
    try {
      const response = await fetch(`/api/patterns?operator_id=${operatorId}`)
      if (!response.ok) throw new Error("Failed to fetch lines")
      const data = await response.json()
      setLines(data.lines || [])
      setDebugInfo(data.debug || null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setLoading((prev) => ({ ...prev, lines: false }))
    }
  }

  const fetchPatterns = async (operatorId: string, lineId: string) => {
    setLoading((prev) => ({ ...prev, patterns: true }))
    setError(null)
    try {
      const response = await fetch(`/api/patterns?operator_id=${operatorId}&line_id=${lineId}`)
      if (!response.ok) throw new Error("Failed to fetch patterns")
      const data = await response.json()
      setPatterns(data.patterns || [])
      setDebugInfo(data.debug || null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setLoading((prev) => ({ ...prev, patterns: false }))
    }
  }

  const fetchStopsForPattern = async (operatorId: string, patternId: string) => {
    setLoading((prev) => ({ ...prev, stops: true }))
    setError(null)
    try {
      const response = await fetch(`/api/stops?operator_id=${operatorId}&pattern_id=${patternId}`)
      if (!response.ok) throw new Error("Failed to fetch stops")
      const data = await response.json()
      setStops(data.stops || [])
      setDebugInfo(data.debug || null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setLoading((prev) => ({ ...prev, stops: false }))
    }
  }

  const handleOperatorChange = (operatorId: string) => {
    const operator = operators.find((op) => op.id === operatorId)
    setSelection({
      operator: operator ? { id: operator.id, name: operator.name } : null,
      line: null,
      pattern: null,
      stop: null,
    })
    setLines([])
    setPatterns([])
    setStops([])
  }

  const handleLineChange = (lineId: string) => {
    const line = lines.find((l) => l.id === lineId)
    setSelection((prev) => ({
      ...prev,
      line: line ? { id: line.id, name: line.name, color: line.color } : null,
      pattern: null,
      stop: null,
    }))
    setPatterns([])
    setStops([])
  }

  const handlePatternChange = (patternId: string) => {
    const pattern = patterns.find((p) => p.id === patternId)
    setSelection((prev) => ({
      ...prev,
      pattern: pattern
        ? {
            id: pattern.id,
            name: pattern.name,
            direction: pattern.direction,
            destination: pattern.destination,
          }
        : null,
      stop: null,
    }))
    setStops([])
  }

  const handleStopChange = (stopCode: string) => {
    const stop = stops.find((s) => s.code === stopCode)
    const newSelection = {
      ...selection,
      stop: stop ? { code: stop.code, name: stop.name } : null,
    }
    setSelection(newSelection)

    // Notify parent
    if (stop && selection.operator && selection.line && selection.pattern) {
      onSelectionComplete(newSelection)
    }
  }

  const handleTestPatterns = async () => {
    if (!selection.operator || !selection.line) return

    setLoading((prev) => ({ ...prev, patterns: true }))
    try {
      // Try direct API call to see raw response
      const apiKey = "YOUR_API_KEY" // This will be replaced on the server
      const url = `/api/test-patterns?operator_id=${selection.operator.id}&line_id=${selection.line.id}`

      const response = await fetch(url)
      const data = await response.json()

      setDebugInfo({
        ...debugInfo,
        testResponse: data,
      })
    } catch (err) {
      console.error("Test patterns error:", err)
    } finally {
      setLoading((prev) => ({ ...prev, patterns: false }))
    }
  }

  const generateShareUrl = () => {
    if (!selection.operator || !selection.line || !selection.pattern || !selection.stop) return ""

    const baseUrl = window.location.origin + window.location.pathname
    const params = new URLSearchParams()

    params.set("operator", selection.operator.id)
    params.set("line", selection.line.id)
    params.set("pattern", selection.pattern.id)
    params.set("stop", selection.stop.code)

    return `${baseUrl}?${params.toString()}`
  }

  const handleShare = async () => {
    const url = generateShareUrl()
    if (!url) return

    // Try to use the Web Share API if available
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Transit Stop",
          text: `Check arrivals at ${selection.stop?.name}`,
          url: url,
        })
        return
      } catch (err) {
        console.log("Error sharing:", err)
      }
    }

    // Fallback to clipboard
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy:", err)
      // Fallback for older browsers
      const textarea = document.createElement("textarea")
      textarea.value = url
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand("copy")
      document.body.removeChild(textarea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const hasCompleteSelection = selection.operator && selection.line && selection.pattern && selection.stop

  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle>Select Transit Stop</CardTitle>
        <CardDescription>Choose your transit operator, line, direction, and stop</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-md text-sm">
              {error}
            </div>
          )}

          {/* Operator Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Transit Operator
              <span className="ml-2 text-xs text-gray-500 dark:text-gray-400 font-normal">API: /transit/operators</span>
            </label>
            <Select
              value={selection.operator?.id || ""}
              onValueChange={handleOperatorChange}
              disabled={loading.operators}
            >
              <SelectTrigger>
                <SelectValue placeholder={loading.operators ? "Loading..." : "Select operator"} />
              </SelectTrigger>
              <SelectContent>
                {operators.map((op) => (
                  <SelectItem key={op.id} value={op.id}>
                    <div className="flex flex-col">
                      <span>{op.name}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">operator_id={op.id}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Line Selection */}
          {selection.operator && (
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Line
                <span className="ml-2 text-xs text-gray-500 dark:text-gray-400 font-normal">
                  API: /transit/lines?operator_id={selection.operator.id}
                </span>
              </label>
              <Select
                value={selection.line?.id || ""}
                onValueChange={handleLineChange}
                disabled={loading.lines || lines.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder={loading.lines ? "Loading..." : "Select line"} />
                </SelectTrigger>
                <SelectContent>
                  {lines.map((line) => (
                    <SelectItem key={line.id} value={line.id}>
                      <div className="flex items-center gap-2">
                        {line.color && (
                          <div className="w-4 h-4 rounded" style={{ backgroundColor: `#${line.color}` }} />
                        )}
                        <div className="flex flex-col">
                          <span>{line.publicCode || line.name}</span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">line_id={line.id}</span>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Pattern/Direction Selection */}
          {selection.line && (
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Direction
                <span className="ml-2 text-xs text-gray-500 dark:text-gray-400 font-normal">
                  API: /transit/patterns?operator_id={selection.operator?.id}&line_id={selection.line.id}
                </span>
              </label>
              <Select
                value={selection.pattern?.id || ""}
                onValueChange={handlePatternChange}
                disabled={loading.patterns || patterns.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder={loading.patterns ? "Loading..." : "Select direction"} />
                </SelectTrigger>
                <SelectContent>
                  {patterns.map((pattern) => (
                    <SelectItem key={pattern.id} value={pattern.id}>
                      <div className="flex flex-col">
                        <span className="font-medium">{pattern.direction}</span>
                        <span className="text-sm text-gray-600 dark:text-gray-300">to {pattern.destination}</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">pattern_id={pattern.id}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Debug button for patterns */}
              {selection.line && patterns.length === 0 && !loading.patterns && (
                <div className="mt-2">
                  <Button size="sm" variant="outline" onClick={handleTestPatterns}>
                    Debug Patterns
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Stop Selection */}
          {selection.pattern && (
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Stop
                <span className="ml-2 text-xs text-gray-500 dark:text-gray-400 font-normal">
                  {selection.pattern.id.includes("-inbound") || selection.pattern.id.includes("-outbound")
                    ? `API: /transit/stops?operator_id=${selection.operator?.id}`
                    : `API: /transit/patterns?operator_id=${selection.operator?.id}&pattern_id=${selection.pattern.id}`}
                </span>
              </label>
              <Select
                value={selection.stop?.code || ""}
                onValueChange={handleStopChange}
                disabled={loading.stops || stops.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder={loading.stops ? "Loading..." : "Select stop"} />
                </SelectTrigger>
                <SelectContent>
                  {stops.map((stop, index) => (
                    <SelectItem key={stop.code} value={stop.code}>
                      <div className="flex flex-col w-full">
                        <span>{stop.name}</span>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500 dark:text-gray-400">stopCode={stop.code}</span>
                          {stop.order && (
                            <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">Stop #{stop.order}</span>
                          )}
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Current Selection Summary */}
          {selection.stop && (
            <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-md">
              <h3 className="text-sm font-medium text-green-800 dark:text-green-400 mb-2">Selected Stop:</h3>
              <div className="space-y-1 text-sm text-green-700 dark:text-green-300">
                <p>
                  <span className="font-medium">Operator:</span> {selection.operator?.name}
                  <span className="text-xs text-green-600 dark:text-green-400 ml-2">({selection.operator?.id})</span>
                </p>
                <p>
                  <span className="font-medium">Line:</span> {selection.line?.name}
                  <span className="text-xs text-green-600 dark:text-green-400 ml-2">({selection.line?.id})</span>
                </p>
                <p>
                  <span className="font-medium">Direction:</span> {selection.pattern?.direction} to{" "}
                  {selection.pattern?.destination}
                  <span className="text-xs text-green-600 dark:text-green-400 ml-2">({selection.pattern?.id})</span>
                </p>
                <p>
                  <span className="font-medium">Stop:</span> {selection.stop.name}
                  <span className="text-xs text-green-600 dark:text-green-400 ml-2">({selection.stop.code})</span>
                </p>
              </div>
              <div className="mt-3 p-2 bg-gray-100 dark:bg-gray-800 rounded text-xs font-mono">
                <p className="text-gray-600 dark:text-gray-400">API for real-time data:</p>
                <p className="text-gray-700 dark:text-gray-300 break-all">
                  /transit/StopMonitoring?agency={selection.operator?.id}&stopCode={selection.stop.code}
                </p>
              </div>

              {/* Share Button */}
              {hasCompleteSelection && (
                <div className="mt-4">
                  <Button onClick={handleShare} variant="outline" className="w-full" disabled={!hasCompleteSelection}>
                    {copied ? (
                      <>
                        <Check className="mr-2 h-4 w-4" />
                        Link Copied!
                      </>
                    ) : (
                      <>
                        <Share2 className="mr-2 h-4 w-4" />
                        Share This Stop
                      </>
                    )}
                  </Button>
                  {copied && (
                    <p className="text-xs text-green-600 dark:text-green-400 mt-2 text-center">
                      Share link copied to clipboard
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Debug Info */}
          {debugInfo && (
            <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-md text-xs overflow-auto max-h-40">
              <h3 className="font-medium mb-1 text-gray-700 dark:text-gray-300">Debug Info:</h3>
              <pre className="text-gray-600 dark:text-gray-400">{JSON.stringify(debugInfo, null, 2)}</pre>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
