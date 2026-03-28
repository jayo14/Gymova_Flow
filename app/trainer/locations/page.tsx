"use client"

import dynamic from "next/dynamic"
import { useEffect, useState } from "react"
import { useAuth } from "@/components/auth/AuthProvider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  createGymLocation,
  deleteTrainerLocation,
  getGymLocations,
  getTrainerLocationsWithGyms,
  upsertTrainerLocation,
} from "@/lib/supabase/locations"
import { type LatLng, type ReverseGeocodeResult } from "@/lib/map-utils"
import { getTrainerByUserId } from "@/lib/supabase/trainers"
import type { GymLocation, TrainerLocationWithGym } from "@/types/location"
import { Loader2, MapPin, Navigation, Plus, Star, Trash2 } from "lucide-react"

const TrainerLocationMiniMap = dynamic(
  () => import("@/components/map/TrainerLocationMiniMap").then((module) => module.TrainerLocationMiniMap),
  {
    ssr: false,
    loading: () => <div className="h-64 rounded-2xl border border-border bg-secondary animate-pulse" />,
  }
)

async function reverseGeocode(lat: number, lng: number): Promise<ReverseGeocodeResult | null> {
  const response = await fetch(`/api/reverse-geocode?lat=${lat}&lng=${lng}`)
  if (!response.ok) return null
  return response.json()
}

