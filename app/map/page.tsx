"use client"

import dynamic from "next/dynamic"
import Link from "next/link"
import { AthleteDashboardShell } from "@/components/dashboard/AthleteDashboardShell"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Autocomplete,
  Libraries,
  useJsApiLoader,
  type Autocomplete as GoogleAutocomplete,
  type PlaceResult,
} from "@react-google-maps/api"
import {
  Search,
  MapPin,
  List,
  X,
  Navigation,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Car,
  Footprints,
} from "lucide-react"
import { useState, useEffect, useRef } from "react"
import { getTrainerMapEntries } from "@/lib/supabase/locations"
import { getSpecialtyEmoji } from "@/lib/map-utils"
import type { TrainerMapEntry } from "@/types/location"
import type { RouteLine } from "./MapView"

type ClientLocation = { lat: number; lng: number }
type LocationStatus = "idle" | "loading" | "granted" | "denied"
type TrainerWithDistance = TrainerMapEntry & { distanceMi: number | null; distanceLabel: string }

type RouteSegment = { distanceKm: number; durationMin: number; line: RouteLine } | null
type RouteInfo = { driving: RouteSegment; walking: RouteSegment }
const MAP_LIBRARIES: Libraries = ["places"]

// OSRM public server only supports the driving profile.
// Walking time is derived from driving distance at 5 km/h walking speed.
async function fetchDrivingRoute(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number
): Promise<RouteSegment> {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${fromLng},${fromLat};${toLng},${toLat}?overview=full&geometries=geojson`
    const res = await fetch(url)
    const data = await res.json()
    if (data.code !== "Ok" || !data.routes?.length) return null
    const route = data.routes[0]
    const line: RouteLine = (route.geometry.coordinates as [number, number][]).map(
      ([lng, lat]) => [lat, lng]
    )
    return {
      distanceKm: route.distance / 1000,
      durationMin: Math.round(route.duration / 60),
      line,
    }
  } catch {
    return null
  }
}

function deriveWalkingRoute(driving: RouteSegment): RouteSegment {
  if (!driving) return null
  const WALKING_SPEED_KMH = 5
  return {
    distanceKm: driving.distanceKm,
    durationMin: Math.round((driving.distanceKm / WALKING_SPEED_KMH) * 60),
    line: driving.line,
  }
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

const MapView = dynamic(() => import("./MapView"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-secondary">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  ),
})

function getDistanceMiles(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3958.8
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function TrainerListCard({
  trainer,
  isSelected,
  onClick,
}: {
  trainer: TrainerWithDistance
  isSelected: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-4 rounded-lg transition-colors ${
        isSelected
          ? "bg-primary/10 border border-primary"
          : "bg-card border border-border hover:border-primary/50"
      }`}
    >
      <div className="flex items-center gap-3">
        {trainer.avatar ? (
          <img
            src={trainer.avatar}
            alt={trainer.trainer_name}
            className="w-12 h-12 rounded-full object-cover shrink-0"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-secondary shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-sm">{getSpecialtyEmoji(trainer.specialties)}</span>
            <h3 className="font-medium text-foreground truncate">{trainer.trainer_name}</h3>
          </div>
          {trainer.specialties.length > 0 && (
            <p className="text-sm text-muted-foreground truncate">
              {trainer.specialties.slice(0, 2).join(" · ")}
            </p>
          )}
          <div className="flex items-center gap-2 mt-1">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="w-3 h-3" />
              {trainer.distanceLabel}
            </div>
            <span className="text-xs font-medium text-primary">
              ${trainer.price_per_session}/session
            </span>
          </div>
        </div>
      </div>
    </button>
  )
}

