import { Metadata } from "next"
import Link from "next/link"
import { Footer } from "@/features/landing"

export const metadata: Metadata = {
  title: "Privacy Policy | Lourdes Sari Sari Store",
  description:
    "Privacy policy of the BentaHub platform operated by Lourdes Sari Sari Store, in compliance with the Data Privacy Act of 2012 (RA 10173).",
}

const sections = [
  {
    title: "1. Information We Collect",
    items: [
      <>
        <strong>You provide:</strong> name, email, password (hashed),
        branch/merchant info, role, transaction records, and communications.
      </>,
      <>
        <strong>Automatically collected:</strong> device data, IP address,
        cookies, and logs.
      </>,
      <>
        <strong>Payment data:</strong> processed by third-party providers
        (PayMongo, GCash). We do not store full card or wallet details.
      </>,
      <>
        <strong>Third-party sign-in:</strong> basic profile info from Google or
        Facebook (name, email).
      </>,
    ],
  },
  {
    title: "2. How We Use Data",
    items: [
      <>
        To create and manage accounts, process transactions, provide support,
        improve security, and comply with legal obligations.
      </>,
    ],
  },
  {
    title: "3. Legal Basis",
    items: [
      <>
        Processing is based on consent, contract performance, legal compliance,
        or legitimate interests.
      </>,
    ],
  },
  {
    title: "4. Cookies",
    items: [
      <>
        Used to maintain sessions and preferences. You may disable them via
        browser settings, but some features may not work properly.
      </>,
    ],
  },
  {
    title: "5. Sharing",
    items: [
      <>
        We do not sell data. We may share it with service providers, authorities
        (when required), or within your organization for operations.
      </>,
    ],
  },
  {
    title: "6. Retention",
    items: [
      <>
        Data is kept only as long as necessary for legitimate purposes, then
        securely deleted or anonymized.
      </>,
    ],
  },
  {
    title: "7. Security",
    items: [
      <>
        We apply reasonable safeguards to protect data, though no system is
        completely secure.
      </>,
    ],
  },
  {
    title: "8. Your Rights",
    items: [
      <>
        You may request access, correction, deletion, or portability of your
        data, and file complaints with the NPC. Contact{" "}
        <a
          href="mailto:bentahubstore@gmail.com"
          className="text-primary underline"
        >
          bentahubstore@gmail.com
        </a>{" "}
        for assistance.
      </>,
    ],
  },
  {
    title: "9. Children's Privacy",
    items: [
      <>
        Not intended for users under 18. We do not knowingly collect data from
        minors.
      </>,
    ],
  },
  {
    title: "10. International Transfers",
    items: [
      <>
        Data may be stored or processed outside the Philippines, with adequate
        protection measures.
      </>,
    ],
  },
  {
    title: "11. Updates",
    items: [
      <>
        We may revise this Policy; changes will be posted with a new &ldquo;Last
        Updated&rdquo; date.
      </>,
    ],
  },
]

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

          <p className="text-sm leading-relaxed text-muted-foreground">
            <strong>Lourdes Sari Sari Store</strong> values your privacy. This
            Policy explains how we collect, use, and protect your personal data
            in compliance with the Data Privacy Act of 2012 (RA 10173) and the
            guidelines of the National Privacy Commission (NPC). By using
            BentaHub, you consent to this Policy.
          </p>

          <div className="mt-10 space-y-8">
            {sections.map((section) => (
              <section key={section.title}>
                <h2 className="font-heading text-lg font-semibold text-foreground">
                  {section.title}
                </h2>
                <ul className="mt-3 space-y-2 text-sm leading-relaxed text-muted-foreground">
                  {section.items.map((item, i) => (
                    <li
                      key={i}
                      className="list-disc pl-5 marker:text-muted-foreground"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </section>
            ))}

            <section>
              <h2 className="font-heading text-lg font-semibold text-foreground">
                12. Contact
              </h2>
              <div className="mt-3 rounded-lg border border-border bg-muted/50 p-4 text-sm text-muted-foreground">
                <p className="font-semibold text-foreground">
                  Lourdes Sari Sari Store
                </p>
                <p className="mt-1">
                  Address: C. De Guzman St., Hortaleza, Poblacion, Santa Maria,
                  Bulacan.
                </p>
                <p>
                  Email:{" "}
                  <a
                    href="mailto:bentahubstore@gmail.com"
                    className="text-primary underline"
                  >
                    bentahubstore@gmail.com
                  </a>
                </p>
                <p>Phone: 09909231131</p>
              </div>
            </section>
          </div>

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
