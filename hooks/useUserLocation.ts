"use client"

import { useEffect, useState } from "react"

type UserLocation = {
  lat: number
  lng: number
}

type UseUserLocationResult = {
  location: UserLocation | null
  loading: boolean
  error: string | null
}

const GEOLOCATION_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 0,
}

function toReadableError(errorCode: number): string {
  switch (errorCode) {
    case 1:
      return "Permission denied"
    case 2:
      return "Location unavailable"
    case 3:
      return "Timeout"
    default:
      return "Unable to detect your location"
  }
}

export function useUserLocation(requestKey: number = 0): UseUserLocationResult {
  const [location, setLocation] = useState<UserLocation | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!navigator.geolocation) {
      setLoading(false)
      setError("Browser not supported")
      return
    }

    setLoading(true)
    setError(null)

    navigator.geolocation.getCurrentPosition(
      (position: GeolocationPosition) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        })
        setLoading(false)
      },
      (positionError: GeolocationPositionError) => {
        setLocation(null)
        setError(toReadableError(positionError.code))
        setLoading(false)
      },
      GEOLOCATION_OPTIONS
    )
  }, [requestKey])

  return { location, loading, error }
}
