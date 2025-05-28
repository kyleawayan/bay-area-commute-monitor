"use client"
import { useTransitData } from "@/hooks/use-transit-data"

interface MuniSignageProps {
  line: string
  destination: string
  stationName: string
  agency?: string
  stopCode?: string
  selection?: {
    line?: { id: string; name: string }
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

  // Use real destination if available
  const displayDestination = predictions.length > 0 ? predictions[0].destination : destination

  // Use API station name if available, otherwise use the provided one
  const displayStationName = apiStationName || stationName

  return (
    <div className="flex flex-col h-screen w-full bg-white border-l-8 border-red-600 relative">
      {/* Station name */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-gray-100 px-4 py-1 rounded-full">
        <span className="text-sm md:text-base text-gray-600 font-condensed">{displayStationName}</span>
      </div>

      <div className="flex flex-col md:flex-row flex-1">
        {/* Left section with line and destination */}
        <div className="w-full md:w-1/2 flex flex-col justify-center p-6 md:p-12 bg-gradient-to-r from-white to-gray-100">
          <div className="flex items-center mb-4 md:mb-8">
            <div className="bg-red-600 text-white rounded-full px-4 py-2 md:px-8 md:py-3 inline-flex justify-center items-center">
              <span className="text-4xl md:text-6xl font-bold">{selection?.line?.id || line}</span>
            </div>
          </div>
          <div className="flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-6 h-6 md:w-10 md:h-10 mr-2 md:mr-4 text-gray-700"
            >
              <path d="M5 12h14" />
              <path d="m12 5 7 7-7 7" />
            </svg>
            <span className="text-4xl md:text-6xl text-gray-700 font-condensed tracking-tight">
              {displayDestination}
            </span>
          </div>
        </div>

        {/* Right section with time */}
        <div className="w-full md:w-1/2 flex flex-col justify-center items-center p-6 md:p-12 bg-gradient-to-r from-gray-100 to-blue-50">
          <div className="flex items-center mb-2 md:mb-4">
            {/* Person icons */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#2e856e"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mr-1 md:mr-2 md:w-9 md:h-9"
            >
              <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#8a9ca7"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mr-1 md:mr-2 md:w-9 md:h-9"
            >
              <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#8a9ca7"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mr-1 md:mr-2 md:w-9 md:h-9"
            >
              <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>

          {/* Main arrival time display */}
          <div className="flex items-baseline">
            {predictions.length > 0 ? (
              <>
                <span className="text-5xl md:text-8xl font-bold text-blue-600 font-condensed">
                  {predictions[0].minutes}
                </span>
                <span className="text-xl md:text-3xl text-blue-600 ml-1 md:ml-2 font-condensed">min</span>

                {predictions.length > 1 && (
                  <>
                    <span className="text-3xl md:text-5xl font-bold text-blue-400 font-condensed ml-3 md:ml-6">
                      {predictions[1].minutes}
                    </span>
                    <span className="text-lg md:text-2xl text-blue-400 ml-1 md:ml-2 font-condensed">min</span>
                  </>
                )}
              </>
            ) : (
              <span className="text-3xl md:text-5xl text-gray-400 font-condensed">No arrivals</span>
            )}
          </div>
          <div className="mt-2 text-gray-500 font-condensed text-sm md:text-base">Estimated arrival times</div>

          {/* Show loading or error state */}
          {loading && (
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

          {error && (
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

          {/* Show next arrivals if available */}
          {predictions.length > 2 && (
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
