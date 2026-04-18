"use client"

import { RoleGate } from "@/components/auth/RoleGate"

export default function TrainersLayout({ children }: { children: React.ReactNode }) {
  return <RoleGate allowedRoles={["client"]}>{children}</RoleGate>
}
