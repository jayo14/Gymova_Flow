import { getTrainerByUserId } from "@/lib/supabase/trainers"
import { supabase } from "@/lib/supabaseClient"

const DAYS = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
] as const

const DAY_TO_INDEX: Record<(typeof DAYS)[number], number> = {
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
  sunday: 0,
}

const INDEX_TO_DAY: Record<number, (typeof DAYS)[number]> = {
  0: "sunday",
  1: "monday",
  2: "tuesday",
  3: "wednesday",
  4: "thursday",
  5: "friday",
  6: "saturday",
}

export const DEFAULT_AVAILABILITY: Record<string, string[]> = Object.fromEntries(
  DAYS.map((d) => [d, []])
)

export function ensureAvailability(obj: unknown): Record<string, string[]> {
  if (obj && typeof obj === "object" && !Array.isArray(obj)) {
    const out: Record<string, string[]> = { ...DEFAULT_AVAILABILITY }
    for (const day of DAYS) {
      const val = (obj as Record<string, unknown>)[day]
      out[day] = Array.isArray(val)
        ? val.filter((t): t is string => typeof t === "string").sort(compareTimeLabels)
        : []
    }
    return out
  }
  return { ...DEFAULT_AVAILABILITY }
}

type AvailabilityRow = {
  day_of_week: number
  start_time: string
  end_time: string
  is_active: boolean
}

function toTimeLabel(value: string): string {
  const [hourPart, minutePart] = value.split(":")
  const hour = Number(hourPart)
  const minute = Number(minutePart ?? "0")

  if (Number.isNaN(hour) || Number.isNaN(minute)) return value

  const suffix = hour >= 12 ? "PM" : "AM"
  const normalizedHour = hour % 12 === 0 ? 12 : hour % 12
  return `${normalizedHour}:${String(minute).padStart(2, "0")} ${suffix}`
}

function timeLabelTo24HourRange(value: string): { start: string; end: string } {
  const [time, suffix] = value.split(" ")
  const [hourPart, minutePart] = time.split(":")
  let hour = Number(hourPart)
  const minute = Number(minutePart)

  if (suffix === "PM" && hour !== 12) hour += 12
  if (suffix === "AM" && hour === 12) hour = 0

  const start = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00`
  const endDate = new Date(Date.UTC(2000, 0, 1, hour, minute))
  endDate.setUTCHours(endDate.getUTCHours() + 1)
  const end = `${String(endDate.getUTCHours()).padStart(2, "0")}:${String(endDate.getUTCMinutes()).padStart(2, "0")}:00`

  return { start, end }
}

function compareTimeLabels(a: string, b: string): number {
  return normalizeTimeLabel(a).localeCompare(normalizeTimeLabel(b))
}

function normalizeTimeLabel(value: string): string {
  const { start } = timeLabelTo24HourRange(value)
  return start
}

function rowsToAvailability(rows: AvailabilityRow[]): Record<string, string[]> {
  const availability = { ...DEFAULT_AVAILABILITY }

  for (const row of rows) {
    if (!row.is_active) continue
    const day = INDEX_TO_DAY[row.day_of_week]
    if (!day) continue
    availability[day] = [...availability[day], toTimeLabel(row.start_time)].sort(compareTimeLabels)
  }

  return availability
}

async function getTrainerNumericId(userId: string): Promise<{ trainerId: number | null; error: string | null }> {
  const { data, error } = await getTrainerByUserId(userId)
  if (error) return { trainerId: null, error }
  return { trainerId: data?.id ?? null, error: null }
}

export async function getTrainerAvailability(
  userId: string
): Promise<{ data: Record<string, string[]>; error: string | null }> {
  const { trainerId, error: trainerError } = await getTrainerNumericId(userId)
  if (trainerError) return { data: { ...DEFAULT_AVAILABILITY }, error: trainerError }
  if (!trainerId) return { data: { ...DEFAULT_AVAILABILITY }, error: null }

  const { data, error } = await supabase
    .from("trainer_availability")
    .select("day_of_week, start_time, end_time, is_active")
    .eq("trainer_id", trainerId)
    .eq("is_active", true)
    .order("day_of_week", { ascending: true })
    .order("start_time", { ascending: true })

  if (error) return { data: { ...DEFAULT_AVAILABILITY }, error: error.message }

  if ((data ?? []).length > 0) {
    return {
      data: rowsToAvailability((data ?? []) as AvailabilityRow[]),
      error: null,
    }
  }

  const { data: trainerRow, error: trainerRowError } = await supabase
    .from("trainers")
    .select("availability")
    .eq("user_id", userId)
    .maybeSingle()

  if (trainerRowError) {
    return { data: { ...DEFAULT_AVAILABILITY }, error: trainerRowError.message }
  }

  return {
    data: ensureAvailability((trainerRow as { availability?: unknown } | null)?.availability),
    error: null,
  }
}

export async function upsertTrainerAvailability(
  userId: string,
  availability: Record<string, string[]>
): Promise<{ error: string | null }> {
  const { trainerId, error: trainerError } = await getTrainerNumericId(userId)
  if (trainerError) return { error: trainerError }
  if (!trainerId) return { error: "Trainer profile not found." }

  const normalizedAvailability = ensureAvailability(availability)

  const { error: deleteError } = await supabase
    .from("trainer_availability")
    .delete()
    .eq("trainer_id", trainerId)

  if (deleteError) return { error: deleteError.message }

  const rows = DAYS.flatMap((day) =>
    normalizedAvailability[day].map((time) => {
      const { start, end } = timeLabelTo24HourRange(time)
      return {
        trainer_id: trainerId,
        day_of_week: DAY_TO_INDEX[day],
        start_time: start,
        end_time: end,
        is_active: true,
      }
    })
  )

  if (rows.length > 0) {
    const { error: insertError } = await supabase.from("trainer_availability").insert(rows)
    if (insertError) return { error: insertError.message }
  }

  const { error: mirrorError } = await supabase
    .from("trainer_records")
    .update({ availability: normalizedAvailability })
    .eq("user_id", userId)

  if (mirrorError) return { error: mirrorError.message }

  return { error: null }
}
