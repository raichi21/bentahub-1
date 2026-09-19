import { Metadata } from "next"
import { Navbar } from "@/features/landing"

export const metadata: Metadata = {
  title: "BentaHub | Your Neighborhood Sari-Sari Store, Are now online store",
  description:
    "BentaHub is a platform that helps you to reserve items from your Sari-Sari Store you can reserve items, and pick them up at your convenient time.",
}

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
    </div>
  )
}
