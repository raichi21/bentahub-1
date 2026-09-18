import { Metadata } from "next"
import Link from "next/link"
import { Footer } from "@/features/landing"

export const metadata: Metadata = {
  title: "Terms and Conditions | Lourdes Sari Sari Store",
  description:
    "Terms and conditions governing your access to and use of the BentaHub platform operated by Lourdes Sari Sari Store.",
}

const sections = [
  {
    title: "1. Definitions",
    items: [
      <>
        <strong>Account</strong> — your registered profile used to access the
        Platform.
      </>,
      <>
        <strong>Customer</strong> — an end user who purchases goods through a
        merchant using the Platform.
      </>,
      <>
        <strong>Merchant</strong> — a business or individual using the Platform
        to reserve items.
      </>,
    ],
  },
  {
    title: "2. Eligibility",
    items: [
      <>
        You must be at least eighteen (18) years old and legally capable of
        entering into a binding contract to create an Account. By using the
        Platform, you represent and warrant that you meet these requirements.
      </>,
    ],
  },
  {
    title: "3. Account Registration and Security",
    items: [
      <>Provide accurate and complete information when registering.</>,
      <>Keep your login credentials confidential.</>,
      <>You are responsible for all activities under your Account.</>,
      <>
        Report unauthorized access immediately at{" "}
        <a
          href="mailto:bentahubstore@gmail.com"
          className="text-primary underline"
        >
          bentahubstore@gmail.com
        </a>
        .
      </>,
    ],
  },
  {
    title: "4. Acceptable Use",
    items: [
      <>Use the Platform for unlawful or fraudulent purposes;</>,
      <>Attempt unauthorized access or interfere with system operations;</>,
      <>
        Copy, resell, or reverse-engineer the Platform without written consent;
      </>,
      <>Upload malicious code or disrupt functionality;</>,
      <>Violate intellectual property or privacy rights.</>,
    ],
  },
  {
    title: "5. Payments",
    items: [
      <>
        The system only supports payment via <strong>cash</strong> or{" "}
        <strong>GCash</strong>. Any other digital payment methods, such as
        cards, are not included.
      </>,
      <>
        Unless stated otherwise, fees are non-refundable, subject to applicable
        law.
      </>,
    ],
  },
  {
    title: "6. Intellectual Property",
    items: [
      <>
        All content and materials on the Platform are owned or licensed by
        Lourdes Sari Sari Store. You are granted a limited, non-exclusive
        license to use the Platform for its intended purpose.
      </>,
    ],
  },
  {
    title: "7. Third-Party Services",
    items: [
      <>
        Integrations with services like PayMongo, GCash, Google, and Facebook
        are provided for convenience. We are not responsible for their content
        or policies.
      </>,
    ],
  },
  {
    title: "8. Disclaimer",
    items: [
      <>
        The Platform is provided &ldquo;as is&rdquo; and &ldquo;as
        available.&rdquo; We do not guarantee uninterrupted or error-free
        service.
      </>,
    ],
  },
  {
    title: "9. Limitation of Liability",
    items: [
      <>
        To the fullest extent permitted by law, Lourdes Sari Sari Store shall
        not be liable for indirect or consequential damages, including loss of
        profits or data.
      </>,
    ],
  },
  {
    title: "10. Indemnification",
    items: [
      <>
        You agree to indemnify and hold harmless Lourdes Sari Sari Store, its
        officers, and employees from any claims arising from your use of the
        Platform.
      </>,
    ],
  },
  {
    title: "11. Termination",
    items: [
      <>
        We may suspend or terminate access at any time for violations of these
        Terms or harmful conduct.
      </>,
    ],
  },
  {
    title: "12. Changes",
    items: [
      <>
        We may update these Terms periodically. Material changes will be posted
        with a new &ldquo;Last Updated&rdquo; date. Continued use means
        acceptance.
      </>,
    ],
  },
  {
    title: "13. Governing Law",
    items: [
      <>
        These Terms are governed by the laws of the Republic of the Philippines.
        Disputes shall be resolved exclusively in the courts of C. De Guzman
        St., Hortaleza, Poblacion, Santa Maria, Bulacan, Philippines.
      </>,
    ],
  },
]

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

          <p className="text-sm leading-relaxed text-muted-foreground">
            Good day users! Welcome to the services operated by{" "}
            <strong>Lourdes Sari Sari Store</strong>. These Terms govern your
            access to and use of our system, the BentaHub, where you can reserve
            your items or products in your preferred branches, accessible on
            mobile, tablet, and computer through websites. By creating an
            account or using the Platform, you agree to these Terms. If you do
            not agree, please do not use the Service.
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
                14. Contact
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
