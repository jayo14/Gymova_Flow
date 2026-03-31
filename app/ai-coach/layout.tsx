"use client"

import { RoleGate } from "@/components/auth/RoleGate"

export default function AICoachLayout({ children }: { children: React.ReactNode }) {
  return <RoleGate allowedRoles={["student"]}>{children}</RoleGate>
}
