"use client"

import { useRouter, usePathname } from "next/navigation"
import { useEffect, useMemo, useState } from "react"
import {
  Briefcase,
  Calendar,
  LayoutDashboard,
  MessageCircle,
  Search,
  Sparkles,
  User,
} from "lucide-react"

import { useAuth } from "@/components/auth/AuthProvider"
import { DashboardSidebar, DashboardSidebarLink } from "@/components/dashboard/Sidebar"
import { DashboardTopNav } from "@/components/dashboard/TopNav"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabaseClient"
import { getTrainerStatus } from "@/lib/trainerAuth"

const baseSidebarLinks: DashboardSidebarLink[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/trainers", label: "Find Trainers", icon: Search },
  { href: "/dashboard/bookings", label: "Bookings", icon: Calendar },
  { href: "/messages", label: "Messages", icon: MessageCircle },
  { href: "/ai-coach", label: "AI Coach", icon: Sparkles },
  { href: "/dashboard/profile", label: "Profile", icon: User },
]

const trainerDashboardLink: DashboardSidebarLink = {
  href: "/trainer",
  label: "Trainer dashboard",
  icon: Briefcase,
}

function getDashboardTitle(pathname: string): string {
  if (pathname.startsWith("/dashboard/bookings")) return "My Bookings"
  if (pathname.startsWith("/dashboard/profile")) return "Profile"
  if (pathname.startsWith("/dashboard/trainer")) return "Trainer Redirect"
  return "Dashboard"
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isTrainer, setIsTrainer] = useState(false)
  const [isPendingTrainer, setIsPendingTrainer] = useState(false)

  const router = useRouter()
  const pathname = usePathname()
  const { user, session, loading } = useAuth()

  useEffect(() => {
    if (!loading && !session) {
      router.replace("/login")
      return
    }

    if (session?.user?.id) {
      getTrainerStatus(session.user.id).then((status) => {
        setIsTrainer(status === "approved")
        setIsPendingTrainer(status === "pending")
      })
    }
  }, [loading, router, session])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.replace("/login")
  }

  const sidebarLinks = useMemo(
    () => (isTrainer
      ? [baseSidebarLinks[0], trainerDashboardLink, ...baseSidebarLinks.slice(1)]
      : baseSidebarLinks),
    [isTrainer]
  )

  if (loading || (!session && typeof window !== "undefined")) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <span className="text-muted-foreground">Loading your dashboard...</span>
      </div>
    )
  }

  if (isPendingTrainer) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-8">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 p-6">
            <h1 className="text-xl font-semibold text-foreground mb-2">Application under review</h1>
            <p className="text-muted-foreground text-sm">
              Your trainer application is being reviewed. You will be notified when it is accepted.
            </p>
          </div>
          <Button variant="outline" className="w-full border-border" onClick={handleLogout}>
            Sign out
          </Button>
        </div>
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
        title="GymovaFlow"
      />
      <DashboardTopNav
        onMenuClick={() => setSidebarOpen(true)}
        onLogout={handleLogout}
        title={getDashboardTitle(pathname)}
      />
      <main className="lg:pl-64 pt-16">
        <div className="p-4 lg:p-8">{children}</div>
      </main>
    </div>
  )
}
