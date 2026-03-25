"use client"

import { useEffect, useMemo, useState } from "react"
import { GoogleMap as GoogleMapCanvas, MarkerF, PolylineF, useJsApiLoader, type Libraries } from "@react-google-maps/api"
import { useRouter } from "next/navigation"
import { getSpecialtyEmoji } from "@/lib/map-utils"
import { useUserLocation } from "@/hooks/useUserLocation"
import type { TrainerMapEntry } from "@/types/location"

export type TrainerWithDistance = TrainerMapEntry & {
  distanceMi: number | null
  distanceLabel: string
}

export type RouteLine = [number, number][]

const FALLBACK_CENTER = { lat: 44.6488, lng: -63.5752 } // Halifax, NS
const MAP_LIBRARIES: Libraries = ["places"]

function toLatLng(line: RouteLine) {
  return line.map(([lat, lng]) => ({ lat, lng }))
}

function getTrainerPinIcon(selected: boolean) {
  return {
    path: window.google.maps.SymbolPath.CIRCLE,
    scale: selected ? 9 : 7,
    fillColor: selected ? "#84cc16" : "#65a30d",
    fillOpacity: 1,
    strokeColor: "#ffffff",
    strokeWeight: 2,
  }
}

function getUserPinIcon() {
  return {
    path: window.google.maps.SymbolPath.CIRCLE,
    scale: 8,
    fillColor: "#3b82f6",
    fillOpacity: 1,
    strokeColor: "#ffffff",
    strokeWeight: 3,
  }
}

export default function GoogleMap({
  trainers,
  clientLocation,
  selectedTrainer,
  onSelectTrainer,
  routeLine,
  routeMode,
  onLocationSet,
}: {
  trainers: TrainerWithDistance[]
  clientLocation: { lat: number; lng: number } | null
  selectedTrainer: number | null
  onSelectTrainer: (id: number) => void
  routeLine: RouteLine | null
  routeMode: "driving" | "walking"
  onLocationSet: (lat: number, lng: number) => void
}) {
  const router = useRouter()
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  const [locationRequestKey, setLocationRequestKey] = useState(0)
  const { location, loading, error } = useUserLocation(locationRequestKey)
  const [mapCenter, setMapCenter] = useState(FALLBACK_CENTER)

  const { isLoaded, loadError } = useJsApiLoader({
    id: "gymovaflow-google-map",
    googleMapsApiKey: apiKey ?? "",
    libraries: MAP_LIBRARIES,
  })

  useEffect(() => {
    if (clientLocation) {
      setMapCenter(clientLocation)
      return
    }

    if (location) {
      setMapCenter(location)
      onLocationSet(location.lat, location.lng)
      return
    }

    if (error) {
      setMapCenter(FALLBACK_CENTER)
    }
  }, [clientLocation, location, error, onLocationSet])

  const routePath = useMemo(() => (routeLine ? toLatLng(routeLine) : null), [routeLine])

  const routeOptions = useMemo(
    () => ({
      strokeColor: routeMode === "driving" ? "#3b82f6" : "#22c55e",
      strokeOpacity: 0.95,
      strokeWeight: 5,
      icons:
        routeMode === "walking"
          ? [
              {
                icon: { path: "M 0,-1 0,1", strokeOpacity: 1, scale: 4 },
                offset: "0",
                repeat: "18px",
              },
            ]
          : undefined,
    }),
    [routeMode]
  )

  if (!apiKey) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-secondary px-4 text-center">
        <p className="text-sm text-destructive">
          Missing `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` in environment variables.
        </p>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-secondary px-4 text-center">
        <p className="text-sm text-destructive">
          Failed to load Google Maps. Check API key and Maps JavaScript API access.
        </p>
      </div>
    )
  }

  if (!isLoaded) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-secondary">
        <div className="w-8 h-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
      </div>
    )
  }

  return (
    <div className="w-full h-full relative">
      <GoogleMapCanvas
        mapContainerStyle={{ width: "100%", height: "100%" }}
        center={location ?? mapCenter}
        zoom={12}
        onClick={(e) => {
          const lat = e.latLng?.lat()
          const lng = e.latLng?.lng()
          if (typeof lat === "number" && typeof lng === "number") {
            setMapCenter({ lat, lng })
            onLocationSet(lat, lng)
          }
        }}
        onLoad={(map) => {
          if (routePath && routePath.length > 1) {
            const bounds = new window.google.maps.LatLngBounds()
            routePath.forEach((point) => bounds.extend(point))
            map.fitBounds(bounds, 60)
          }
        }}
        options={{
          clickableIcons: false,
          fullscreenControl: false,
          mapTypeControl: false,
          streetViewControl: false,
          zoomControl: false,
        }}
      >
        {clientLocation && <MarkerF position={clientLocation} icon={getUserPinIcon()} zIndex={20} />}

        {routePath && routePath.length > 1 && <PolylineF path={routePath} options={routeOptions} />}

        {trainers.map((trainer) => {
          const selected = selectedTrainer === trainer.trainer_id
          return (
            <MarkerF
              key={`${trainer.trainer_id}-${trainer.gym_location_id}`}
              position={{ lat: trainer.latitude, lng: trainer.longitude }}
              icon={getTrainerPinIcon(selected)}
              label={{
                text: `${getSpecialtyEmoji(trainer.specialties)} $${trainer.price_per_session}`,
                color: selected ? "#1a2e05" : "#365314",
                fontWeight: "700",
                fontSize: "12px",
              }}
              onClick={() => {
                onSelectTrainer(trainer.trainer_id)
                router.push(`/trainers/${trainer.trainer_id}`)
              }}
            />
          )
        })}
      </GoogleMapCanvas>

      <div className="absolute top-3 left-3 z-10 flex items-center gap-2">
        <button
          type="button"
          onClick={() => setLocationRequestKey((prev) => prev + 1)}
          className="px-3 py-1.5 text-xs font-medium bg-card/90 backdrop-blur-sm border border-border rounded-md shadow-md hover:bg-card"
        >
          Find My Location
        </button>
      </div>

      {loading && (
        <div className="absolute bottom-3 left-3 right-3 sm:right-auto sm:max-w-sm bg-card/90 backdrop-blur-sm border border-border rounded-lg px-3 py-2 shadow-md">
          <p className="text-xs text-muted-foreground">Getting your location...</p>
        </div>
      )}

      {error && (
        <div className="absolute bottom-3 left-3 right-3 sm:right-auto sm:max-w-sm bg-card/90 backdrop-blur-sm border border-border rounded-lg px-3 py-2 shadow-md">
          <p className="text-xs text-muted-foreground">
            Unable to detect your location
          </p>
        </div>
      )}
    </div>
  )
}
