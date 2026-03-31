import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { deleteUserAction, listAdminUsers, updateUserRole } from "../actions"

function getInitials(name?: string | null, email?: string | null) {
  const source = name || email || "User"
  return source
    .split(/\s+|@/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
}

function formatDate(value?: string | null) {
  if (!value) return "-"
  return new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

export default async function UsersPage({
  searchParams,
}: {
  searchParams?: Promise<{ q?: string }>
}) {
  const params = (await searchParams) ?? {}
  const query = params.q?.trim().toLowerCase() ?? ""
  const users = await listAdminUsers()

  async function submitUserRole(formData: FormData) {
    "use server"
    await updateUserRole(formData)
  }

  async function submitUserDelete(formData: FormData) {
    "use server"
    await deleteUserAction(formData)
  }

  const filteredUsers = query
    ? users.filter((user) =>
        [user.full_name ?? "", user.email ?? "", user.role ?? "", user.trainer_status ?? ""]
          .join(" ")
          .toLowerCase()
          .includes(query)
      )
    : users

  const totalUsers = users.length
  const trainers = users.filter((user) => user.role === "trainer").length
  const admins = users.filter((user) => user.role === "admin").length
  const activeUsers = users.filter((user) => Boolean(user.last_sign_in_at)).length

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Users</h1>
          <p className="text-muted-foreground mt-1">Manage roles, trainer access, and user lifecycle across the app.</p>
        </div>
        <form className="w-full max-w-sm">
          <Input name="q" defaultValue={params.q ?? ""} placeholder="Search by name, email, or role" className="bg-card border-border" />
        </form>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: "Total users", value: totalUsers },
          { label: "Active sign-ins", value: activeUsers },
          { label: "Trainers", value: trainers },
          { label: "Admins", value: admins },
        ].map((stat) => (
          <Card key={stat.label} className="bg-card border-border">
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <p className="text-3xl font-bold text-foreground mt-2">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">User management</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {filteredUsers.map((user) => (
            <div key={user.id} className="rounded-2xl border border-border bg-secondary/20 p-4">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div className="flex items-center gap-4 min-w-0">
                  <Avatar className="h-12 w-12 border border-border">
                    <AvatarImage src={user.avatar_url ?? undefined} alt={user.full_name ?? user.email ?? "User"} />
                    <AvatarFallback className="bg-primary/15 text-primary font-semibold">
                      {getInitials(user.full_name, user.email)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-foreground truncate">{user.full_name || user.email || user.id}</p>
                      <Badge variant="secondary" className="bg-primary/10 text-primary border-0 capitalize">
                        {user.role ?? "client"}
                      </Badge>
                      {user.trainer_status && (
                        <Badge variant="secondary" className="bg-amber-500/10 text-amber-500 border-0 capitalize">
                          {user.trainer_status}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{user.email ?? "No email on file"}</p>
                    <div className="mt-1 flex flex-wrap gap-4 text-xs text-muted-foreground">
                      <span>Joined {formatDate(user.created_at)}</span>
                      <span>Last sign-in {formatDate(user.last_sign_in_at)}</span>
                      <span>{user.email_confirmed_at ? "Email confirmed" : "Email not confirmed"}</span>
                    </div>
                  </div>
                </div>

                <div className="grid gap-3 xl:grid-cols-[minmax(0,180px)_minmax(0,180px)_auto] xl:items-end">
                  <form action={submitUserRole} className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(0,180px)_minmax(0,180px)_auto] xl:items-end xl:col-span-3">
                    <input type="hidden" name="user_id" value={user.id} />
                    <label className="grid gap-1 text-sm text-muted-foreground">
                      Role
                      <select name="role" defaultValue={user.role ?? "client"} className="h-10 rounded-md border border-border bg-background px-3 text-sm text-foreground">
                        <option value="student">Student</option>
                        <option value="client">Client</option>
                        <option value="trainer">Trainer</option>
                        <option value="admin">Admin</option>
                      </select>
                    </label>
                    <label className="grid gap-1 text-sm text-muted-foreground">
                      Trainer status
                      <select name="trainer_status" defaultValue={user.trainer_status ?? "pending"} className="h-10 rounded-md border border-border bg-background px-3 text-sm text-foreground">
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </label>
                    <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90">Save changes</Button>
                  </form>

                  <form action={submitUserDelete}>
                    <input type="hidden" name="user_id" value={user.id} />
                    <Button type="submit" variant="outline" className="border-destructive/40 text-destructive hover:bg-destructive/10">
                      Delete user
                    </Button>
                  </form>
                </div>
              </div>
            </div>
          ))}

          {filteredUsers.length === 0 && (
            <div className="rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground">
              No users matched this search.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
