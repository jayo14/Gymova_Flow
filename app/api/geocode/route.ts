import { NextResponse } from "next/server"
import type { LocationSuggestion } from "@/lib/map-utils"

type NominatimResult = {
  place_id: number
  display_name: string
  lat: string
  lon: string
  address?: {
    city?: string
    town?: string
    village?: string
    county?: string
    state?: string
    country?: string
  }
}

const COORDINATE_QUERY = /^-?\d+(\.\d+)?\s*,\s*-?\d+(\.\d+)?$/

function getContactHeader(host: string | null) {
  return `Gymova Flow map search (${host ?? "unknown-host"})`
}

function normalizeCity(result: NominatimResult) {
  return (
    result.address?.city ??
    result.address?.town ??
    result.address?.village ??
    result.address?.county ??
    result.address?.state ??
    null
  )
}

function toSuggestion(result: NominatimResult): LocationSuggestion {
  return {
    id: result.place_id.toString(),
    label: result.display_name,
    lat: Number(result.lat),
    lng: Number(result.lon),
    city: normalizeCity(result),
    country: result.address?.country ?? null,
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get("q")?.trim() ?? ""

  if (query.length < 2) {
    return NextResponse.json({ suggestions: [] satisfies LocationSuggestion[] })
  }

  if (COORDINATE_QUERY.test(query)) {
    const [lat, lng] = query.split(",").map((value) => Number(value.trim()))
    return NextResponse.json({
      suggestions: [
        {
          id: `coords-${lat}-${lng}`,
          label: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
          lat,
          lng,
          city: null,
          country: null,
        },
      ] satisfies LocationSuggestion[],
    })
  }

  const params = new URLSearchParams({
    q: query,
    format: "jsonv2",
    addressdetails: "1",
    limit: "5",
  })

  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
      headers: {
        Accept: "application/json",
        "Accept-Language": "en",
        "User-Agent": getContactHeader(request.headers.get("host")),
      },
      cache: "no-store",
    })

    if (!response.ok) {
      return NextResponse.json({ suggestions: [] satisfies LocationSuggestion[] }, { status: 502 })
    }

    const results = (await response.json()) as NominatimResult[]

    return NextResponse.json({
      suggestions: results.map(toSuggestion),
    })
  } catch {
    return NextResponse.json(
      { suggestions: [] satisfies LocationSuggestion[], error: "Unable to search locations right now." },
      { status: 502 }
    )
  }
}
