"use client"

import { useEffect } from "react"
import L from "leaflet"
import { Circle, MapContainer, Marker, TileLayer, useMap } from "react-leaflet"
import type { GymLocation } from "@/types/location"
import type { LatLng } from "@/lib/map-utils"

const TILE_URL = process.env.NEXT_PUBLIC_MAP_TILE_URL ?? "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"

const currentLocationIcon = L.divIcon({
  className: "",
  html: '<div class="gymova-leaflet-user-marker is-gps"></div>',
  iconSize: [22, 22],
  iconAnchor: [11, 11],
})

const savedLocationIcon = L.divIcon({
  className: "",
  html: '<div class="gymova-leaflet-marker is-saved"><span class="gymova-leaflet-marker__glyph">📍</span></div>',
  iconSize: [30, 30],
  iconAnchor: [15, 15],
})

function ViewportSync({
  currentLocation,
  savedLocations,
}: {
  currentLocation: LatLng | null
  savedLocations: GymLocation[]
}) {
  const map = useMap()

  useEffect(() => {
    if (currentLocation) {
      map.setView([currentLocation.lat, currentLocation.lng], 15, { animate: true })
      return
    }

    if (savedLocations.length > 0) {
      const bounds = L.latLngBounds(savedLocations.map((location) => [location.latitude, location.longitude] as [number, number]))
      map.fitBounds(bounds, { padding: [32, 32], maxZoom: 14 })
    }
  }, [currentLocation, map, savedLocations])

  return null
}

export function TrainerLocationMiniMap({
  currentLocation,
  accuracyMeters,
  savedLocations,
}: {
  currentLocation: LatLng | null
  accuracyMeters: number | null
  savedLocations: GymLocation[]
}) {
  return (
    <div className="h-64 rounded-2xl overflow-hidden border border-border">
      <MapContainer
        center={[
          currentLocation?.lat ?? savedLocations[0]?.latitude ?? 44.6488,
          currentLocation?.lng ?? savedLocations[0]?.longitude ?? -63.5752,
        ]}
        zoom={currentLocation ? 15 : 11}
        scrollWheelZoom
        className="w-full h-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url={TILE_URL}
        />
        <ViewportSync currentLocation={currentLocation} savedLocations={savedLocations} />

        {savedLocations.map((location) => (
          <Marker
            key={location.id}
            position={[location.latitude, location.longitude]}
            icon={savedLocationIcon}
          />
        ))}

        {currentLocation && (
          <>
            <Marker position={[currentLocation.lat, currentLocation.lng]} icon={currentLocationIcon} />
            {accuracyMeters ? (
              <Circle
                center={[currentLocation.lat, currentLocation.lng]}
                radius={accuracyMeters}
                pathOptions={{ color: "#2563eb", fillColor: "#2563eb", fillOpacity: 0.08, weight: 1 }}
              />
            ) : null}
          </>
        )}
      </MapContainer>
    </div>
  )
}
