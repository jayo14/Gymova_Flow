import { NextResponse } from "next/server"
import type { ReverseGeocodeResult } from "@/lib/map-utils"

type NominatimReverseResult = {
  display_name?: string
  name?: string
  address?: {
    house_number?: string
    road?: string
    suburb?: string
    neighbourhood?: string
    city?: string
    town?: string
    village?: string
    county?: string
    state?: string
    country?: string
  }
}

function getContactHeader(host: string | null) {
  return `Gymova Flow reverse geocode (${host ?? "unknown-host"})`
}

function normalizeAddress(data: NominatimReverseResult): ReverseGeocodeResult {
  const city =
    data.address?.city ??
    data.address?.town ??
    data.address?.village ??
    data.address?.county ??
    ""

  const street = [data.address?.house_number, data.address?.road].filter(Boolean).join(" ")
  const candidateName = data.name ?? data.address?.suburb ?? data.address?.neighbourhood ?? city
  const name = candidateName && candidateName.trim().length > 0 ? candidateName : "Training location"

  return {
    label: data.display_name ?? name,
    name,
    address: street || data.display_name || "Current location",
    city,
    province: data.address?.state ?? "",
    country: data.address?.country ?? "",
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const lat = Number(searchParams.get("lat"))
  const lng = Number(searchParams.get("lng"))

  if ([lat, lng].some((value) => Number.isNaN(value))) {
    return NextResponse.json({ error: "Invalid reverse geocode coordinates." }, { status: 400 })
  }

  const params = new URLSearchParams({
    lat: lat.toString(),
    lon: lng.toString(),
    format: "jsonv2",
    addressdetails: "1",
  })

  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?${params.toString()}`, {
      headers: {
        Accept: "application/json",
        "Accept-Language": "en",
        "User-Agent": getContactHeader(request.headers.get("host")),
      },
      cache: "no-store",
    })

    if (!response.ok) {
      return NextResponse.json({ error: "Unable to resolve address." }, { status: 502 })
    }

    const payload = (await response.json()) as NominatimReverseResult
    return NextResponse.json(normalizeAddress(payload))
  } catch {
    return NextResponse.json({ error: "Unable to resolve address." }, { status: 502 })
  }
}
