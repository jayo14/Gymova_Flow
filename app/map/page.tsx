"use client"

import dynamic from "next/dynamic"
import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import { AthleteDashboardShell } from "@/components/dashboard/AthleteDashboardShell"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { getDistanceMiles, getSpecialtyEmoji, type LocationSuggestion } from "@/lib/map-utils"
import { getTrainerMapEntries } from "@/lib/supabase/locations"
import type { TrainerMapEntry } from "@/types/location"
import {
  Car,
  ChevronLeft,
  ChevronRight,
  Footprints,
  List,
  Loader2,
  MapPin,
  Navigation,
  Search,
  X,
} from "lucide-react"
import type { RouteLine } from "./MapView"

type ClientLocation = { lat: number; lng: number }
type LocationStatus = "idle" | "loading" | "granted" | "denied"
type TrainerWithDistance = TrainerMapEntry & { distanceMi: number | null; distanceLabel: string }
type RouteSegment = { distanceKm: number; durationMin: number; line: RouteLine } | null
type RouteInfo = { driving: RouteSegment; walking: RouteSegment }

async function fetchRoute(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number,
  profile: "driving" | "walking"
): Promise<RouteSegment> {
  try {
    const url = `/api/route?fromLat=${fromLat}&fromLng=${fromLng}&toLat=${toLat}&toLng=${toLng}&profile=${profile}`
    const res = await fetch(url)
    if (!res.ok) return null
    const data = await res.json()
    return {
      distanceKm: data.distanceKm,
      durationMin: data.durationMin,
      line: data.line,
    }
  } catch {
    return null
  }
}