export default function TrainerLocationsPage() {
  const { session } = useAuth()

  const [trainerId, setTrainerId] = useState<number | null>(null)
  const [gymLocations, setGymLocations] = useState<GymLocation[]>([])
  const [myLocations, setMyLocations] = useState<TrainerLocationWithGym[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [savingCurrentLocation, setSavingCurrentLocation] = useState(false)
  const [locating, setLocating] = useState(false)
  const [currentLocation, setCurrentLocation] = useState<LatLng | null>(null)
  const [currentAccuracy, setCurrentAccuracy] = useState<number | null>(null)
  const [currentLocationDetails, setCurrentLocationDetails] = useState<ReverseGeocodeResult | null>(null)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const refreshTrainerLocations = async (tid: number) => {
    const { data, error } = await getTrainerLocationsWithGyms()
    if (error) {
      setMessage({ type: "error", text: "Could not load your locations." })
      return
    }
    setMyLocations(data.filter((location) => String(location.trainer_id) === String(tid)))
  }

  useEffect(() => {
    if (!session?.user?.id) return

    const userId = session.user.id

    Promise.all([getTrainerByUserId(userId), getGymLocations()]).then(async ([trainerRes, gymsRes]) => {
      if (trainerRes.error || !trainerRes.data) {
        setMessage({ type: "error", text: "Could not load trainer profile." })
        setLoading(false)
        return
      }

      const tid = trainerRes.data.id
      setTrainerId(tid)

      if (gymsRes.error) {
        setMessage({ type: "error", text: "Could not load gym locations." })
      } else {
        setGymLocations(gymsRes.data)
      }

      await refreshTrainerLocations(tid)
      setLoading(false)
    })
  }, [session?.user?.id])

  const requestPreciseLocation = () => {
    if (!navigator.geolocation) {
      setMessage({ type: "error", text: "Your browser does not support geolocation." })
      return
    }

    setLocating(true)
    setMessage(null)

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const nextLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        }

        setCurrentLocation(nextLocation)
        setCurrentAccuracy(position.coords.accuracy)
        setLocating(false)

        try {
          const details = await reverseGeocode(nextLocation.lat, nextLocation.lng)
          setCurrentLocationDetails(details)
        } catch {
          setCurrentLocationDetails(null)
        }
      },
      () => {
        setLocating(false)
        setMessage({ type: "error", text: "Unable to fetch your current location. Please allow GPS access and try again." })
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    )
  }

  useEffect(() => {
    if (!trainerId) return
    requestPreciseLocation()
  }, [trainerId])

  const isLinked = (gymId: string) => myLocations.some((location) => location.gym_location_id === gymId)

  const handleAdd = async (gym: GymLocation) => {
    if (!trainerId) return
    setSaving(gym.id)
    setMessage(null)

    const { error } = await upsertTrainerLocation(trainerId, gym.id, myLocations.length === 0)
    if (error) {
      setMessage({ type: "error", text: error })
      setSaving(null)
      return
    }

    await refreshTrainerLocations(trainerId)
    setMessage({ type: "success", text: `${gym.name} added to your locations.` })
    setSaving(null)
  }

  const handleSetPrimary = async (gymId: string) => {
    if (!trainerId) return
    setSaving(gymId)
    setMessage(null)

    const { error } = await upsertTrainerLocation(trainerId, gymId, true)
    if (error) {
      setMessage({ type: "error", text: error })
      setSaving(null)
      return
    }

    await refreshTrainerLocations(trainerId)
    setSaving(null)
  }

  const handleRemove = async (gymId: string, gymName: string) => {
    if (!trainerId) return
    setSaving(gymId)
    setMessage(null)

    const { error } = await deleteTrainerLocation(trainerId, gymId)
    if (error) {
      setMessage({ type: "error", text: error })
      setSaving(null)
      return
    }

    setMyLocations((prev) => prev.filter((location) => location.gym_location_id !== gymId))
    setMessage({ type: "success", text: `${gymName} removed from your locations.` })
    setSaving(null)
  }

  const handleSaveCurrentLocation = async () => {
    if (!trainerId || !currentLocation) return

    setSavingCurrentLocation(true)
    setMessage(null)

    const locationDraft = currentLocationDetails ?? {
      label: `${currentLocation.lat.toFixed(6)}, ${currentLocation.lng.toFixed(6)}`,
      name: "Current training location",
      address: "Saved from GPS",
      city: "",
      province: "",
      country: "",
    }

    const { data: gymLocation, error: createError } = await createGymLocation({
      name: locationDraft.name || "Current training location",
      address: locationDraft.address || locationDraft.label,
      city: locationDraft.city,
      province: locationDraft.province,
      country: locationDraft.country,
      latitude: currentLocation.lat,
      longitude: currentLocation.lng,
    })

    if (createError || !gymLocation) {
      setMessage({ type: "error", text: createError ?? "Could not save your current location." })
      setSavingCurrentLocation(false)
      return
    }

    const { error: linkError } = await upsertTrainerLocation(trainerId, gymLocation.id, myLocations.length === 0)
    if (linkError) {
      setMessage({ type: "error", text: linkError })
      setSavingCurrentLocation(false)
      return
    }

    setGymLocations((prev) => [gymLocation, ...prev])
    await refreshTrainerLocations(trainerId)
    setMessage({ type: "success", text: "Current GPS location saved. Athletes can now find you from the map." })
    setSavingCurrentLocation(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  const availableGyms = gymLocations.filter((gym) => !isLinked(gym.id))
  const savedGymLocations = myLocations.map((location) => location.gym_location)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">My locations</h1>
        <p className="text-muted-foreground">
          Save your current GPS location or attach gyms where you train. Athletes will use these saved locations on the map.
        </p>
      </div>

      {message && (
        <div
          className={`rounded-lg border p-4 ${
            message.type === "success"
              ? "border-primary/30 bg-primary/5 text-foreground"
              : "border-destructive/30 bg-destructive/5 text-destructive"
          }`}
        >
          {message.text}
        </div>
      )}

      <Card className="bg-card border-border">
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-card-foreground">Current GPS location</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              We fetch your most accurate device location, preview it on the map, then let you save it with one tap.
            </p>
          </div>
          <Button
            type="button"
            onClick={requestPreciseLocation}
            disabled={locating}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {locating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4 mr-2" />}
            Refresh GPS
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <TrainerLocationMiniMap
            currentLocation={currentLocation}
            accuracyMeters={currentAccuracy}
            savedLocations={savedGymLocations}
          />

          {currentLocation ? (
            <div className="rounded-2xl border border-border bg-background/70 p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">Ready to save this spot?</p>
                <p className="text-sm text-muted-foreground truncate">
                  {currentLocationDetails?.label ?? `${currentLocation.lat.toFixed(6)}, ${currentLocation.lng.toFixed(6)}`}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Accuracy radius: {currentAccuracy ? `${Math.round(currentAccuracy)} m` : "estimating..."}
                </p>
              </div>
              <Button
                type="button"
                onClick={handleSaveCurrentLocation}
                disabled={savingCurrentLocation}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {savingCurrentLocation ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save this location"}
              </Button>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Turn on location access to preview your live position here and save it for athlete discovery.
            </p>
          )}
        </CardContent>
      </Card>

      {myLocations.length > 0 && (
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-card-foreground">Your saved locations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {myLocations.map((location) => (
              <div
                key={location.gym_location_id}
                className="flex items-center justify-between gap-3 p-3 rounded-lg border border-border bg-background"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                      location.is_primary ? "bg-primary" : "bg-secondary"
                    }`}
                  >
                    <MapPin
                      className={`w-4 h-4 ${location.is_primary ? "text-primary-foreground" : "text-muted-foreground"}`}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">
                      {location.gym_location.name}
                      {location.is_primary && <span className="ml-2 text-xs text-primary font-normal">(primary)</span>}
                    </p>
                    <p className="text-sm text-muted-foreground truncate">
                      {location.gym_location.address}, {location.gym_location.city}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {!location.is_primary && (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={saving === location.gym_location_id}
                      onClick={() => handleSetPrimary(location.gym_location_id)}
                      className="border-border text-foreground hover:bg-secondary"
                    >
                      {saving === location.gym_location_id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Star className="w-3 h-3" />
                      )}
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={saving === location.gym_location_id}
                    onClick={() => handleRemove(location.gym_location_id, location.gym_location.name)}
                    className="border-destructive/30 text-destructive hover:bg-destructive/5"
                  >
                    {saving === location.gym_location_id ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Trash2 className="w-3 h-3" />
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-card-foreground">Add a gym location</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {availableGyms.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {gymLocations.length === 0
                ? "No gym locations are available yet."
                : "You have added all available gym locations."}
            </p>
          ) : (
            availableGyms.map((gym) => (
              <div
                key={gym.id}
                className="flex items-center justify-between gap-3 p-3 rounded-lg border border-border bg-background"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center shrink-0">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{gym.name}</p>
                    <p className="text-sm text-muted-foreground truncate">
                      {gym.address}, {gym.city}
                      {gym.province ? `, ${gym.province}` : ""}
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  disabled={saving === gym.id}
                  onClick={() => handleAdd(gym)}
                  className="shrink-0 bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {saving === gym.id ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <>
                      <Plus className="w-3 h-3 mr-1" />
                      Add
                    </>
                  )}
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  )
}
