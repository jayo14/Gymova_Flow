import { supabase } from "@/lib/supabaseClient"
import type { GymLocation, TrainerLocation, TrainerLocationWithGym, TrainerMapEntry } from "@/types/location"

/**
 * Fetch all gym locations.
 */
export async function getGymLocations(): Promise<{ data: GymLocation[]; error: string | null }> {
  const { data, error } = await supabase
    .from("gym_locations")
    .select("id, name, address, city, province, country, latitude, longitude")
    .order("name")

  if (error) return { data: [], error: error.message }
  return { data: (data ?? []) as GymLocation[], error: null }
}

/**
 * Fetch all trainer_locations rows (no join).
 */
export async function getTrainerLocations(): Promise<{
  data: TrainerLocation[]
  error: string | null
}> {
  const { data, error } = await supabase
    .from("trainer_locations")
    .select("trainer_id, gym_location_id, is_primary")

  if (error) return { data: [], error: error.message }
  return { data: (data ?? []) as TrainerLocation[], error: null }
}

/**
 * Fetch trainer_locations joined with gym_locations.
 * Returns the gym location details alongside each trainer_location row.
 */
export async function getTrainerLocationsWithGyms(): Promise<{
  data: TrainerLocationWithGym[]
  error: string | null
}> {
  const { data, error } = await supabase.from("trainer_locations").select(`
      trainer_id,
      gym_location_id,
      is_primary,
      gym_location:gym_locations(id, name, address, city, province, country, latitude, longitude)
    `)

  if (error) return { data: [], error: error.message }
  return { data: (data ?? []) as unknown as TrainerLocationWithGym[], error: null }
}

/**
 * Fetch trainer map entries: trainer + gym location + profile avatar.
 * Used to populate the /map page markers and sidebar cards.
 */
export async function getTrainerMapEntries(city?: string): Promise<{
  data: TrainerMapEntry[]
  error: string | null
}> {
  const { data, error } = await supabase.from("trainer_locations").select(`
      trainer_id,
      gym_location_id,
      gym_location:gym_locations(city, latitude, longitude),
      trainer:trainers(id, name, price, specializations, user_id)
    `)

  if (error) return { data: [], error: error.message }

  type RawRow = {
    trainer_id: number
    gym_location_id: string
    gym_location: { city: string; latitude: number; longitude: number } | null
    trainer: {
      id: number
      name: string
      price: number
      specializations: string[]
      user_id: string | null
    } | null
  }

  const rows = (data ?? []) as unknown as RawRow[]

  const userIds = rows.map((row) => row.trainer?.user_id).filter(Boolean) as string[]
  const profileMap: Record<string, string | null> = {}

  if (userIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, avatar_url")
      .in("id", userIds)

    for (const profile of profiles ?? []) {
      const row = profile as { id: string; avatar_url: string | null }
      profileMap[row.id] = row.avatar_url
    }
  }

  const entries: TrainerMapEntry[] = rows
    .filter((row) => row.trainer !== null && row.gym_location !== null)
    .map((row) => ({
      trainer_id: typeof row.trainer?.user_id === "string" ? row.trainer.user_id : String(row.trainer_id),
      trainer_internal_id: row.trainer_id,
      gym_location_id: row.gym_location_id,
      trainer_name: row.trainer?.name ?? "Trainer",
      avatar: row.trainer?.user_id ? (profileMap[row.trainer.user_id] ?? null) : null,
      specialties: Array.isArray(row.trainer?.specializations) ? row.trainer.specializations : [],
      price_per_session: row.trainer?.price ?? 0,
      city: row.gym_location?.city ?? "",
      latitude: row.gym_location?.latitude ?? 0,
      longitude: row.gym_location?.longitude ?? 0,
    }))
    
  // Deduplicate by unique trainer + location to avoid UI map key warnings
  const uniqueEntries = new Map<string, TrainerMapEntry>()
  for (const entry of entries) {
    const key = `${entry.trainer_id}-${entry.gym_location_id}`
    if (!uniqueEntries.has(key)) {
      uniqueEntries.set(key, entry)
    }
  }
  
  const entriesList = Array.from(uniqueEntries.values())

  const normalizedCity = city?.trim().toLowerCase()
  const filteredEntries = normalizedCity
    ? entriesList.filter((entry) => entry.city.toLowerCase() === normalizedCity)
    : entriesList

  return { data: filteredEntries, error: null }
}

export async function createGymLocation(input: {
  name: string
  address: string
  city: string
  province: string
  country: string
  latitude: number
  longitude: number
}): Promise<{ data: GymLocation | null; error: string | null }> {
  const { data, error } = await supabase
    .from("gym_locations")
    .insert({
      name: input.name,
      address: input.address,
      city: input.city,
      province: input.province,
      country: input.country,
      latitude: input.latitude,
      longitude: input.longitude,
    })
    .select("id, name, address, city, province, country, latitude, longitude")
    .single()

  if (error) return { data: null, error: error.message }
  return { data: data as GymLocation, error: null }
}

/**
 * Upsert a trainer's association with a gym location.
 * Conflicts on (trainer_id, gym_location_id) are updated in place.
 */
export async function upsertTrainerLocation(
  trainerId: number,
  gymLocationId: string,
  isPrimary: boolean = false
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from("trainer_locations")
    .upsert(
      { trainer_id: trainerId, gym_location_id: gymLocationId, is_primary: isPrimary },
      { onConflict: "trainer_id,gym_location_id" }
    )

  if (error) return { error: error.message }
  return { error: null }
}

/**
 * Remove a trainer's association with a gym location.
 */
export async function deleteTrainerLocation(
  trainerId: number,
  gymLocationId: string
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from("trainer_locations")
    .delete()
    .eq("trainer_id", trainerId)
    .eq("gym_location_id", gymLocationId)

  if (error) return { error: error.message }
  return { error: null }
}
