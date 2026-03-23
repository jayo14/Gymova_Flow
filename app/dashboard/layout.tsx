"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import { useAuth } from "@/components/auth/AuthProvider"
import { getTrainerStatus } from "@/lib/trainerAuth"
import { DashboardSidebar, DashboardSidebarLink } from "@/components/dashboard/Sidebar"
import { DashboardTopNav } from "@/components/dashboard/TopNav"

import {
  LayoutDashboard,
  Search,
  Calendar,
  MessageCircle,
  Sparkles,
  User,
  Briefcase,
} from "lucide-react"

const baseSidebarLinks: DashboardSidebarLink[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/trainers", label: "Find Trainers", icon: Search },
  { href: "/dashboard/bookings", label: "Bookings", icon: Calendar },
  { href: "/messages", label: "Messages", icon: MessageCircle },
  { href: "/ai-coach", label: "AI Coach", icon: Sparkles },
  { href: "/dashboard/profile", label: "Profile", icon: User },
]
const trainerDashboardLink: DashboardSidebarLink = { href: "/trainer", label: "Trainer dashboard", icon: Briefcase }

function Sidebar({
  isOpen,
  onClose,
  userName,
  userEmail,
  onLogout,
  isTrainer,
}: {
  isOpen: boolean
  onClose: () => void
  userName?: string | null
  userEmail?: string | null
  onLogout: () => void
  isTrainer: boolean
}) {
  const pathname = usePathname()
  const sidebarLinks = isTrainer
    ? [baseSidebarLinks[0], trainerDashboardLink, ...baseSidebarLinks.slice(1)]
    : baseSidebarLinks

  return (
    <>
      {isOpen && (
        <div 
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      <aside className={cn(
        "fixed top-0 left-0 z-50 h-full w-64 bg-sidebar border-r border-sidebar-border transform transition-transform duration-200 ease-in-out lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between h-16 px-6 border-b border-sidebar-border">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-sidebar-primary rounded-lg flex items-center justify-center">
                <Dumbbell className="w-5 h-5 text-sidebar-primary-foreground" />
              </div>
              <span className="text-lg font-bold text-sidebar-foreground">GymovaFlow</span>
            </Link>
            <button className="lg:hidden text-sidebar-foreground" onClick={onClose}>
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="flex-1 p-4 space-y-1">
            {sidebarLinks.map((link) => {
              const isActive = pathname === link.href || 
                (link.href !== "/dashboard" && pathname.startsWith(link.href))
              
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
            <div className="flex items-center gap-3 px-4 py-3">
              <div className="w-9 h-9 rounded-full bg-sidebar-accent" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-sidebar-foreground truncate">
                  {userName || "Account"}
                </p>
                {userEmail && (
                  <p className="text-xs text-sidebar-foreground/60 truncate">
                    {userEmail}
                  </p>
                )}
              </div>
              <ChevronDown className="w-4 h-4 text-sidebar-foreground/60" />
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full border-sidebar-border text-sidebar-foreground hover:bg-sidebar-accent/70"
              onClick={onLogout}
            >
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
          <h1 className="text-lg font-semibold text-foreground hidden sm:block">Dashboard</h1>
        </div>

        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="w-5 h-5 text-muted-foreground" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="hidden sm:inline-flex border-border"
            onClick={onLogout}
          >
            Sign out
          </Button>
          <div className="w-9 h-9 rounded-full bg-secondary" />
        </div>
      </div>
    </header>
  )
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isTrainer, setIsTrainer] = useState(false)
  const [isPendingTrainer, setIsPendingTrainer] = useState(false)

  const router = useRouter()
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
  }, [loading, session, router])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.replace("/login")
  }

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
              Your trainer application is being reviewed. You&apos;ll be notified when it&apos;s accepted. Once approved, you can log in to access the trainer dashboard.
            </p>
          </div>
          <Button
            variant="outline"
            className="w-full border-border"
            onClick={handleLogout}
          >
            Sign out
          </Button>
        </div>
      </div>
    )
  }

  const sidebarLinks = isTrainer
    ? [baseSidebarLinks[0], trainerDashboardLink, ...baseSidebarLinks.slice(1)]
    : baseSidebarLinks

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
      <DashboardTopNav onMenuClick={() => setSidebarOpen(true)} onLogout={handleLogout} title="Dashboard" />
      <main className="lg:pl-64 pt-16">
        <div className="p-4 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  )
}
