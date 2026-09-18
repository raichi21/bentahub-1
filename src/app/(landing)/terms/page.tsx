import { Metadata } from "next"
import Link from "next/link"
import { Footer } from "@/features/landing"
import { TermsContent } from "@/features/legal/components/legal-content"

export const metadata: Metadata = {
  title: "Terms and Conditions | Lourdes Sari Sari Store",
  description:
    "Terms and conditions governing your access to and use of the BentaHub platform operated by Lourdes Sari Sari Store.",
}

export default function TermsPage() {
  return (
    <>
      <main className="flex-1 bg-background">
        <div className="container mx-auto max-w-3xl px-4 py-12">
          <div className="mb-8">
            <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
              Last Updated: 18/09/2026
            </p>
            <h1 className="font-heading text-3xl font-bold text-foreground sm:text-4xl">
              Terms and Conditions
            </h1>
          </div>

          <TermsContent />

          <p className="mt-10 text-sm text-muted-foreground">
            Back to{" "}
            <Link href="/" className="text-primary underline">
              home
            </Link>{" "}
            or{" "}
            <Link href="/privacy" className="text-primary underline">
              view our Privacy Policy
            </Link>
            .
          </p>
        </div>
      </main>
      <Footer />
    </>
  )
}
