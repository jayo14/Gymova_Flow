import { NextResponse } from "next/server"
import {
  estimateDrivingMinutes,
  estimateWalkingMinutes,
  findShortestPathByDijkstra,
  getDistanceKm,
  type RouteLine,
} from "@/lib/map-utils"

type OsrmRouteResponse = {
  code?: string
  routes?: Array<{
    distance: number
    duration: number
    geometry: {
      coordinates: [number, number][]
    }
  }>
}

async function fetchRouteFromOsrm(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number,
  profile: "driving" | "walking"
) {
  const url = `https://router.project-osrm.org/route/v1/${profile}/${fromLng},${fromLat};${toLng},${toLat}?overview=full&steps=false&geometries=geojson`
  const response = await fetch(url, { cache: "no-store" })
  if (!response.ok) return null

  const payload = (await response.json()) as OsrmRouteResponse
  if (payload.code !== "Ok" || !payload.routes?.length) return null

  return payload.routes[0]
}

function toRouteLine(coordinates: [number, number][]): RouteLine {
  return coordinates.map(([lng, lat]) => [lat, lng])
}

function buildApproximateFallback(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number,
  profile: "driving" | "walking"
) {
  const distanceKm = getDistanceKm(fromLat, fromLng, toLat, toLng)
  return {
    distanceKm,
    durationMin: profile === "walking" ? estimateWalkingMinutes(distanceKm) : estimateDrivingMinutes(distanceKm),
    line: [
      [fromLat, fromLng],
      [toLat, toLng],
    ] satisfies RouteLine,
    requestedProfile: profile,
    resolvedProfile: "fallback",
    fallbackUsed: true,
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const fromLat = Number(searchParams.get("fromLat"))
  const fromLng = Number(searchParams.get("fromLng"))
  const toLat = Number(searchParams.get("toLat"))
  const toLng = Number(searchParams.get("toLng"))
  const requestedProfile = searchParams.get("profile") === "walking" ? "walking" : "driving"

  if ([fromLat, fromLng, toLat, toLng].some((value) => Number.isNaN(value))) {
    return NextResponse.json({ error: "Invalid route coordinates." }, { status: 400 })
  }

  const crowDistanceKm = getDistanceKm(fromLat, fromLng, toLat, toLng)
  if (crowDistanceKm > 250) {
    return NextResponse.json(buildApproximateFallback(fromLat, fromLng, toLat, toLng, requestedProfile))
  }

  try {
    let resolvedProfile: "driving" | "walking" = requestedProfile
    let route = await fetchRouteFromOsrm(fromLat, fromLng, toLat, toLng, requestedProfile)

    if (!route && requestedProfile === "walking") {
      resolvedProfile = "driving"
      route = await fetchRouteFromOsrm(fromLat, fromLng, toLat, toLng, "driving")
    }

    if (!route) {
      return NextResponse.json(buildApproximateFallback(fromLat, fromLng, toLat, toLng, requestedProfile))
    }

    const rawLine = toRouteLine(route.geometry.coordinates)
    const shortestPath = findShortestPathByDijkstra(rawLine)
    const distanceKm = shortestPath.distanceKm || route.distance / 1000
    const durationMin =
      requestedProfile === "walking"
        ? estimateWalkingMinutes(distanceKm)
        : Math.max(1, Math.round(route.duration / 60))

    return NextResponse.json({
      distanceKm,
      durationMin,
      line: shortestPath.path,
      requestedProfile,
      resolvedProfile,
      fallbackUsed: requestedProfile !== resolvedProfile,
    })
  } catch {
    return NextResponse.json(buildApproximateFallback(fromLat, fromLng, toLat, toLng, requestedProfile))
  }
}
