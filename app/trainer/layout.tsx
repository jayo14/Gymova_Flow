"use client"

import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import {
  Calendar,
  Clock,
  LayoutDashboard,
  MapPin,
  MessageCircle,
  User,
} from "lucide-react"

import { useAuth } from "@/components/auth/AuthProvider"
import { DashboardSidebar, DashboardSidebarLink } from "@/components/dashboard/Sidebar"
import { DashboardTopNav } from "@/components/dashboard/TopNav"
import { supabase } from "@/lib/supabaseClient"
import { getIsApprovedTrainer } from "@/lib/trainerAuth"

const sidebarLinks: DashboardSidebarLink[] = [
  { href: "/trainer", label: "Dashboard", icon: LayoutDashboard },
  { href: "/trainer/availability", label: "My availability", icon: Clock },
  { href: "/trainer/sessions", label: "Sessions", icon: Calendar },
  { href: "/trainer/locations", label: "My locations", icon: MapPin },
  { href: "/messages", label: "Messages", icon: MessageCircle },
  { href: "/dashboard/profile", label: "Profile", icon: User },
]

function getTrainerTitle(pathname: string): string {
  if (pathname.startsWith("/trainer/availability")) return "My availability"
  if (pathname.startsWith("/trainer/sessions")) return "Sessions"
  if (pathname.startsWith("/trainer/locations")) return "My locations"
  return "Trainer dashboard"
}

export default function TrainerLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [trainerChecked, setTrainerChecked] = useState(false)

  const router = useRouter()
  const pathname = usePathname()
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
  }, [loading, router, session])

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
      <DashboardTopNav
        onMenuClick={() => setSidebarOpen(true)}
        onLogout={handleLogout}
        title={getTrainerTitle(pathname)}
      />
      <main className="lg:pl-64 pt-16">
        <div className="p-4 lg:p-8">{children}</div>
      </main>
    </div>
  )
}
