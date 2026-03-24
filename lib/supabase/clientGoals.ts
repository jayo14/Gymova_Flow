import { supabase } from "@/lib/supabaseClient"

export type ClientGoalInput = {
  primary_goal: string
  experience_level: string
  preferred_training_style: string
  workout_days_per_week?: number | null
  injuries_limitations?: string | null
  notes?: string | null
}

export type ClientGoalRecord = ClientGoalInput & {
  id: string
  client_id: string
  created_at: string
}

/**
 * Fetch the current user's saved goals record if available.
 */
export async function getClientGoals(clientId: string): Promise<{
  data: ClientGoalRecord | null
  error: string | null
}> {
  const { data, error } = await supabase
    .from("client_goals")
    .select(
      "id, client_id, primary_goal, experience_level, preferred_training_style, workout_days_per_week, injuries_limitations, notes, created_at"
    )
    .eq("client_id", clientId)
    .maybeSingle()

  if (error) return { data: null, error: error.message }
  return { data: (data as ClientGoalRecord | null) ?? null, error: null }
}

/**
 * Upsert the current user's goals record for AI matching and onboarding continuity.
 */
export async function upsertClientGoals(
  clientId: string,
  goals: ClientGoalInput
): Promise<{ error: string | null }> {
  const payload = {
    client_id: clientId,
    primary_goal: goals.primary_goal,
    experience_level: goals.experience_level,
    preferred_training_style: goals.preferred_training_style,
    workout_days_per_week: goals.workout_days_per_week ?? null,
    injuries_limitations: goals.injuries_limitations ?? null,
    notes: goals.notes ?? null,
  }

  const { error } = await supabase
    .from("client_goals")
    .upsert(payload, { onConflict: "client_id" })

  if (error) return { error: error.message }
  return { error: null }
}
