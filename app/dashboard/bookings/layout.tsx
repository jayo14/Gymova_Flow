"use client"

import { RoleGate } from "@/components/auth/RoleGate"

export default function DashboardBookingsLayout({ children }: { children: React.ReactNode }) {
  return <RoleGate allowedRoles={["student"]}>{children}</RoleGate>
}
