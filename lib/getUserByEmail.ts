import { supabaseAdmin } from "./supabaseAdmin"

export interface AuthUser {
  id: string
  email: string
  email_confirmed_at: string | null
  raw_user_meta_data: Record<string, unknown>
}

/**
 * Looks up an auth user by email.
 *
 * Tries the efficient `get_auth_user_by_email` database function first.
 * If that function is not yet available in the schema cache (PGRST202 —
 * migration not applied), it falls back to paginating through
 * `auth.admin.listUsers` so the feature still works during deployment.
 */
export async function getUserByEmail(email: string): Promise<AuthUser | null> {
  const normalizedEmail = email.toLowerCase()

  const { data, error } = await supabaseAdmin.rpc("get_auth_user_by_email", {
    p_email: normalizedEmail,
  })

  if (!error) {
    if (!data || (Array.isArray(data) && data.length === 0)) return null
    return Array.isArray(data) ? (data[0] as AuthUser) : (data as AuthUser)
  }

  // PGRST202 means the function does not exist in the schema cache yet
  // (migration pending). Fall back silently so the feature continues to work.
  if (error.code !== "PGRST202") {
    console.error("[getUserByEmail] RPC error:", error)
    throw new Error("Failed to look up user by email.")
  }

  // Fallback: paginate through all auth users.
  let page = 1
  const perPage = 200

  while (true) {
    const { data: usersData, error: usersError } = await supabaseAdmin.auth.admin.listUsers({
      page,
      perPage,
    })

    if (usersError) {
      console.error("[getUserByEmail] listUsers fallback error:", usersError)
      throw new Error("Failed to look up user by email.")
    }

    const users = usersData?.users ?? []
    const match = users.find((u) => u.email?.toLowerCase() === normalizedEmail)

    if (match) {
      return {
        id: match.id,
        email: match.email ?? "",
        email_confirmed_at: match.email_confirmed_at ?? null,
        raw_user_meta_data: (match.user_metadata ?? {}) as Record<string, unknown>,
      }
    }

    if (users.length < perPage) return null
    page += 1
  }
}
