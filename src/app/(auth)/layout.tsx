import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Authentication | BentaHub",
  description: "Sign in or create an account for BentaHub.",
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center bg-background p-6"
      style={{
        backgroundImage: "radial-gradient(#c4c5d7 0.5px, transparent 0.5px)",
        backgroundSize: "24px 24px",
      }}
    >
      {children}
    </div>
  )
}
