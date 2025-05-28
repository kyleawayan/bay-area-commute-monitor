"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export function DebugPanel() {
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [apiUrl, setApiUrl] = useState("/api/transit?agency=SF")

  const testAPI = async () => {
    setLoading(true)
    try {
      const response = await fetch(apiUrl)
      const data = await response.json()
      setDebugInfo({
        status: response.status,
        ok: response.ok,
        data: data,
      })
    } catch (error) {
      setDebugInfo({
        error: error instanceof Error ? error.message : "Unknown error",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>API Debug Panel</CardTitle>
        <CardDescription>Test the 511 API connection</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">API URL</label>
            <input
              type="text"
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              className="w-full px-3 py-2 border rounded-md mt-1"
            />
          </div>
          <Button onClick={testAPI} disabled={loading}>
            {loading ? "Testing..." : "Test API Connection"}
          </Button>
          {debugInfo && (
            <div className="mt-4">
              <div className="flex items-center mb-2">
                <div className={`w-3 h-3 rounded-full mr-2 ${debugInfo.ok ? "bg-green-500" : "bg-red-500"}`}></div>
                <span className="text-sm font-medium">
                  Status: {debugInfo.status} ({debugInfo.ok ? "OK" : "Error"})
                </span>
              </div>
              <pre className="p-4 bg-gray-100 dark:bg-gray-800 rounded overflow-auto text-xs max-h-96">
                {JSON.stringify(debugInfo.data || debugInfo.error, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
