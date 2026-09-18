const termsSections = [
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
    </div>
  )
}

export function TermsContent() {
  return (
    <div className="space-y-8">
      <p className="text-sm leading-relaxed text-muted-foreground">
        Good day users! Welcome to the services operated by{" "}
        <strong>Lourdes Sari Sari Store</strong>. These Terms govern your access
        to and use of our system, the BentaHub, where you can reserve your items
        or products in your preferred branches, accessible on mobile, tablet,
        and computer through websites. By creating an account or using the
        Platform, you agree to these Terms. If you do not agree, please do not
        use the Service.
      </p>

      <SectionList sections={termsSections} />

      <section>
        <h3 className="font-heading text-lg font-semibold text-foreground">
          14. Contact
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
          12. Contact
        </h3>
        <div className="mt-3">
          <ContactBox />
        </div>
      </section>
    </div>
  )
}
