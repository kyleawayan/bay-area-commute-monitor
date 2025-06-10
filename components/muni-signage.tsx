"use client"
import { useTransitData } from "@/hooks/use-transit-data"
import { useEffect, useState } from "react"

interface MuniSignageProps {
  line: string
  destination: string
  stationName: string
  agency?: string
  stopCode?: string
  selection?: {
    operator?: { id: string; name: string } | null
    line?: { id: string; name: string; color?: string } | null
    pattern?: { id: string; name: string; direction: string; destination: string } | null
    stop?: { code: string; name: string } | null
  }
}

export function MuniSignage({
  line,
  destination,
  stationName = "UCSF/Chase Center",
  agency = "SF",
  stopCode,
  selection,
}: MuniSignageProps) {
  // Use the hook to fetch real transit data
  const { predictions, loading, error, stationName: apiStationName } = useTransitData(agency, stopCode, line)
  const [isCompact, setIsCompact] = useState(false)

  // Use real destination if available
  const displayDestination = predictions.length > 0 ? predictions[0].destination : destination

  // Use API station name if available, otherwise use the provided one
  const displayStationName = apiStationName || stationName

  // Detect if we're in a small viewport
  useEffect(() => {
    const checkSize = () => {
      setIsCompact(window.innerHeight < 400 || window.innerWidth < 600)
    }

    checkSize()
    window.addEventListener("resize", checkSize)
    return () => window.removeEventListener("resize", checkSize)
  }, [])

  return (
    <div
      className={`flex flex-col h-screen w-full bg-white ${isCompact ? "border-l-4" : "border-l-8"} border-red-600 relative`}
    >
      {/* Station name */}
      <div
        className={`absolute ${isCompact ? "top-2 text-sm px-3 py-1" : "top-4 text-sm md:text-base px-4 py-1"} left-1/2 transform -translate-x-1/2 bg-gray-100 rounded-full`}
      >
        <span className="text-gray-600 font-condensed">{displayStationName}</span>
      </div>

      <div className={`flex ${isCompact ? "flex-row" : "flex-col md:flex-row"} flex-1`}>
        {/* Left section with line and destination */}
        <div
          className={`${isCompact ? "w-2/5" : "w-full md:w-1/2"} flex flex-col justify-center ${isCompact ? "p-4" : "p-6 md:p-12"} bg-gradient-to-r from-white to-gray-100`}
        >
          <div className={`flex items-center ${isCompact ? "mb-3" : "mb-4 md:mb-8"}`}>
            <div
              className={`bg-red-600 text-white ${isCompact ? "w-16 h-16" : "w-20 h-20 md:w-24 md:h-24"} rounded-full flex justify-center items-center`}
            >
              <span className={`${isCompact ? "text-3xl" : "text-4xl md:text-6xl"} font-bold`}>
                {selection?.line?.id || line}
              </span>
            </div>
          </div>
          <div className="flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width={isCompact ? "20" : "32"}
              height={isCompact ? "20" : "32"}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`${isCompact ? "w-5 h-5 mr-2" : "w-6 h-6 md:w-10 md:h-10 mr-2 md:mr-4"} text-gray-700`}
            >
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
            <span
              className={`${isCompact ? "text-lg leading-tight" : "text-4xl md:text-6xl"} text-gray-700 font-condensed tracking-tight`}
            >
              {displayDestination}
            </span>
          </div>
        </div>

        {/* Right section with time */}
        <div
          className={`${isCompact ? "w-3/5" : "w-full md:w-1/2"} flex flex-col justify-center items-center ${isCompact ? "p-4" : "p-6 md:p-12"} bg-gradient-to-r from-gray-100 to-blue-50`}
        >
          {/* Main arrival time display */}
          <div className="flex items-baseline">
            {predictions.length > 0 ? (
              <>
                <span
                  className={`${isCompact ? "text-6xl" : "text-5xl md:text-8xl"} font-bold text-blue-600 font-condensed`}
                >
                  {predictions[0].minutes}
                </span>
                <span
                  className={`${isCompact ? "text-2xl" : "text-xl md:text-3xl"} text-blue-600 ml-1 md:ml-2 font-condensed`}
                >
                  min
                </span>

                {predictions.length > 1 && (
                  <>
                    <span
                      className={`${isCompact ? "text-4xl ml-4" : "text-3xl md:text-5xl ml-3 md:ml-6"} font-bold text-blue-400 font-condensed`}
                    >
                      {predictions[1].minutes}
                    </span>
                    <span
                      className={`${isCompact ? "text-xl" : "text-lg md:text-2xl"} text-blue-400 ml-1 md:ml-2 font-condensed`}
                    >
                      min
                    </span>
                  </>
                )}
              </>
            ) : (
              <span className={`${isCompact ? "text-2xl" : "text-3xl md:text-5xl"} text-gray-400 font-condensed`}>
                No arrivals
              </span>
            )}
          </div>

          {!isCompact && (
            <div className="mt-2 text-gray-500 font-condensed text-sm md:text-base">Estimated arrival times</div>
          )}

          {/* Show loading or error state - compact version */}
          {loading && isCompact && (
            <div className="mt-2">
              <svg
                className="animate-spin h-4 w-4 text-blue-500"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            </div>
          )}

          {/* Show loading or error state - full version */}
          {loading && !isCompact && (
            <div className="mt-4 flex items-center text-gray-400 text-sm">
              <svg
                className="animate-spin -ml-1 mr-2 h-4 w-4 text-blue-500"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Loading real-time data...
            </div>
          )}

          {error && !isCompact && (
            <div className="mt-4 text-red-500 text-sm flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 mr-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              {error}
            </div>
          )}

          {/* Show next arrivals if available - hide on compact */}
          {predictions.length > 2 && !isCompact && (
            <div className="mt-4 w-full max-w-xs">
              <h3 className="text-sm text-gray-500 mb-2">More arrivals:</h3>
              <div className="space-y-2">
                {predictions.slice(2, 5).map((prediction, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span className="text-gray-600">{prediction.destination}</span>
                    <span className="text-blue-600 font-medium">{prediction.minutes} min</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
