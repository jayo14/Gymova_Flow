"use client"

import { usePathname } from "next/navigation"
import { useState } from "react"
import {
  Bot,
  Dumbbell,
  LayoutDashboard,
  UserCheck,
  Users,
} from "lucide-react"
import { DashboardSidebar, DashboardSidebarLink } from "@/components/dashboard/Sidebar"
import { DashboardTopNav } from "@/components/dashboard/TopNav"
import { adminLogout } from "./actions"

const sidebarLinks: DashboardSidebarLink[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/applications", label: "Trainer Applications", icon: UserCheck },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/trainers", label: "Trainers", icon: Dumbbell },
  { href: "/admin/ai-models", label: "AI Models", icon: Bot },
]

function getAdminTitle(pathname: string): string {
  if (pathname.startsWith("/admin/applications")) return "Trainer Applications"
  if (pathname.startsWith("/admin/users")) return "Users"
  if (pathname.startsWith("/admin/trainers")) return "Trainers"
  if (pathname.startsWith("/admin/ai-models")) return "AI Models"
  return "Dashboard"
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  if (pathname === "/admin/login") {
    return <>{children}</>
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        userName="Admin User"
        userEmail="admin@gymovaflow.com"
        onLogout={() => void adminLogout()}
        links={sidebarLinks}
        title="GymovaFlow"
        signedInAs="admin"
        homeHref="/admin"
      />
      <DashboardTopNav
        onMenuClick={() => setSidebarOpen(true)}
        onLogout={() => void adminLogout()}
        title={getAdminTitle(pathname)}
      />
      <main className="lg:pl-64 pt-16">
        <div className="p-4 lg:p-8">{children}</div>
      </main>
    </div>
  )
}
