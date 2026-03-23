import React from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { X, Dumbbell, ChevronDown, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"

export type DashboardSidebarLink = {
  href: string
  label: string
  icon: React.ElementType
}

interface DashboardSidebarProps {
  isOpen: boolean
  onClose: () => void
  userName?: string | null
  userEmail?: string | null
  onLogout: () => void
  links: DashboardSidebarLink[]
  title?: string
  signedInAs?: string
}

export function DashboardSidebar({
  isOpen,
  onClose,
  userName,
  userEmail,
  onLogout,
  links,
  title = "GymovaFlow",
  signedInAs,
}: DashboardSidebarProps) {
  const pathname = typeof window !== "undefined" ? window.location.pathname : ""
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
            <Link href={links[0]?.href || "/"} className="flex items-center gap-2">
              <div className="w-8 h-8 bg-sidebar-primary rounded-lg flex items-center justify-center">
                <Dumbbell className="w-5 h-5 text-sidebar-primary-foreground" />
              </div>
              <span className="text-lg font-bold text-sidebar-foreground">{title}</span>
            </Link>
            <button className="lg:hidden text-sidebar-foreground" onClick={onClose}>
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="flex-1 p-4 space-y-1">
            {links.map((link) => {
              const isActive =
                pathname === link.href ||
                (link.href !== links[0]?.href && pathname.startsWith(link.href))
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
            {signedInAs && (
              <p className="text-xs text-sidebar-foreground/60 px-4">Signed in as {signedInAs}</p>
            )}
            <div className="flex items-center gap-3 px-4 py-2">
              <div className="w-9 h-9 rounded-full bg-sidebar-accent shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-sidebar-foreground truncate">
                  {userName || title}
                </p>
                {userEmail && (
                  <p className="text-xs text-sidebar-foreground/60 truncate">{userEmail}</p>
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
              <LogOut className="w-4 h-4 mr-2" />
              Sign out
            </Button>
          </div>
        </div>
      </aside>
    </>
  )
}