async function searchLocations(query: string): Promise<LocationSuggestion[]> {
  const trimmedQuery = query.trim()
  if (trimmedQuery.length < 2) return []

  const res = await fetch(`/api/geocode?q=${encodeURIComponent(trimmedQuery)}`)
  if (!res.ok) return []
  const data = await res.json()
  return data.suggestions ?? []
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
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTrainer, setSelectedTrainer] = useState<string | null>(null)
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
  const [locationSuggestions, setLocationSuggestions] = useState<LocationSuggestion[]>([])
  const [locationSearchError, setLocationSearchError] = useState<string | null>(null)
  const [cityFilter, setCityFilter] = useState<string | null>(null)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const geoRequestIdRef = useRef(0)
  const suggestionRequestRef = useRef(0)

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

  const applyLocation = (latitude: number, longitude: number) => {
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
        applyLocation(pos.coords.latitude, pos.coords.longitude)
      },
      () => {
        if (id !== geoRequestIdRef.current) return
        setLocationStatus("denied")
      },
      GEO_OPTIONS
    )
  }, [])

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus("denied")
      return
    }

    const id = ++geoRequestIdRef.current
    setLocationStatus("loading")
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (id !== geoRequestIdRef.current) return
        applyLocation(pos.coords.latitude, pos.coords.longitude)
      },
      () => {
        if (id !== geoRequestIdRef.current) return
        setLocationStatus("denied")
      },
      GEO_OPTIONS
    )
  }

  const applySelectedLocation = (place: LocationSuggestion) => {
    applyLocation(place.lat, place.lng)
    setLocationSearchQuery(place.label)
    setCityFilter(place.city ? place.city.toLowerCase() : null)
    setRouteInfo(null)
    setLocationSearchError(null)
    setSelectedTrainer(null)
    setShowSuggestions(false)
  }

  useEffect(() => {
    const query = locationSearchQuery.trim()
    if (query.length < 2) {
      setLocationSuggestions([])
      return
    }

    const requestId = ++suggestionRequestRef.current
    const timeoutId = window.setTimeout(() => {
      searchLocations(query)
        .then((results) => {
          if (requestId !== suggestionRequestRef.current) return
          setLocationSuggestions(results)
        })
        .catch(() => {
          if (requestId !== suggestionRequestRef.current) return
          setLocationSuggestions([])
        })
    }, 250)

    return () => window.clearTimeout(timeoutId)
  }, [locationSearchQuery])

  const handleLocationSearch = async () => {
    const query = locationSearchQuery.trim()
    if (!query) return

    setLocationSearchLoading(true)
    const results = locationSuggestions.length > 0 ? locationSuggestions : await searchLocations(query)
    const firstResult = results[0]

    if (!firstResult) {
      setLocationSearchLoading(false)
      setLocationSearchError("Address not found. Try a more specific search.")
      return
    }

    applySelectedLocation(firstResult)
    setLocationSearchLoading(false)
  }

  const withDistance = (trainer: TrainerMapEntry): TrainerWithDistance => {
    if (!clientLocation) return { ...trainer, distanceMi: null, distanceLabel: "Nearby" }
    const distanceMi = getDistanceMiles(
      clientLocation.lat,
      clientLocation.lng,
      trainer.latitude,
      trainer.longitude
    )

    return {
      ...trainer,
      distanceMi,
      distanceLabel: distanceMi < 0.1 ? "< 0.1 mi" : `${distanceMi.toFixed(1)} mi`,
    }
  }

  useEffect(() => {
    const trainer = trainers.find((entry) => entry.trainer_id === selectedTrainer)
    if (!trainer || !clientLocation) {
      setRouteInfo(null)
      return
    }

    setFetchingRoute(true)
    Promise.all([
      fetchRoute(clientLocation.lat, clientLocation.lng, trainer.latitude, trainer.longitude, "driving"),
      fetchRoute(clientLocation.lat, clientLocation.lng, trainer.latitude, trainer.longitude, "walking"),
    ])
      .then(([driving, walking]) => {
        setRouteInfo({ driving, walking })
      })
      .finally(() => setFetchingRoute(false))
  }, [selectedTrainer, clientLocation, trainers])

  const activeRoute = routeInfo
    ? routeMode === "driving"
      ? routeInfo.driving
      : routeInfo.walking
    : null

  const filteredTrainers: TrainerWithDistance[] = trainers
    .filter(
      (trainer) =>
        trainer.trainer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        trainer.specialties.some((specialty) => specialty.toLowerCase().includes(searchQuery.toLowerCase()))
    )
    .map(withDistance)
    .sort((a, b) => {
      if (a.distanceMi === null || b.distanceMi === null) return 0
      return a.distanceMi - b.distanceMi
    })

  const selected = filteredTrainers.find((trainer) => trainer.trainer_id === selectedTrainer)

  return (
    <AthleteDashboardShell title="Map" contentClassName="p-0">
      <div className="h-[calc(100vh-4rem)] bg-background flex flex-col">
        <div className="border-b border-border bg-background/95 backdrop-blur-md">
          <div className="max-w-full mx-auto px-4 py-2 flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2 h-12">
              <div className="flex-1 max-w-md min-w-0">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground shrink-0" />
                  <Input
                    placeholder="Search trainers by name or specialty..."
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
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

            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative flex-1 min-w-[200px] flex items-center gap-2">
                <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
                <div className="relative flex-1">
                  <Input
                    placeholder="Enter your address or city (e.g. Wolfville, NS)"
                    value={locationSearchQuery}
                    onFocus={() => setShowSuggestions(true)}
                    onBlur={() => window.setTimeout(() => setShowSuggestions(false), 150)}
                    onChange={(event) => {
                      setLocationSearchQuery(event.target.value)
                      setLocationSearchError(null)
                      setShowSuggestions(true)
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault()
                        handleLocationSearch()
                      }
                    }}
                    className="bg-input border-border"
                  />
                  {showSuggestions && locationSuggestions.length > 0 && (
                    <div className="absolute top-[calc(100%+0.5rem)] left-0 right-0 rounded-xl border border-border bg-card shadow-xl overflow-hidden z-[1400]">
                      {locationSuggestions.map((suggestion) => (
                        <button
                          key={suggestion.id}
                          type="button"
                          onClick={() => applySelectedLocation(suggestion)}
                          className="w-full text-left px-3 py-2 hover:bg-secondary transition-colors"
                        >
                          <p className="text-sm text-foreground truncate">{suggestion.label}</p>
                          {(suggestion.city || suggestion.country) && (
                            <p className="text-xs text-muted-foreground truncate">
                              {[suggestion.city, suggestion.country].filter(Boolean).join(", ")}
                            </p>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <Button
                  onClick={handleLocationSearch}
                  disabled={locationSearchLoading || !locationSearchQuery.trim()}
                  className="shrink-0 bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {locationSearchLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Set location"}
                </Button>
              </div>
              <span className="text-xs text-muted-foreground hidden sm:inline">or use GPS</span>
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
            {locationSearchError && <p className="text-xs text-destructive">{locationSearchError}</p>}
          </div>
        </div>

        <main className="flex-1 relative">
          <div className="absolute inset-0">
            <MapView
              trainers={filteredTrainers}
              clientLocation={clientLocation}
              selectedTrainer={selectedTrainer}
              onSelectTrainer={setSelectedTrainer}
              routeLine={activeRoute?.line ?? null}
              routeMode={routeMode}
              onRequestLocation={requestLocation}
              locationStatus={locationStatus}
              onLocationSet={(lat, lng) => {
                applyLocation(lat, lng)
                setRouteInfo(null)
              }}
            />

            <div className="absolute top-4 right-4 z-[1100] flex flex-col gap-2">
              <Button
                size="icon"
                variant="secondary"
                onClick={requestLocation}
                disabled={locationStatus === "loading"}
                title={
                  locationStatus === "granted"
                    ? "Location active - click to refresh"
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

            <div className="absolute bottom-4 left-4 z-[1100] bg-card/90 backdrop-blur-sm border border-border rounded-lg px-3 py-2 shadow-md">
              {loadingTrainers ? (
                <p className="text-sm font-medium text-foreground">Loading trainers...</p>
              ) : (
                <>
                  <p className="text-sm font-medium text-foreground">
                    {filteredTrainers.length} trainer{filteredTrainers.length !== 1 ? "s" : ""} found
                  </p>
                  {locationStatus === "granted" && clientLocation ? (
                    <p className="text-xs text-muted-foreground">
                      {clientLocation.lat.toFixed(4)}, {clientLocation.lng.toFixed(4)} · sorted by distance
                    </p>
                  ) : locationStatus === "denied" ? (
                    <p className="text-xs text-muted-foreground">Location denied - set address above or click map</p>
                  ) : (
                    <p className="text-xs text-muted-foreground">Set your address above or click map</p>
                  )}
                </>
              )}
            </div>

            {fetchError && (
              <div className="absolute inset-0 flex items-center justify-center z-[1100]">
                <p className="text-sm text-destructive bg-card px-4 py-2 rounded-lg border border-destructive/30 shadow">
                  {fetchError}
                </p>
              </div>
            )}
          </div>

          <button
            onClick={() => setIsPanelOpen(!isPanelOpen)}
            className="absolute top-1/2 -translate-y-1/2 z-[1100] w-6 h-16 bg-card border border-border rounded-r-lg flex items-center justify-center transition-all shadow-md"
            style={{ left: isPanelOpen ? "384px" : "0" }}
          >
            {isPanelOpen ? (
              <ChevronLeft className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            )}
          </button>

          <div
            className={`absolute top-0 left-0 h-full w-96 bg-background border-r border-border z-[1100] transition-transform duration-300 ${
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

          {selected && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[1200] w-full max-w-md px-4 lg:left-auto lg:translate-x-0 lg:right-4">
              <Card className="bg-card border-border shadow-lg">
                <CardContent className="p-4">
                  <button
                    onClick={() => {
                      setSelectedTrainer(null)
                      setRouteInfo(null)
                    }}
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
                      <p className="text-lg font-bold text-primary mt-1">${selected.price_per_session}/session</p>
                    </div>
                  </div>

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
                          <span>
                            {formatDuration(routeInfo.driving.durationMin)} · {routeInfo.driving.distanceKm.toFixed(1)} km
                          </span>
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
                          <span>
                            {formatDuration(routeInfo.walking.durationMin)} · {routeInfo.walking.distanceKm.toFixed(1)} km
                          </span>
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
