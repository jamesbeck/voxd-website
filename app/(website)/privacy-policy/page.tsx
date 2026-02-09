import Container from "@/components/websiteui/container";
import H2 from "@/components/websiteui/h2";

export default function PrivacyPolicy() {
  return (
    <Container>
      <H2 className="text-center">Privacy Policy</H2>

      <p className="mb-4 text-sm text-slate-600">Effective date: 09/02/2026</p>

      <p className="mb-6">
        This Privacy Policy explains how{" "}
        <span className="font-medium">Voxd AI LTD</span> (“Voxd”, “we”, “us” or
        “our”) collects and uses personal data when you visit our website, use
        our client portal, or otherwise interact with Voxd. It also explains how
        personal data is processed when Voxd provides chatbot services to
        business clients.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">Who we are</h2>
      <p className="mb-3">
        <span className="font-medium">Voxd AI LTD</span> is a company
        incorporated in England and Wales (company number 16911937).
      </p>
      <p className="mb-6">
        Contact (privacy):{" "}
        <a
          href="mailto:hello@voxd.app"
          className="underline decoration-slate-400 hover:decoration-slate-700"
        >
          hello@voxd.app
        </a>
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">
        Important: our role (Controller vs Processor)
      </h2>
      <ul className="list-disc pl-6 space-y-2 mb-6">
        <li>
          <span className="font-medium">When we run our business</span>{" "}
          (website, sales, billing, accounts, portal access, support), Voxd is
          usually the <span className="font-medium">data controller</span> for
          that personal data.
        </li>
        <li>
          <span className="font-medium">
            When we provide chatbot services to a business client
          </span>
          , Voxd typically acts as a{" "}
          <span className="font-medium">data processor</span> and the client is
          the <span className="font-medium">data controller</span> for end-user
          messages and related personal data. In those cases, the{" "}
          <span className="font-medium">client’s privacy information</span>{" "}
          should explain how end users’ data is used, and our processing is
          governed by our Data Processing Addendum (DPA).
        </li>
      </ul>

      <h2 className="text-xl font-semibold mt-8 mb-3">
        Personal data we collect (when Voxd is the Controller)
      </h2>
      <p className="mb-2">We may collect and use:</p>
      <ul className="list-disc pl-6 space-y-2 mb-6">
        <li>
          <span className="font-medium">Account & contact details:</span> name,
          email address, phone number, job title, company name, and login
          details for the client portal.
        </li>
        <li>
          <span className="font-medium">Billing details:</span> invoices,
          payment status, and related finance/admin records (note: payment
          processing may be handled by our payment providers; we do not normally
          store full card/bank details beyond what is necessary for billing and
          reconciliation).
        </li>
        <li>
          <span className="font-medium">Support communications:</span> messages
          you send to us, support tickets, and related notes.
        </li>
        <li>
          <span className="font-medium">Technical & usage data:</span> device
          information, logs, approximate location (derived from IP), and
          analytics data needed to operate, secure, and improve our services.
        </li>
        <li>
          <span className="font-medium">Cookies/local storage:</span> session
          and preference data (see “Cookies” below).
        </li>
      </ul>

      <h2 className="text-xl font-semibold mt-8 mb-3">
        Personal data we process for clients (when Voxd is the Processor)
      </h2>
      <p className="mb-2">
        When delivering chatbot services, Voxd may process personal data on the
        client’s behalf, such as:
      </p>
      <ul className="list-disc pl-6 space-y-2 mb-6">
        <li>
          <span className="font-medium">Message content and metadata:</span>{" "}
          messages sent to/from the client’s chatbot channels (e.g. WhatsApp),
          timestamps, and routing/automation context.
        </li>
        <li>
          <span className="font-medium">Identifiers:</span> phone numbers or
          user IDs used by the messaging channel, plus conversation/session IDs.
        </li>
        <li>
          <span className="font-medium">Client-provided data:</span> data the
          client connects via integrations (e.g. CRM fields) depending on the
          client’s configuration and instructions.
        </li>
      </ul>
      <p className="mb-6">
        If you are an end user messaging a business that uses Voxd, please refer
        to that business’s privacy notice. Voxd processes end-user data on the
        business’s instructions.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">
        How we use personal data (Controller activities)
      </h2>
      <ul className="list-disc pl-6 space-y-2 mb-6">
        <li>To provide and administer access to our client portal.</li>
        <li>To provide customer support and manage requests.</li>
        <li>To manage billing, payments, and account administration.</li>
        <li>
          To operate, secure, monitor, and improve our services and website.
        </li>
        <li>
          To send service-related communications (e.g. important updates,
          changes to terms/policies, security notices).
        </li>
        <li>To comply with legal obligations and protect our rights.</li>
      </ul>

      <h2 className="text-xl font-semibold mt-8 mb-3">
        Lawful bases (UK GDPR)
      </h2>
      <ul className="list-disc pl-6 space-y-2 mb-6">
        <li>
          <span className="font-medium">Contract:</span> to provide the services
          you request and manage our relationship with you.
        </li>
        <li>
          <span className="font-medium">Legitimate interests:</span> to operate,
          secure, and improve our services; prevent fraud/abuse; and manage our
          business (balanced against your rights).
        </li>
        <li>
          <span className="font-medium">Legal obligation:</span> where we must
          comply with law (e.g. tax/accounting, lawful requests).
        </li>
        <li>
          <span className="font-medium">Consent:</span> where we use optional
          cookies or where you opt in to particular communications (you can
          withdraw consent at any time).
        </li>
      </ul>

      <h2 className="text-xl font-semibold mt-8 mb-3">Sharing personal data</h2>
      <p className="mb-2">We may share personal data with:</p>
      <ul className="list-disc pl-6 space-y-2 mb-6">
        <li>
          <span className="font-medium">Service providers (processors):</span>{" "}
          hosting, infrastructure, monitoring, analytics, email/support tooling,
          and security providers, under contractual safeguards.
        </li>
        <li>
          <span className="font-medium">Messaging and AI providers:</span> where
          a client’s chatbot uses third-party messaging channels (e.g. WhatsApp/
          Meta) or AI model providers, message content and related data may be
          transmitted to those providers to deliver the service, subject to the
          client’s configuration and instructions.
        </li>
        <li>
          <span className="font-medium">Legal and safety reasons:</span> where
          necessary to comply with law, enforce our terms, or protect rights and
          safety.
        </li>
        <li>
          <span className="font-medium">Business transfers:</span> if we’re
          involved in a merger, acquisition, financing, or sale of assets (we’ll
          take steps to protect your data and provide notice where appropriate).
        </li>
      </ul>

      <h2 className="text-xl font-semibold mt-8 mb-3">
        International transfers
      </h2>
      <p className="mb-6">
        Some of our service providers (and some providers used in client chatbot
        configurations) may process data outside the UK. Where required, we use
        appropriate safeguards such as UK-approved transfer mechanisms (for
        example, the UK International Data Transfer Agreement) and contractual
        protections.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">Retention</h2>
      <ul className="list-disc pl-6 space-y-2 mb-6">
        <li>
          <span className="font-medium">Controller data:</span> we keep account,
          billing, and support records only as long as needed for the purposes
          above, and to meet legal/accounting requirements.
        </li>
        <li>
          <span className="font-medium">Client-processed message data:</span>{" "}
          retention depends on the client’s configuration, the technical needs
          of service delivery (e.g. short-term processing, logs), and any
          retention agreed in writing (including our DPA). We aim to minimise
          retention and securely delete data when it is no longer required.
        </li>
      </ul>

      <h2 className="text-xl font-semibold mt-8 mb-3">Your rights</h2>
      <p className="mb-2">
        If Voxd is the controller of your personal data, you may have the right
        to:
      </p>
      <ul className="list-disc pl-6 space-y-2 mb-6">
        <li>access your personal data;</li>
        <li>correct inaccurate personal data;</li>
        <li>request deletion (where applicable);</li>
        <li>object to or restrict certain processing;</li>
        <li>data portability (in certain cases);</li>
        <li>withdraw consent (where we rely on consent).</li>
      </ul>
      <p className="mb-6">
        To exercise your rights, contact{" "}
        <a
          href="mailto:hello@voxd.app"
          className="underline decoration-slate-400 hover:decoration-slate-700"
        >
          hello@voxd.app
        </a>
        . You can also complain to the UK Information Commissioner’s Office
        (ICO).
      </p>
      <p className="mb-6">
        <span className="font-medium">
          If Voxd is processing your data on behalf of a client
        </span>{" "}
        (for example, you messaged a business using Voxd), please direct your
        request to that business (the controller). We will assist the controller
        as required under our DPA.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">Cookies</h2>
      <p className="mb-6">
        We use cookies and similar technologies to keep you signed in, remember
        preferences, and help operate and secure our services. Where required,
        we will ask for your consent for non-essential cookies. You can control
        cookies through your browser settings.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">Security</h2>
      <p className="mb-6">
        We use appropriate technical and organisational measures to protect
        personal data. No system is completely secure, but we work to reduce
        risks of unauthorised access, loss, misuse, or alteration.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">Children</h2>
      <p className="mb-6">
        Our services are intended for business use and are not directed at
        children. If you believe a child has provided personal data to a Voxd
        client via a chatbot, please contact the relevant business (the data
        controller) or contact us and we will route the request appropriately.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">
        Changes to this policy
      </h2>
      <p className="mb-6">
        We may update this Privacy Policy from time to time. The latest version
        will be available on our website with the effective date at the top. If
        changes are significant, we may provide additional notice (e.g. via the
        client portal or email where appropriate).
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">Contact</h2>
      <p className="mb-6">
        Email:{" "}
        <a
          href="mailto:hello@voxd.app"
          className="underline decoration-slate-400 hover:decoration-slate-700"
        >
          hello@voxd.app
        </a>
      </p>

      <p className="mt-10 text-xs text-slate-500">
        This policy is for general information and does not constitute legal
        advice.
      </p>
    </Container>
  );
}
