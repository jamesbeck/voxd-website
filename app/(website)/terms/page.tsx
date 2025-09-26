import Container from "@/components/websiteui/container";
import H2 from "@/components/websiteui/h2";

export default function Terms() {
  return (
    <Container>
      <H2 className="text-center">Terms of Service for SwiftReply</H2>

      <p className="mb-4 text-sm text-slate-600">Effective date: 18/08/2025</p>

      <p className="mb-6">
        These Terms of Service (“Terms”) govern your use of the SwiftReply
        application (the “App”), operated by{" "}
        <span className="font-medium">
          IO Shield Ltd (11265201), trading as SwiftReply
        </span>{" "}
        (“we”, “us”, or “our”). By using the App, you agree to these Terms. If
        you do not agree, please do not use the App.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">1. Eligibility</h2>
      <p className="mb-6">
        You must be at least 18 years old, or have legal parental/guardian
        consent if you are 13–17, to use the App. By using SwiftReply, you
        confirm you meet these requirements.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">2. Our service</h2>
      <p className="mb-6">
        SwiftReply automates WhatsApp message responses based on settings you
        configure. We do not provide WhatsApp itself, and you remain bound by
        WhatsApp’s own Terms of Service. We do not access your Facebook data.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">
        3. Your responsibilities
      </h2>
      <ul className="list-disc pl-6 space-y-2 mb-6">
        <li>
          You are responsible for the content of automated replies you configure
          and send.
        </li>
        <li>
          You must not use the App for unlawful, harmful, fraudulent, or abusive
          purposes.
        </li>
        <li>
          You must ensure you have the right to use WhatsApp in connection with
          automated responses.
        </li>
        <li>
          You are responsible for maintaining the confidentiality of your login
          credentials and account.
        </li>
      </ul>

      <h2 className="text-xl font-semibold mt-8 mb-3">4. Prohibited use</h2>
      <p className="mb-2">You agree not to use the App to:</p>
      <ul className="list-disc pl-6 space-y-2 mb-6">
        <li>Send spam, bulk, or unsolicited communications.</li>
        <li>Harass, abuse, or defame any individual or organisation.</li>
        <li>Infringe any intellectual property or other rights.</li>
        <li>
          Interfere with or disrupt the security, integrity, or performance of
          the App.
        </li>
      </ul>

      <h2 className="text-xl font-semibold mt-8 mb-3">
        5. Intellectual property
      </h2>
      <p className="mb-6">
        All intellectual property rights in the App, including but not limited
        to software, branding, and design, are owned by or licensed to IO Shield
        Ltd. You are granted a limited, non-transferable licence to use the App
        solely for its intended purpose.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">6. Availability</h2>
      <p className="mb-6">
        We aim to provide a reliable service but do not guarantee uninterrupted
        availability. We may suspend, withdraw, or modify all or part of the App
        without notice, including for maintenance or security reasons.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">
        7. Limitation of liability
      </h2>
      <p className="mb-6">
        To the maximum extent permitted by law, IO Shield Ltd is not liable for
        any indirect, incidental, special, or consequential damages arising out
        of your use of the App. Our total liability for direct damages will not
        exceed the amount you have paid to us (if any) in the 12 months
        preceding the claim.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">8. Indemnity</h2>
      <p className="mb-6">
        You agree to indemnify and hold harmless IO Shield Ltd from any claims,
        damages, or expenses arising from your use of the App, including your
        automated messages and any breach of these Terms.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">9. Termination</h2>
      <p className="mb-6">
        We may suspend or terminate your access to the App at any time if you
        breach these Terms or misuse the service. You may stop using the App at
        any time by uninstalling or disabling it.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">10. Data protection</h2>
      <p className="mb-6">
        Our collection and use of personal data is described in our{" "}
        <a
          href="https://swiftreply.app/privacy"
          className="underline decoration-slate-400 hover:decoration-slate-700"
        >
          Privacy Policy
        </a>
        , which forms part of these Terms.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">
        11. Changes to these Terms
      </h2>
      <p className="mb-6">
        We may update these Terms from time to time. The latest version will
        always be available at{" "}
        <a
          href="https://swiftreply.app/terms"
          className="underline decoration-slate-400 hover:decoration-slate-700"
        >
          https://swiftreply.app/terms
        </a>
        , with the effective date shown at the top. If changes are material, we
        may also notify you by email or within the App.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">12. Governing law</h2>
      <p className="mb-6">
        These Terms are governed by and construed in accordance with the laws of
        England and Wales. Any disputes shall be subject to the exclusive
        jurisdiction of the courts of England and Wales.
      </p>

      <h2 className="text-xl font-semibold mt-8 mb-3">13. Contact us</h2>
      <p className="mb-6">
        If you have any questions about these Terms, please contact us at{" "}
        <a
          href="mailto:hello@swiftreply.app"
          className="underline decoration-slate-400 hover:decoration-slate-700"
        >
          hello@swiftreply.app
        </a>
        .
      </p>

      <p className="mt-10 text-xs text-slate-500">
        These Terms are provided for general information and do not constitute
        legal advice.
      </p>
    </Container>
  );
}
