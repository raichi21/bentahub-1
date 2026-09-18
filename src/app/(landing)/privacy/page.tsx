import { Metadata } from "next"
import Link from "next/link"
import { Footer } from "@/features/landing"
import { PrivacyContent } from "@/features/legal/components/legal-content"

export const metadata: Metadata = {
  title: "Privacy Policy | Lourdes Sari Sari Store",
  description:
    "Privacy policy of the BentaHub platform operated by Lourdes Sari Sari Store, in compliance with the Data Privacy Act of 2012 (RA 10173).",
}

export default function PrivacyPage() {
  return (
    <>
      <main className="flex-1 bg-background">
        <div className="container mx-auto max-w-3xl px-4 py-12">
          <div className="mb-8">
            <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
              Last Updated: 18/09/2026
            </p>
            <h1 className="font-heading text-3xl font-bold text-foreground sm:text-4xl">
              Privacy Policy
            </h1>
          </div>

          <PrivacyContent />

          <p className="mt-10 text-sm text-muted-foreground">
            Back to{" "}
            <Link href="/" className="text-primary underline">
              home
            </Link>{" "}
            or{" "}
            <Link href="/terms" className="text-primary underline">
              view our Terms and Conditions
            </Link>
            .
          </p>
        </div>
      </main>
      <Footer />
    </>
  )
}
