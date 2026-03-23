import React from "react"
import { Menu, Bell } from "lucide-react"
import { Button } from "@/components/ui/button"

interface DashboardTopNavProps {
  onMenuClick: () => void
  onLogout: () => void
  title?: string
  showSignOut?: boolean
}

export function DashboardTopNav({
  onMenuClick,
  onLogout,
  title = "Dashboard",
  showSignOut = true,
}: DashboardTopNavProps) {
  return (
    <header className="fixed top-0 right-0 left-0 lg:left-64 h-16 bg-background/80 backdrop-blur-md border-b border-border z-30">
      <div className="flex items-center justify-between h-full px-4 lg:px-8">
        <div className="flex items-center gap-4">
          <button className="lg:hidden text-foreground" onClick={onMenuClick}>
            <Menu className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-semibold text-foreground hidden sm:block">{title}</h1>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="w-5 h-5 text-muted-foreground" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full" />
          </Button>
          {showSignOut && (
            <Button
              variant="outline"
              size="sm"
              className="hidden sm:inline-flex border-border"
              onClick={onLogout}
            >
              Sign out
            </Button>
          )}
          <div className="w-9 h-9 rounded-full bg-secondary" />
        </div>
      </div>
    </header>
  )
}