export default function MapPage() {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  const { isLoaded: placesLoaded } = useJsApiLoader({
    id: "gymovaflow-google-map",
    googleMapsApiKey: apiKey ?? "",
    libraries: MAP_LIBRARIES,
  })
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTrainer, setSelectedTrainer] = useState<number | null>(null)
  const [isPanelOpen, setIsPanelOpen] = useState(true)
  const [trainers, setTrainers] = useState<TrainerMapEntry[]>([])
  const [loadingTrainers, setLoadingTrainers] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [clientLocation, setClientLocation] = useState<ClientLocation | null>(null)
  const [locationStatus, setLocationStatus] = useState<LocationStatus>("idle")
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null)
  const [routeMode, setRouteMode] = useState<"driving" | "walking">("driving")
  const [fetchingRoute, setFetchingRoute] = useState(false)
  const [locationSearchQuery, setLocationSearchQuery] = useState("")
  const [locationSearchLoading, setLocationSearchLoading] = useState(false)
  const [locationSearchError, setLocationSearchError] = useState<string | null>(null)
  const [cityFilter, setCityFilter] = useState<string | null>(null)
  const autocompleteRef = useRef<GoogleAutocomplete | null>(null)

  useEffect(() => {
    setLoadingTrainers(true)
    getTrainerMapEntries(cityFilter ?? undefined).then(({ data, error }) => {
      if (error) setFetchError(error)
      else {
        setFetchError(null)
        setTrainers(data)
      }
      setLoadingTrainers(false)
    })
  }, [cityFilter])

  const geoRequestIdRef = useRef(0)

  const applyLocation = (latitude: number, longitude: number, _fromGps = false) => {
    console.log("User location:", latitude, longitude)
    setClientLocation({ lat: latitude, lng: longitude })
    setLocationStatus("granted")
  }

  const GEO_OPTIONS: PositionOptions = {
    enableHighAccuracy: true,
    timeout: 15000,
    maximumAge: 0,
  }

  useEffect(() => {
    if (!navigator.geolocation) return
    const id = ++geoRequestIdRef.current
    setLocationStatus("loading")
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (id !== geoRequestIdRef.current) return
        applyLocation(pos.coords.latitude, pos.coords.longitude, true)
      },
      (err) => {
        if (id !== geoRequestIdRef.current) return
        console.warn("Geolocation error:", err.message)
        setLocationStatus("denied")
      },
      GEO_OPTIONS
    )
  }, [])

  const requestLocation = () => {
    if (!navigator.geolocation) { setLocationStatus("denied"); return }
    const id = ++geoRequestIdRef.current
    setLocationStatus("loading")
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (id !== geoRequestIdRef.current) return
        applyLocation(pos.coords.latitude, pos.coords.longitude, true)
      },
      (err) => {
        if (id !== geoRequestIdRef.current) return
        console.warn("Geolocation retry error:", err.message)
        setLocationStatus("denied")
      },
      GEO_OPTIONS
    )
  }

  const getCityFromPlace = (place: PlaceResult): string | null => {
    const components = place.address_components ?? []
    const city = components.find((c) => c.types.includes("locality"))?.long_name
    if (city) return city
    const fallback = components.find((c) => c.types.includes("administrative_area_level_2"))?.long_name
    return fallback ?? null
  }

  const applySelectedPlace = (place: PlaceResult) => {
    const lat = place.geometry?.location?.lat()
    const lng = place.geometry?.location?.lng()
    if (typeof lat !== "number" || typeof lng !== "number") {
      setLocationSearchError("Address not found. Try selecting a suggestion.")
      return
    }

    const city = getCityFromPlace(place)
    applyLocation(lat, lng, false)
    setLocationSearchQuery(place.formatted_address ?? place.name ?? "")
    setCityFilter(city ? city.toLowerCase() : null)
    setRouteInfo(null)
    setLocationSearchError(null)
    setSelectedTrainer(null)
  }

  const handleLocationSearch = async () => {
    const q = locationSearchQuery.trim()
    if (!q) return
    if (!placesLoaded || !autocompleteRef.current) {
      setLocationSearchError("Location search is loading. Try again in a moment.")
      return
    }
    setLocationSearchLoading(true)
    const place = autocompleteRef.current.getPlace()
    if (!place || !place.geometry?.location) {
      setLocationSearchLoading(false)
      setLocationSearchError("Please select a location from suggestions.")
      return
    }
    applySelectedPlace(place)
    setLocationSearchLoading(false)
  }

  const withDistance = (trainer: TrainerMapEntry): TrainerWithDistance => {
    if (!clientLocation) return { ...trainer, distanceMi: null, distanceLabel: "Nearby" }
    const d = getDistanceMiles(clientLocation.lat, clientLocation.lng, trainer.latitude, trainer.longitude)
    return { ...trainer, distanceMi: d, distanceLabel: d < 0.1 ? "< 0.1 mi" : `${d.toFixed(1)} mi` }
  }

  // Fetch driving + walking routes whenever selected trainer or location changes
  useEffect(() => {
    const trainer = trainers.find((t) => t.trainer_id === selectedTrainer)
    if (!trainer || !clientLocation) {
      setRouteInfo(null)
      return
    }
    setFetchingRoute(true)
    fetchDrivingRoute(clientLocation.lat, clientLocation.lng, trainer.latitude, trainer.longitude)
      .then((driving) => {
        setRouteInfo({ driving, walking: deriveWalkingRoute(driving) })
        setFetchingRoute(false)
      })
  }, [selectedTrainer, clientLocation, trainers])

  const activeRoute = routeInfo
    ? routeMode === "driving"
      ? routeInfo.driving
      : routeInfo.walking
    : null

  const filteredTrainers: TrainerWithDistance[] = trainers
    .filter(
      (t) =>
        (t.trainer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.specialties.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase())))
    )
    .map(withDistance)
    .sort((a, b) => {
      if (a.distanceMi === null || b.distanceMi === null) return 0
      return a.distanceMi - b.distanceMi
    })

  const selected = filteredTrainers.find((t) => t.trainer_id === selectedTrainer)

  return (
    <AthleteDashboardShell title="Map" contentClassName="p-0">
      <div className="h-[calc(100vh-4rem)] bg-background flex flex-col">
        <div className="border-b border-border bg-background/95 backdrop-blur-md">
          <div className="max-w-full mx-auto px-4 py-2 flex flex-col gap-2">
          {/* Row 1: Logo, trainer search, List View */}
          <div className="flex items-center justify-between gap-2 h-12">
            <div className="flex-1 max-w-md min-w-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground shrink-0" />
                <Input
                  placeholder="Search trainers by name or specialty..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-input border-border"
                />
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Link href="/trainers">
                <Button variant="outline" size="sm" className="border-border text-foreground hover:bg-secondary">
                  <List className="w-4 h-4 mr-2" />
                  List View
                </Button>
              </Link>
            </div>
          </div>
          {/* Row 2: Set your location (Uber/DoorDash style) */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative flex-1 min-w-[200px] flex items-center gap-2">
              <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
              {placesLoaded ? (
                <Autocomplete
                  onLoad={(instance) => {
                    autocompleteRef.current = instance
                  }}
                  onPlaceChanged={() => {
                    const place = autocompleteRef.current?.getPlace()
                    if (!place) return
                    applySelectedPlace(place)
                  }}
                  options={{
                    fields: ["address_components", "formatted_address", "geometry", "name"],
                    types: ["geocode"],
                  }}
                >
                  <Input
                    placeholder="Enter your address or city (e.g. Wolfville, NS)"
                    value={locationSearchQuery}
                    onChange={(e) => {
                      setLocationSearchQuery(e.target.value)
                      setLocationSearchError(null)
                    }}
                    onKeyDown={(e) => e.key === "Enter" && handleLocationSearch()}
                    className="bg-input border-border"
                  />
                </Autocomplete>
              ) : (
                <Input
                  placeholder="Enter your address or city (e.g. Wolfville, NS)"
                  value={locationSearchQuery}
                  onChange={(e) => {
                    setLocationSearchQuery(e.target.value)
                    setLocationSearchError(null)
                  }}
                  className="bg-input border-border"
                />
              )}
              <Button
                onClick={handleLocationSearch}
                disabled={locationSearchLoading || !locationSearchQuery.trim()}
                className="shrink-0 bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {locationSearchLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Set location"
                )}
              </Button>
            </div>
            <span className="text-xs text-muted-foreground hidden sm:inline">
              or use GPS
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={requestLocation}
              disabled={locationStatus === "loading"}
              className="shrink-0 text-muted-foreground"
            >
              {locationStatus === "loading" ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Navigation className="w-4 h-4" />
              )}
            </Button>
          </div>
          {locationSearchError && (
            <p className="text-xs text-destructive">{locationSearchError}</p>
          )}
        </div>
      </div>

      <main className="flex-1 relative">

        {/* Real map — fills entire background */}
        <div className="absolute inset-0">
          <MapView
            trainers={filteredTrainers}
            clientLocation={clientLocation}
            selectedTrainer={selectedTrainer}
            onSelectTrainer={setSelectedTrainer}
            routeLine={activeRoute?.line ?? null}
            routeMode={routeMode}
            onLocationSet={(lat, lng) => {
              applyLocation(lat, lng, false)
              setRouteInfo(null)
            }}
          />

          {/* Location button overlay */}
          <div className="absolute top-4 right-4 z-1100 flex flex-col gap-2">
            <Button
              size="icon"
              variant="secondary"
              onClick={requestLocation}
              disabled={locationStatus === "loading"}
              title={
                locationStatus === "granted"
                  ? "Location active — click to refresh"
                  : locationStatus === "denied"
                  ? "Location permission denied"
                  : "Use my location to sort by distance"
              }
              className={`border border-border transition-colors shadow-md ${
                locationStatus === "granted"
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : locationStatus === "denied"
                  ? "bg-destructive/10 text-destructive border-destructive/30"
                  : "bg-card"
              }`}
            >
              {locationStatus === "loading" ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Navigation className={`w-4 h-4 ${locationStatus === "granted" ? "fill-primary-foreground" : ""}`} />
              )}
            </Button>
          </div>

          {/* Stats bar overlay */}
          <div className="absolute bottom-4 left-4 z-1100 bg-card/90 backdrop-blur-sm border border-border rounded-lg px-3 py-2 shadow-md">
            {loadingTrainers ? (
              <p className="text-sm font-medium text-foreground">Loading trainers...</p>
            ) : (
              <>
                <p className="text-sm font-medium text-foreground">
                  {filteredTrainers.length} trainer{filteredTrainers.length !== 1 ? "s" : ""} found
                </p>
                {locationStatus === "granted" && clientLocation ? (
                  <p className="text-xs text-muted-foreground">
                    📍 {clientLocation.lat.toFixed(4)}, {clientLocation.lng.toFixed(4)} · sorted by distance
                  </p>
                ) : locationStatus === "denied" ? (
                  <p className="text-xs text-muted-foreground">⚠️ Location denied — set address above or click map</p>
                ) : (
                  <p className="text-xs text-muted-foreground">Set your address above or click map</p>
                )}
              </>
            )}
          </div>

          {/* Data fetch error */}
          {fetchError && (
            <div className="absolute inset-0 flex items-center justify-center z-1100">
              <p className="text-sm text-destructive bg-card px-4 py-2 rounded-lg border border-destructive/30 shadow">
                {fetchError}
              </p>
            </div>
          )}
        </div>

        {/* Sidebar toggle tab */}
        <button
          onClick={() => setIsPanelOpen(!isPanelOpen)}
          className="absolute top-1/2 -translate-y-1/2 z-1100 w-6 h-16 bg-card border border-border rounded-r-lg flex items-center justify-center transition-all shadow-md"
          style={{ left: isPanelOpen ? "384px" : "0" }}
        >
          {isPanelOpen ? (
            <ChevronLeft className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          )}
        </button>

        {/* Sidebar */}
        <div
          className={`absolute top-0 left-0 h-full w-96 bg-background border-r border-border z-1100 transition-transform duration-300 ${
            isPanelOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="h-full flex flex-col">
            <div className="p-4 border-b border-border">
              <h2 className="font-semibold text-foreground">
                {locationStatus === "granted" ? "Trainers Near You" : "Trainers"}
              </h2>
              <p className="text-sm text-muted-foreground">
                {filteredTrainers.length} result{filteredTrainers.length !== 1 ? "s" : ""}
                {locationStatus === "granted" && " · sorted by distance"}
              </p>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {filteredTrainers.map((trainer) => (
                <TrainerListCard
                  key={`${trainer.trainer_id}-${trainer.gym_location_id}`}
                  trainer={trainer}
                  isSelected={selectedTrainer === trainer.trainer_id}
                  onClick={() => setSelectedTrainer(trainer.trainer_id)}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Selected trainer detail card */}
        {selected && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-1200 w-full max-w-md px-4 lg:left-auto lg:translate-x-0 lg:right-4">
            <Card className="bg-card border-border shadow-lg">
              <CardContent className="p-4">
                <button
                  onClick={() => { setSelectedTrainer(null); setRouteInfo(null) }}
                  className="absolute top-2 right-2 p-1 rounded-full hover:bg-secondary"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>

                <div className="flex items-start gap-4">
                  {selected.avatar ? (
                    <img
                      src={selected.avatar}
                      alt={selected.trainer_name}
                      className="w-16 h-16 rounded-xl object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-secondary shrink-0 flex items-center justify-center text-3xl">
                      {getSpecialtyEmoji(selected.specialties)}
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="font-semibold text-card-foreground">{selected.trainer_name}</h3>
                    {selected.specialties.length > 0 && (
                      <p className="text-sm text-muted-foreground">
                        {selected.specialties.slice(0, 2).join(" · ")}
                      </p>
                    )}
                    <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                      <MapPin className="w-3 h-3" />
                      {selected.distanceLabel}
                    </div>
                    <p className="text-lg font-bold text-primary mt-1">
                      ${selected.price_per_session}/session
                    </p>
                  </div>
                </div>

                {/* Travel time row */}
                <div className="mt-3 rounded-lg border border-border overflow-hidden">
                  <div className="flex">
                    <button
                      onClick={() => setRouteMode("driving")}
                      className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium transition-colors ${
                        routeMode === "driving"
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <Car className="w-4 h-4" />
                      {fetchingRoute ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : routeInfo?.driving ? (
                        <span>{formatDuration(routeInfo.driving.durationMin)} · {routeInfo.driving.distanceKm.toFixed(1)} km</span>
                      ) : (
                        <span>Drive</span>
                      )}
                    </button>
                    <button
                      onClick={() => setRouteMode("walking")}
                      className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium transition-colors border-l border-border ${
                        routeMode === "walking"
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <Footprints className="w-4 h-4" />
                      {fetchingRoute ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : routeInfo?.walking ? (
                        <span>{formatDuration(routeInfo.walking.durationMin)} · {routeInfo.walking.distanceKm.toFixed(1)} km</span>
                      ) : (
                        <span>Walk</span>
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-3">
                  <Link href={`/trainers/${selected.trainer_id}`} className="flex-1">
                    <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                      View Profile
                    </Button>
                  </Link>
                  <Link href={`/booking/${selected.trainer_id}`}>
                    <Button variant="outline" className="border-border text-foreground hover:bg-secondary">
                      Book Now
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
    </AthleteDashboardShell>
  )
}
