"use client"

import { useState, useEffect } from "react"

export interface TransitPrediction {
  destination: string
  minutes: number
  seconds: number
  lineRef: string
  vehicleRef?: string
  occupancy?: string
}

export function useTransitData(agency = "SF", stopCode?: string, line?: string) {
  const [predictions, setPredictions] = useState<TransitPrediction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stationName, setStationName] = useState<string>("")

  useEffect(() => {
    let isMounted = true
    const fetchData = async () => {
      try {
        setLoading(true)

        let url = `/api/transit?agency=${agency}`
        if (stopCode) url += `&stopCode=${stopCode}`
        if (line) url += `&line=${line}`

        const response = await fetch(url)

        if (!response.ok) {
          const errorText = await response.text()
          console.error(`API responded with status ${response.status}:`, errorText)
          throw new Error(
            `API error (${response.status}): ${errorText.substring(0, 100)}${errorText.length > 100 ? "..." : ""}`,
          )
        }

        const data = await response.json()

        if (!isMounted) return

        // Check if we have valid data
        if (!data.ServiceDelivery?.StopMonitoringDelivery?.MonitoredStopVisit) {
          throw new Error("Invalid API response: Missing expected data structure")
        }

        // Extract the station name if available
        const visits = Array.isArray(data.ServiceDelivery.StopMonitoringDelivery.MonitoredStopVisit)
          ? data.ServiceDelivery.StopMonitoringDelivery.MonitoredStopVisit
          : [data.ServiceDelivery.StopMonitoringDelivery.MonitoredStopVisit]

        if (visits.length > 0 && visits[0].MonitoredVehicleJourney?.MonitoredCall?.StopPointName) {
          setStationName(visits[0].MonitoredVehicleJourney.MonitoredCall.StopPointName)
        }

        // Parse the predictions from the response
        const parsedPredictions: TransitPrediction[] = []

        visits.forEach((visit: any) => {
          if (visit && visit.MonitoredVehicleJourney) {
            const journey = visit.MonitoredVehicleJourney
            const call = journey.MonitoredCall

            // Calculate minutes from expected arrival time
            let minutes = 0
            let seconds = 0

            if (call?.ExpectedArrivalTime) {
              const expectedTime = new Date(call.ExpectedArrivalTime).getTime()
              const currentTime = new Date().getTime()
              const diffMs = expectedTime - currentTime

              if (diffMs > 0) {
                minutes = Math.floor(diffMs / 60000)
                seconds = Math.floor((diffMs % 60000) / 1000)
              }
            } else if (call?.ExpectedDepartureTime) {
              // Fallback to departure time if arrival time is not available
              const expectedTime = new Date(call.ExpectedDepartureTime).getTime()
              const currentTime = new Date().getTime()
              const diffMs = expectedTime - currentTime

              if (diffMs > 0) {
                minutes = Math.floor(diffMs / 60000)
                seconds = Math.floor((diffMs % 60000) / 1000)
              }
            } else if (call?.AimedArrivalTime) {
              // Fallback to aimed arrival time
              const expectedTime = new Date(call.AimedArrivalTime).getTime()
              const currentTime = new Date().getTime()
              const diffMs = expectedTime - currentTime

              if (diffMs > 0) {
                minutes = Math.floor(diffMs / 60000)
                seconds = Math.floor((diffMs % 60000) / 1000)
              }
            }

            parsedPredictions.push({
              destination: journey.DestinationName || "Unknown",
              minutes,
              seconds,
              lineRef: journey.LineRef || journey.PublishedLineName || "Unknown",
              vehicleRef: journey.VehicleRef,
              occupancy: journey.Occupancy,
            })
          }
        })

        // Sort by arrival time
        parsedPredictions.sort((a, b) => {
          const aTime = a.minutes * 60 + a.seconds
          const bTime = b.minutes * 60 + b.seconds
          return aTime - bTime
        })

        setPredictions(parsedPredictions)
        setError(null)
      } catch (err) {
        if (!isMounted) return
        console.error("Error fetching transit data:", err)
        setError(err instanceof Error ? err.message : "Unknown error")
        setPredictions([])
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    fetchData()

    // Refresh data every 30 seconds
    const intervalId = setInterval(fetchData, 30000)

    return () => {
      isMounted = false
      clearInterval(intervalId)
    }
  }, [agency, stopCode, line])

  return { predictions, loading, error, stationName }
}
