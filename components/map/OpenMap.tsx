"use client"

import Link from "next/link"
import { useEffect, useMemo } from "react"
import L from "leaflet"
import { MapContainer, Marker, Popup, Polyline, TileLayer, useMap, useMapEvents } from "react-leaflet"
import { Loader2, Navigation } from "lucide-react"
import { getLineBounds, getSpecialtyEmoji, type LatLng, type RouteLine } from "@/lib/map-utils"
import type { TrainerMapEntry } from "@/types/location"

export type TrainerWithDistance = TrainerMapEntry & {
  distanceMi: number | null
  distanceLabel: string
}

const FALLBACK_CENTER: LatLng = { lat: 44.6488, lng: -63.5752 }
const TILE_URL = process.env.NEXT_PUBLIC_MAP_TILE_URL ?? "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"

function createTrainerIcon(trainer: Pick<TrainerWithDistance, "avatar" | "specialties">, selected: boolean) {
  const avatarMarkup = trainer.avatar
    ? `<img src="${trainer.avatar}" alt="Trainer avatar" class="gymova-leaflet-marker__avatar" />`
    : `<span class="gymova-leaflet-marker__glyph">${getSpecialtyEmoji(trainer.specialties)}</span>`

  return L.divIcon({
    className: "",
    html: `<div class="gymova-leaflet-marker${selected ? " is-selected" : ""}">${avatarMarkup}</div>`,
    iconSize: [42, 42],
    iconAnchor: [21, 21],
  })
}

const userIcon = L.divIcon({
  className: "",
  html: '<div class="gymova-leaflet-user-marker"></div>',
  iconSize: [22, 22],
  iconAnchor: [11, 11],
})

function MapViewportSync({
  clientLocation,
  routeLine,
  trainers,
}: {
  clientLocation: LatLng | null
  routeLine: RouteLine | null
  trainers: TrainerWithDistance[]
}) {
  const map = useMap()

  useEffect(() => {
    if (routeLine && routeLine.length > 1) {
      const bounds = getLineBounds(routeLine)
      if (bounds) {
        map.fitBounds(bounds, { padding: [56, 56] })
        return
      }
    }

    if (clientLocation) {
      map.setView([clientLocation.lat, clientLocation.lng], Math.max(map.getZoom(), 13), { animate: true })
      return
    }

    if (trainers.length > 0) {
      const bounds = L.latLngBounds(trainers.map((trainer) => [trainer.latitude, trainer.longitude] as [number, number]))
      map.fitBounds(bounds, { padding: [56, 56], maxZoom: 12 })
    }
  }, [clientLocation, map, routeLine, trainers])

  return null
}

function MapClickCapture({ onLocationSet }: { onLocationSet: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(event) {
      onLocationSet(event.latlng.lat, event.latlng.lng)
    },
  })

  return null
}

export default function OpenMap({
  trainers,
  clientLocation,
  selectedTrainer,
  onSelectTrainer,
  routeLine,
  routeMode,
  onLocationSet,
  onRequestLocation,
  locationStatus,
}: {
  trainers: TrainerWithDistance[]
  clientLocation: LatLng | null
  selectedTrainer: string | null
  onSelectTrainer: (id: string) => void
  routeLine: RouteLine | null
  routeMode: "driving" | "walking"
  onLocationSet: (lat: number, lng: number) => void
  onRequestLocation: () => void
  locationStatus: "idle" | "loading" | "granted" | "denied"
}) {
  const routePositions = useMemo(() => routeLine?.map(([lat, lng]) => [lat, lng] as [number, number]) ?? [], [routeLine])

  return (
    <div className="w-full h-full relative z-0">
      <MapContainer
        center={[clientLocation?.lat ?? FALLBACK_CENTER.lat, clientLocation?.lng ?? FALLBACK_CENTER.lng]}
        zoom={clientLocation ? 12 : 9}
        scrollWheelZoom
        className="w-full h-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url={TILE_URL}
        />

        <MapClickCapture onLocationSet={onLocationSet} />
        <MapViewportSync clientLocation={clientLocation} routeLine={routeLine} trainers={trainers} />

        {clientLocation && <Marker position={[clientLocation.lat, clientLocation.lng]} icon={userIcon} />}

        {routePositions.length > 1 && (
          <Polyline
            positions={routePositions}
            pathOptions={{
              color: routeMode === "driving" ? "#3b82f6" : "#22c55e",
              weight: 5,
              opacity: 0.95,
              dashArray: routeMode === "walking" ? "8 10" : undefined,
            }}
          />
        )}

        {trainers.map((trainer) => {
          const selected = trainer.trainer_id === selectedTrainer
          return (
            <Marker
              key={`${trainer.trainer_id}-${trainer.gym_location_id}`}
              position={[trainer.latitude, trainer.longitude]}
              icon={createTrainerIcon(trainer, selected)}
              eventHandlers={{
                click: () => onSelectTrainer(trainer.trainer_id),
              }}
            >
              <Popup minWidth={260}>
                <div className="space-y-3 min-w-[230px]">
                  <div className="flex items-start gap-3">
                    {trainer.avatar ? (
                      <img
                        src={trainer.avatar}
                        alt={trainer.trainer_name}
                        className="w-12 h-12 rounded-full object-cover shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-xl shrink-0">
                        {getSpecialtyEmoji(trainer.specialties)}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="font-semibold text-card-foreground truncate">{trainer.trainer_name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {trainer.specialties.slice(0, 2).join(" · ") || "Personal training"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">{trainer.distanceLabel} away</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Session fee</span>
                    <span className="font-semibold text-primary">${trainer.price_per_session}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link href={`/booking/${trainer.trainer_id}`} className="flex-1">
                      <span className="inline-flex w-full items-center justify-center rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground">
                        Book now
                      </span>
                    </Link>
                    <Link href={`/trainers/${trainer.trainer_id}`} className="flex-1">
                      <span className="inline-flex w-full items-center justify-center rounded-md border border-border px-3 py-2 text-sm font-medium text-foreground">
                        View profile
                      </span>
                    </Link>
                  </div>
                </div>
              </Popup>
            </Marker>
          )
        })}
      </MapContainer>

      <div className="absolute top-3 left-3 z-[900] flex items-center gap-2">
        <button
          type="button"
          onClick={onRequestLocation}
          className="px-3 py-1.5 text-xs font-medium bg-card/90 backdrop-blur-sm border border-border rounded-md shadow-md hover:bg-card inline-flex items-center gap-2"
        >
          {locationStatus === "loading" ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <Navigation className="w-3 h-3" />
          )}
          Find My Location
        </button>
      </div>

      {locationStatus === "denied" && (
        <div className="absolute bottom-3 left-3 right-3 sm:right-auto sm:max-w-sm z-[900] bg-card/90 backdrop-blur-sm border border-border rounded-lg px-3 py-2 shadow-md">
          <p className="text-xs text-muted-foreground">Location access was denied. Search an address or click the map.</p>
        </div>
      )}
    </div>
  )
}
