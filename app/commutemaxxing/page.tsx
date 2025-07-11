"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Clock, Car, Train, Navigation, RefreshCw, ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { TRAVEL_TIMES, WALK_TIMES } from "@/app/lib/commute-optimizer";

interface OptimizationResult {
  optimal_departure: string;
  total_journey_time: number;
  arrival_time: string;
  confidence: number;
  segments: Array<{
    mode: string;
    from: string;
    to: string;
    duration: number;
    departure: string;
    arrival: string;
    wait_time?: number;
    line?: string;
  }>;
  alternatives: Array<{
    departure: string;
    total_time: number;
    arrival: string;
    confidence: number;
  }>;
}

export default function CommuteMaxxing() {
  const [direction, setDirection] = useState<"to_work" | "to_home">("to_work");
  const [driveTime, setDriveTime] = useState(20);
  const [departureStart, setDepartureStart] = useState("08:30");
  const [departureEnd, setDepartureEnd] = useState("09:00");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<OptimizationResult | null>(null);

  const showSampleResults = () => {
    // Generate sample data using the same structure as real optimizer
    const sampleResult: OptimizationResult = {
      optimal_departure: "08:58",
      total_journey_time: TRAVEL_TIMES.bart.north_concord_to_powell + TRAVEL_TIMES.muni.union_square_to_ucsf + WALK_TIMES.parking_to_bart + WALK_TIMES.bart_to_muni + WALK_TIMES.muni_to_office + driveTime,
      arrival_time: "10:35",
      confidence: 85,
      segments: [
        {
          mode: "drive",
          from: "Home",
          to: "North Concord BART Parking",
          duration: driveTime,
          departure: "08:58",
          arrival: "09:18"
        },
        {
          mode: "walk",
          from: "BART Parking",
          to: "North Concord BART Station",
          duration: WALK_TIMES.parking_to_bart,
          departure: "09:18",
          arrival: "09:23"
        },
        {
          mode: "bart",
          from: "North Concord BART",
          to: "Powell St BART",
          duration: TRAVEL_TIMES.bart.north_concord_to_powell,
          departure: "09:23",
          arrival: "10:14",
          wait_time: 0,
          line: "Yellow-N Daly City"
        },
        {
          mode: "walk",
          from: "Powell St BART",
          to: "Union Square Muni",
          duration: WALK_TIMES.bart_to_muni,
          departure: "10:14",
          arrival: "10:22"
        },
        {
          mode: "muni",
          from: "Union Square Muni",
          to: "UCSF/Chase Center",
          duration: TRAVEL_TIMES.muni.union_square_to_ucsf,
          departure: "10:25",
          arrival: "10:40",
          wait_time: 3,
          line: "T Third Street"
        },
        {
          mode: "walk",
          from: "UCSF/Chase Center",
          to: "Office",
          duration: WALK_TIMES.muni_to_office,
          departure: "10:40",
          arrival: "10:47"
        }
      ],
      alternatives: [
        {
          departure: "08:43",
          total_time: 102,
          arrival: "10:25",
          confidence: 82
        },
        {
          departure: "09:13",
          total_time: 99,
          arrival: "10:52",
          confidence: 80
        }
      ]
    };
    
    setResult(sampleResult);
    setError(null);
  };

  const fetchOptimization = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch("/api/optimize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          direction,
          preferred_departure_window: {
            start: departureStart,
            end: departureEnd,
          },
          drive_time_minutes: driveTime,
          // Always use current time for real-time data
          current_time: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to optimize commute");
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const getModeIcon = (mode: string) => {
    switch (mode) {
      case "drive":
        return <Car className="h-4 w-4" />;
      case "bart":
      case "muni":
        return <Train className="h-4 w-4" />;
      case "walk":
        return <Navigation className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}min`;
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold tracking-tight mb-2">commuteMAXXING</h1>
        <p className="text-muted-foreground">Optimize your Bay Area commute timing</p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Commute Settings</CardTitle>
          <CardDescription>Configure your journey parameters</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center space-x-4">
            <Label htmlFor="direction" className="min-w-[100px]">Direction</Label>
            <div className="flex items-center space-x-2">
              <span className={direction === "to_home" ? "font-medium" : "text-muted-foreground"}>
                To Home
              </span>
              <Switch
                id="direction"
                checked={direction === "to_work"}
                onCheckedChange={(checked) => setDirection(checked ? "to_work" : "to_home")}
              />
              <span className={direction === "to_work" ? "font-medium" : "text-muted-foreground"}>
                To Work
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="drive-time">Drive time to BART station</Label>
              <span className="text-sm font-medium">{driveTime} minutes</span>
            </div>
            <Slider
              id="drive-time"
              min={5}
              max={30}
              step={1}
              value={[driveTime]}
              onValueChange={([value]) => setDriveTime(value)}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">Check Google Maps for accurate drive time</p>
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> This app uses real-time transit data and works best during actual commute hours (6-10 AM, 4-7 PM) when live departure information is available. Outside these hours, limited departure data may be available.
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="departure-start">Departure window start</Label>
                <Input
                  id="departure-start"
                  type="time"
                  value={departureStart}
                  onChange={(e) => setDepartureStart(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="departure-end">Departure window end</Label>
                <Input
                  id="departure-end"
                  type="time"
                  value={departureEnd}
                  onChange={(e) => setDepartureEnd(e.target.value)}
                />
              </div>
            </div>
          </div>

          <Button 
            onClick={fetchOptimization} 
            disabled={loading}
            className="w-full"
            size="lg"
          >
            {loading ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Calculating...
              </>
            ) : (
              <>
                <Clock className="mr-2 h-4 w-4" />
                Get Recommendation
              </>
            )}
          </Button>

          {process.env.NODE_ENV === 'development' && (
            <Button
              onClick={showSampleResults}
              variant="outline"
              className="w-full mt-2"
              size="lg"
            >
              <Badge className="mr-2" variant="secondary">DEV</Badge>
              Show Sample Results
            </Button>
          )}
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading && (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      )}

      {result && !loading && (
        <>
          {result.optimal_departure ? (
            <Card className="mb-6 border-2 border-primary">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-2xl">Optimal Departure</CardTitle>
                  <Badge variant="secondary" className="text-lg px-3 py-1">
                    {result.confidence}% confidence
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Leave house</p>
                    <p className="text-3xl font-bold">{result.optimal_departure}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Total time</p>
                    <p className="text-3xl font-bold">{formatDuration(result.total_journey_time)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Arrive</p>
                    <p className="text-3xl font-bold">{result.arrival_time}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium mb-2">Journey Timeline</h4>
                  {result.segments.map((segment, idx) => (
                    <div key={idx} className="flex items-center space-x-3 text-sm">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted">
                        {getModeIcon(segment.mode)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">
                            {segment.from} → {segment.to}
                          </span>
                          <span className="text-muted-foreground">
                            {segment.departure} - {segment.arrival}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                          <span>{formatDuration(segment.duration)}</span>
                          {segment.wait_time !== undefined && (
                            <span>• {segment.wait_time}min wait</span>
                          )}
                          {segment.line && (
                            <span>• {segment.line}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Alert className="mb-6">
              <AlertDescription>
                No optimal routes found. This may be because real-time transit data is not available for your preferred departure time. Real-time data typically only shows the next few departures from now.
              </AlertDescription>
            </Alert>
          )}

          {result.alternatives && result.alternatives.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Alternative Options</h3>
              {result.alternatives.map((alt, idx) => (
                <Card key={idx}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">Leave at {alt.departure}</p>
                          <p className="text-sm text-muted-foreground">
                            Arrive at {alt.arrival} • {formatDuration(alt.total_time)} total
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline">{alt.confidence}%</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <div className="mt-6 flex justify-center">
            <Button
              variant="outline"
              onClick={fetchOptimization}
              className="flex items-center"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh with latest data
            </Button>
          </div>
        </>
      )}
    </div>
  );
}