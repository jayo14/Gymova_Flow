import { bbox, distance, lineString, point } from "@turf/turf"

export type LatLng = {
  lat: number
  lng: number
}

export type RouteLine = [number, number][]

export type LocationSuggestion = {
  id: string
  label: string
  lat: number
  lng: number
  city: string | null
  country: string | null
}

export type ReverseGeocodeResult = {
  label: string
  name: string
  address: string
  city: string
  province: string
  country: string
}

type RouteGraph = {
  nodes: string[]
  edges: Map<string, Array<{ to: string; weight: number }>>
}

export function getSpecialtyEmoji(specialties: string[]): string {
  const joined = specialties.join(" ").toLowerCase()
  if (joined.includes("boxing") || joined.includes("mma") || joined.includes("kickbox")) return "🥊"
  if (joined.includes("yoga") || joined.includes("mobility") || joined.includes("flexibility")) return "🧘"
  if (joined.includes("crossfit") || joined.includes("olympic")) return "🏋️"
  if (joined.includes("bodybuilding") || joined.includes("strength") || joined.includes("powerlifting")) return "💪"
  if (joined.includes("hiit") || joined.includes("cardio") || joined.includes("weight loss")) return "🔥"
  if (joined.includes("swimming") || joined.includes("cycling") || joined.includes("spin")) return "🚴"
  if (joined.includes("pilates") || joined.includes("stretch")) return "🤸"
  if (joined.includes("nutrition") || joined.includes("diet")) return "🥗"
  return "🏃"
}

export function getDistanceMiles(lat1: number, lng1: number, lat2: number, lng2: number): number {
  return distance(point([lng1, lat1]), point([lng2, lat2]), { units: "miles" })
}

export function getDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  return distance(point([lng1, lat1]), point([lng2, lat2]), { units: "kilometers" })
}

export function estimateWalkingMinutes(distanceKm: number): number {
  return Math.max(1, Math.round((distanceKm / 5) * 60))
}

export function estimateDrivingMinutes(distanceKm: number): number {
  const avgSpeedKmh = distanceKm <= 8 ? 28 : distanceKm <= 30 ? 38 : distanceKm <= 120 ? 55 : 72
  return Math.max(1, Math.round((distanceKm / avgSpeedKmh) * 60))
}

export function formatDistanceKm(distanceKm: number): string {
  return distanceKm < 1 ? `${Math.round(distanceKm * 1000)} m` : `${distanceKm.toFixed(1)} km`
}

export function getLineBounds(line: RouteLine): [[number, number], [number, number]] | null {
  if (line.length < 2) return null
  const route = lineString(line.map(([lat, lng]) => [lng, lat]))
  const [minLng, minLat, maxLng, maxLat] = bbox(route)
  return [
    [minLng, minLat],
    [maxLng, maxLat],
  ]
}

function createRouteGraph(line: RouteLine): RouteGraph {
  const nodes = line.map((_, index) => index.toString())
  const edges = new Map<string, Array<{ to: string; weight: number }>>()

  for (let index = 0; index < line.length - 1; index += 1) {
    const currentId = index.toString()
    const nextId = (index + 1).toString()
    const [currentLat, currentLng] = line[index]
    const [nextLat, nextLng] = line[index + 1]
    const weight = distance(point([currentLng, currentLat]), point([nextLng, nextLat]), {
      units: "kilometers",
    })

    edges.set(currentId, [...(edges.get(currentId) ?? []), { to: nextId, weight }])
    edges.set(nextId, [...(edges.get(nextId) ?? []), { to: currentId, weight }])
  }

  return { nodes, edges }
}

export function findShortestPathByDijkstra(line: RouteLine): {
  path: RouteLine
  distanceKm: number
} {
  if (line.length < 2) {
    return {
      path: line,
      distanceKm: 0,
    }
  }

  const graph = createRouteGraph(line)
  const start = "0"
  const end = (line.length - 1).toString()
  const distances = new Map<string, number>(graph.nodes.map((node) => [node, Number.POSITIVE_INFINITY]))
  const previous = new Map<string, string | null>(graph.nodes.map((node) => [node, null]))
  const unvisited = new Set(graph.nodes)

  distances.set(start, 0)

  while (unvisited.size > 0) {
    let currentNode: string | null = null
    let shortestDistance = Number.POSITIVE_INFINITY

    for (const node of unvisited) {
      const candidateDistance = distances.get(node) ?? Number.POSITIVE_INFINITY
      if (candidateDistance < shortestDistance) {
        shortestDistance = candidateDistance
        currentNode = node
      }
    }

    if (!currentNode || currentNode === end) break

    unvisited.delete(currentNode)

    for (const edge of graph.edges.get(currentNode) ?? []) {
      if (!unvisited.has(edge.to)) continue
      const nextDistance = (distances.get(currentNode) ?? Number.POSITIVE_INFINITY) + edge.weight
      if (nextDistance < (distances.get(edge.to) ?? Number.POSITIVE_INFINITY)) {
        distances.set(edge.to, nextDistance)
        previous.set(edge.to, currentNode)
      }
    }
  }

  const orderedPath: RouteLine = []
  let cursor: string | null = end

  while (cursor) {
    orderedPath.unshift(line[Number(cursor)])
    cursor = previous.get(cursor) ?? null
  }

  return {
    path: orderedPath.length > 0 ? orderedPath : line,
    distanceKm: distances.get(end) ?? 0,
  }
}
