"use client"

import { usePathname } from "next/navigation"
import { AthleteDashboardShell } from "@/components/dashboard/AthleteDashboardShell"

function getDashboardTitle(pathname: string): string {
  if (pathname.startsWith("/dashboard/bookings")) return "My Bookings"
  if (pathname.startsWith("/dashboard/profile")) return "Profile"
  if (pathname.startsWith("/dashboard/notifications")) return "Notifications"
  if (pathname.startsWith("/dashboard/trainer")) return "Trainer Redirect"
  return "Dashboard"
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  return <AthleteDashboardShell title={getDashboardTitle(pathname)}>{children}</AthleteDashboardShell>
}
