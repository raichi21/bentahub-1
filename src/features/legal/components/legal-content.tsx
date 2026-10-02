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
    title: "Information We Collect",
    items: [
      <>
        We collect your name, email, password (secured), branch info, role,
        transaction records, and communications.
      </>,
      <>
        We also get device data, IP address, cookies, and logs automatically.
      </>,
      <>
        Payments are handled by providers like PayMongo and GCash — we
        don&rsquo;t store full card or wallet details.
      </>,
      <>
        If you sign in with Google or Facebook, we only get basic info like your
        name and email.
      </>,
    ],
  },
  {
    title: "How We Use Your Data",
    items: [
      <>
        We use your data to create and manage accounts, process transactions,
        provide support, improve security, and follow legal requirements.
      </>,
    ],
  },
  {
    title: "Sharing",
    items: [
      <>
        We don&rsquo;t sell your data. We may share it with service providers,
        authorities when required, or within your organization for operations.
      </>,
    ],
  },
  {
    title: "Security",
    items: [
      <>
        We apply safeguards to protect your data, but no system is 100% secure.
      </>,
    ],
  },
  {
    title: "Your Rights",
    items: [
      <>
        You can request access, correction, deletion, or transfer of your data.
        You can also file complaints with the NPC. For help, email us at{" "}
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
        At Lourdes Sari-Sari Store, we value your privacy. This Policy explains
        how we handle your personal data in line with the Data Privacy Act of
        2012 (RA 10173) and the rules of the National Privacy Commission (NPC).
        By using BentaHub, you agree to this Policy.
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
