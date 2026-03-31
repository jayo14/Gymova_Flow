import React from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { X, Dumbbell, ChevronDown, ChevronLeft, ChevronRight, LogOut } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"

export type DashboardSidebarLink = {
  href: string
  label: string
  icon: React.ElementType
  badge?: number | string
}

interface DashboardSidebarProps {
  isOpen: boolean
  onClose: () => void
  collapsed?: boolean
  onToggleCollapsed?: () => void
  userName?: string | null
  userEmail?: string | null
  avatarUrl?: string | null
  onLogout: () => void
  links: DashboardSidebarLink[]
  title?: string
  signedInAs?: string
  homeHref?: string
}

function getInitials(name?: string | null) {
  if (!name) return "GF"
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "GF"
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase() ?? "").join("")
}

export function DashboardSidebar({
  isOpen,
  onClose,
  collapsed = false,
  onToggleCollapsed,
  userName,
  userEmail,
  avatarUrl,
  onLogout,
  links,
  title = "GymovaFlow",
  signedInAs,
  homeHref,
}: DashboardSidebarProps) {
  const pathname = typeof window !== "undefined" ? window.location.pathname : ""
  const resolvedHomeHref = homeHref ?? links[0]?.href ?? "/"

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
          "fixed top-0 left-0 z-50 h-full w-64 bg-sidebar border-r border-sidebar-border transform transition-all duration-200 ease-in-out lg:sticky lg:top-0 lg:h-screen lg:w-auto lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
        style={{ width: collapsed ? "5rem" : "16rem" }}
      >
        <div className="hidden lg:block absolute -right-px top-0 h-full w-px bg-sidebar-border" />
        {onToggleCollapsed && (
          <button
            type="button"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            onClick={onToggleCollapsed}
            className="hidden lg:flex absolute -right-3 top-1/2 -translate-y-1/2 h-6 w-6 items-center justify-center rounded-full border border-sidebar-border bg-background text-muted-foreground hover:text-foreground"
          >
            {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
          </button>
        )}
        <div className="flex flex-col h-full">
          <div className={cn("flex items-center h-16 border-b border-sidebar-border", collapsed ? "justify-center px-3" : "justify-between px-6")}>
            <Link href={resolvedHomeHref} className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 bg-sidebar-primary rounded-lg flex items-center justify-center">
                <Dumbbell className="w-5 h-5 text-sidebar-primary-foreground" />
              </div>
              {!collapsed && <span className="text-lg font-bold text-sidebar-foreground truncate">{title}</span>}
            </Link>
            <button className="lg:hidden text-sidebar-foreground" onClick={onClose}>
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="flex-1 p-4 space-y-1">
            {links.map((link) => {
              const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`)
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={onClose}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                    collapsed ? "justify-center" : "justify-between",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-primary"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <link.icon className="w-5 h-5" />
                    {!collapsed && <span className="font-medium">{link.label}</span>}
                  </div>
                  {!collapsed && link.badge && (
                    <span className={cn(
                      "text-xs font-semibold px-2 py-0.5 rounded-full",
                      isActive
                        ? "bg-sidebar-primary-foreground/20 text-sidebar-primary-foreground"
                        : "bg-sidebar-primary/20 text-sidebar-primary"
                    )}>
                      {link.badge}
                    </span>
                  )}
                </Link>
              )
            })}
          </nav>

          <div className="p-4 border-t border-sidebar-border space-y-3">
            {!collapsed && signedInAs && (
              <p className="text-xs text-sidebar-foreground/60 px-4">Signed in as {signedInAs}</p>
            )}
            <div className={cn("flex items-center px-4 py-2", collapsed ? "justify-center" : "gap-3")}>
              <Avatar className="h-9 w-9 border border-sidebar-border shrink-0">
                <AvatarImage src={avatarUrl ?? undefined} alt={userName ?? title} />
                <AvatarFallback className="bg-sidebar-accent text-sidebar-foreground text-xs font-semibold">
                  {getInitials(userName ?? title)}
                </AvatarFallback>
              </Avatar>
              {!collapsed && (
                <>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-sidebar-foreground truncate">
                      {userName || title}
                    </p>
                    {userEmail && (
                      <p className="text-xs text-sidebar-foreground/60 truncate">{userEmail}</p>
                    )}
                  </div>
                  <ChevronDown className="w-4 h-4 text-sidebar-foreground/60" />
                </>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "border-sidebar-border text-sidebar-foreground hover:bg-sidebar-accent/70",
                collapsed ? "w-10 h-10 p-0 mx-auto" : "w-full"
              )}
              onClick={onLogout}
            >
              <LogOut className={cn("w-4 h-4", !collapsed && "mr-2")} />
              {!collapsed && "Sign out"}
            </Button>
          </div>
        </div>
      </aside>
    </>
  )
}
