"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import { useAuth } from "@/components/auth/AuthProvider"
import { getIsApprovedTrainer } from "@/lib/trainerAuth"
import { DashboardSidebar, DashboardSidebarLink } from "@/components/dashboard/Sidebar"
import { DashboardTopNav } from "@/components/dashboard/TopNav"

import {
  LayoutDashboard,
  Calendar,
  Clock,
  MessageCircle,
  User,
  MapPin,
} from "lucide-react"

const sidebarLinks: DashboardSidebarLink[] = [
  { href: "/trainer", label: "Dashboard", icon: LayoutDashboard },
  { href: "/trainer/availability", label: "My availability", icon: Clock },
  { href: "/trainer/sessions", label: "Sessions", icon: Calendar },
  { href: "/trainer/locations", label: "My locations", icon: MapPin },
  { href: "/messages", label: "Messages", icon: MessageCircle },
  { href: "/dashboard/profile", label: "Profile", icon: User },
]

function Sidebar({
  isOpen,
  onClose,
  userName,
  userEmail,
  onLogout,
}: {
  isOpen: boolean
  onClose: () => void
  userName?: string | null
  userEmail?: string | null
  onLogout: () => void
}) {
  const pathname = usePathname()

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-full w-64 bg-sidebar border-r border-sidebar-border transform transition-transform duration-200 ease-in-out lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between h-16 px-6 border-b border-sidebar-border">
            <Link href="/trainer" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-sidebar-primary rounded-lg flex items-center justify-center">
                <Dumbbell className="w-5 h-5 text-sidebar-primary-foreground" />
              </div>
              <span className="text-lg font-bold text-sidebar-foreground">Trainer</span>
            </Link>
            <button className="lg:hidden text-sidebar-foreground" onClick={onClose}>
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="flex-1 p-4 space-y-1">
            {sidebarLinks.map((link) => {
              const isActive =
                pathname === link.href ||
                (link.href !== "/trainer" && pathname.startsWith(link.href))
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={onClose}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-primary"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                  )}
                >
                  <link.icon className="w-5 h-5" />
                  <span className="font-medium">{link.label}</span>
                </Link>
              )
            })}
          </nav>

          <div className="p-4 border-t border-sidebar-border space-y-3">
            <p className="text-xs text-sidebar-foreground/60 px-4">Signed in as trainer</p>
            <div className="flex items-center gap-3 px-4 py-2">
              <div className="w-9 h-9 rounded-full bg-sidebar-accent shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-sidebar-foreground truncate">
                  {userName || "Trainer"}
                </p>
                {userEmail && (
                  <p className="text-xs text-sidebar-foreground/60 truncate">{userEmail}</p>
                )}
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full border-sidebar-border text-sidebar-foreground hover:bg-sidebar-accent/70"
              onClick={onLogout}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign out
            </Button>
          </div>
        </div>
      </aside>
    </>
  )
}

function TopNav({ onMenuClick, onLogout }: { onMenuClick: () => void; onLogout: () => void }) {
  return (
    <header className="fixed top-0 right-0 left-0 lg:left-64 h-16 bg-background/80 backdrop-blur-md border-b border-border z-30">
      <div className="flex items-center justify-between h-full px-4 lg:px-8">
        <div className="flex items-center gap-4">
          <button className="lg:hidden text-foreground" onClick={onMenuClick}>
            <Menu className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-semibold text-foreground hidden sm:block">Trainer dashboard</h1>
        </div>
        <Button variant="outline" size="sm" className="border-border" onClick={onLogout}>
          Sign out
        </Button>
      </div>
    </header>
  )
}

export default function TrainerLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [trainerChecked, setTrainerChecked] = useState(false)
  const router = useRouter()
  const { user, session, loading } = useAuth()

  useEffect(() => {
    if (loading) return
    if (!session?.user) {
      router.replace("/login")
      return
    }
    getIsApprovedTrainer(session.user.id).then((isTrainer) => {
      setTrainerChecked(true)
      if (!isTrainer) {
        router.replace("/dashboard")
      }
    })
  }, [loading, session, router])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.replace("/login")
  }

  if (loading || !trainerChecked || !session) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <span className="text-muted-foreground">Loading trainer dashboard...</span>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        userName={(user?.user_metadata as { full_name?: string })?.full_name || user?.email || null}
        userEmail={user?.email ?? null}
        onLogout={handleLogout}
        links={sidebarLinks}
        title="Trainer"
        signedInAs="trainer"
      />
      <DashboardTopNav onMenuClick={() => setSidebarOpen(true)} onLogout={handleLogout} title="Trainer dashboard" />
      <main className="lg:pl-64 pt-16">
        <div className="p-4 lg:p-8">{children}</div>
      </main>
    </div>
  )
}
