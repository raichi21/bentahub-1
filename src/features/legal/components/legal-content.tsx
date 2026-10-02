const termsSections = [
  {
    title: "Definitions",
    items: [
      <>
        <strong>Account</strong> — your profile used to log in.
      </>,
      <>
        <strong>Customer</strong> — someone who buys or reserves items.
      </>,
      <>
        <strong>Merchant</strong> — Lourdes Sari-Sari Store and its staff who
        manage reservations and sales.
      </>,
    ],
  },
  {
    title: "Account Rules",
    items: [
      <>Register with correct information.</>,
      <>Keep your password safe.</>,
      <>You&rsquo;re responsible for everything done under your account.</>,
      <>
        Report any unauthorized access to{" "}
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
    title: "Proper Use",
    items: [
      <>Do not use the system for illegal or dishonest activities.</>,
      <>Do not hack or break into the system.</>,
      <>
        Do not copy, resell, or reverse-engineer the system without permission.
      </>,
      <>Do not upload harmful files.</>,
      <>Do not violate privacy or intellectual property rights.</>,
    ],
  },
  {
    title: "Payments",
    items: [
      <>
        We only accept <strong>Cash</strong> or <strong>GCash</strong>.
      </>,
      <>
        Payments for reserved items are final and non-refundable unless required
        by law.
      </>,
    ],
  },
  {
    title: "Ownership",
    items: [
      <>
        All content in the system belongs to Lourdes Sari-Sari Store. You can
        only use it for its intended purpose.
      </>,
    ],
  },
  {
    title: "Third-Party Services",
    items: [
      <>
        We may connect with services like PayMongo, GCash, Google, or Facebook.
        We are not responsible for their policies or issues.
      </>,
    ],
  },
  {
    title: "Privacy",
    items: [
      <>
        We follow the Data Privacy Act of 2012 (RA 10173). By using BentaHub,
        you allow us to collect and use your information as explained in our
        Privacy Policy.
      </>,
    ],
  },
  {
    title: "Disclaimer",
    items: [
      <>
        The system is provided &ldquo;as is.&rdquo; We don&rsquo;t guarantee it
        will always be error-free or available.
      </>,
    ],
  },
  {
    title: "Liability",
    items: [
      <>
        We are not responsible for indirect damages like lost profits or data.
      </>,
    ],
  },
  {
    title: "Indemnity",
    items: [
      <>
        You agree to protect Lourdes Sari-Sari Store and its staff from claims
        related to your use of the system.
      </>,
    ],
  },
  {
    title: "Governing Law",
    items: [
      <>
        These Terms follow the laws of the Republic of the Philippines. Any
        disputes will be handled in the proper courts of Bulacan, Philippines.
      </>,
    ],
  },
]

const privacySections = [
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

function ContactBox() {
  return (
    <div className="rounded-lg border border-border bg-muted/50 p-4 text-sm text-muted-foreground">
      <p className="font-semibold text-foreground">Lourdes Sari Sari Store</p>
      <p className="mt-1">
        Address: C. De Guzman St., Hortaleza, Poblacion, Santa Maria, Bulacan.
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
  )
}

function SectionList({ sections }: { sections: typeof termsSections }) {
  return (
    <div className="space-y-8">
      {sections.map((section) => (
        <section key={section.title}>
          <h3 className="font-heading text-lg font-semibold text-foreground">
            {section.title}
          </h3>
          <div className="mt-3 space-y-2 text-sm leading-relaxed text-muted-foreground">
            {section.items.map((item, i) => (
              <div key={i}>{item}</div>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}

export function TermsContent() {
  return (
    <div className="space-y-8">
      <p className="text-sm leading-relaxed text-muted-foreground">
        Welcome to Lourdes Sari-Sari Store&rsquo;s BentaHub system. These Terms
        explain how you can use our platform to reserve items in your preferred
        branch. By creating an account or using BentaHub, you agree to follow
        these rules. If you don&rsquo;t agree, please don&rsquo;t use this
        platform.
      </p>

      <SectionList sections={termsSections} />

      <section>
        <h3 className="font-heading text-lg font-semibold text-foreground">
          Contact
        </h3>
        <div className="mt-3">
          <ContactBox />
        </div>
      </section>
    </div>
  )
}

export function PrivacyContent() {
  return (
    <div className="space-y-8">
      <p className="text-sm leading-relaxed text-muted-foreground">
        <strong>Lourdes Sari Sari Store</strong> values your privacy. This
        Policy explains how we collect, use, and protect your personal data in
        compliance with the Data Privacy Act of 2012 (RA 10173) and the
        guidelines of the National Privacy Commission (NPC). By using BentaHub,
        you consent to this Policy.
      </p>

      <SectionList sections={privacySections} />

      <section>
        <h3 className="font-heading text-lg font-semibold text-foreground">
          Contact
        </h3>
        <div className="mt-3">
          <ContactBox />
        </div>
      </section>
    </div>
  )
}
