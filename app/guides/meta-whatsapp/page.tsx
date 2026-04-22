import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  BadgeCheck,
  Building2,
  CheckCircle,
  ExternalLink,
  MessageCircle,
  Shield,
  Users,
  Clock,
  AlertTriangle,
  KeyRound,
  Settings,
  Smartphone,
} from "lucide-react";
import getPartnerFromHeaders from "@/lib/getPartnerFromHeaders";
import PartnerGuideShell, {
  getPartnerGuideAssets,
  getPartnerGuideFavicon,
} from "@/components/guides/PartnerGuideShell";

const VOXD_BUSINESS_ID = "907472115074124";
const SETTINGS_URL = "https://business.facebook.com/latest/settings";
const SECURITY_CENTER_URL = "https://business.facebook.com/settings/security";
const BUSINESS_SUITE_URL = "https://business.facebook.com";

export async function generateMetadata(): Promise<Metadata> {
  const partner = await getPartnerFromHeaders();

  if (!partner) {
    return {
      title: "Guide Not Found",
      description: "The requested guide could not be found.",
    };
  }

  const title = `How to Set Up Meta Business and WhatsApp Business | ${partner.name}`;
  const description =
    "Step-by-step guide to create a Meta business portfolio, verify the business, create a WhatsApp Business Account, and give Voxd full control as a partner.";

  return {
    title,
    description,
    icons: {
      icon: getPartnerGuideFavicon(partner),
    },
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function MetaWhatsAppGuidePage() {
  const partner = await getPartnerFromHeaders();

  if (!partner) {
    return notFound();
  }

  const { brandColor } = getPartnerGuideAssets(partner);

  return (
    <PartnerGuideShell partner={partner}>
      <section className="bg-white rounded-xl shadow-sm p-6 space-y-4">
        <div className="flex items-start gap-4">
          <div
            className="p-3 rounded-lg flex-shrink-0"
            style={{ backgroundColor: `${brandColor}15` }}
          >
            <MessageCircle className="h-8 w-8" style={{ color: brandColor }} />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              How to Set Up Meta Business and WhatsApp Business
            </h1>
            <p className="text-gray-500 mt-2">
              A guide for business owners or admins setting up WhatsApp Business
              API access
            </p>
          </div>
        </div>

        <p className="text-gray-700">
          This guide walks you through creating or locating your Meta business
          portfolio, completing Meta business verification, creating your
          WhatsApp Business Account, and assigning {partner.name} as a partner
          with full control of that WABA.
        </p>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-800 font-medium mb-2">
            By the end of this guide, you will have:
          </p>
          <ul className="text-green-700 space-y-1 text-sm">
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />A Meta
              business portfolio that your organisation controls
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />A verified
              or in-review business identity on Meta
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />A WhatsApp
              Business Account (WABA) in your own Meta portfolio
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              {partner.name} connected as a partner with full control of the
              WABA
            </li>
          </ul>
        </div>

        <div className="flex items-center gap-2 text-gray-600 text-sm">
          <Clock className="h-4 w-4" />
          <span>
            Typical setup time: 20-45 minutes, plus up to 14 working days for
            Meta verification review
          </span>
        </div>
      </section>

      <section className="bg-white rounded-xl shadow-sm p-6 space-y-4">
        <div className="flex items-start gap-3">
          <div
            className="p-2 rounded-lg"
            style={{ backgroundColor: `${brandColor}15` }}
          >
            <CheckCircle className="h-6 w-6" style={{ color: brandColor }} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Before you start
            </h2>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <p className="text-gray-700 font-medium mb-2">You&apos;ll need:</p>
            <ul className="text-gray-600 space-y-1 ml-4 list-disc">
              <li>
                A Facebook profile or managed Meta account that can access Meta
                Business Suite
              </li>
              <li>Full control of your business portfolio in Meta</li>
              <li>
                Your legal business name, registered address, phone number, and
                website
              </li>
              <li>
                A live HTTPS website that clearly represents your business
              </li>
              <li>
                Access to company documents in case Meta asks you to upload
                proof
              </li>
            </ul>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <p className="text-gray-700 font-medium">
              Keep these details handy:
            </p>

            <div className="space-y-2">
              <div>
                <span className="text-gray-500 text-sm">
                  Voxd Meta business ID:
                </span>
                <p className="font-mono text-sm bg-white px-2 py-1 rounded border mt-1">
                  {VOXD_BUSINESS_ID}
                </p>
              </div>

              <div>
                <span className="text-gray-500 text-sm">
                  Meta Settings URL:
                </span>
                <p className="font-mono text-sm bg-white px-2 py-1 rounded border mt-1 break-all">
                  {SETTINGS_URL}
                </p>
              </div>

              <div>
                <span className="text-gray-500 text-sm">
                  Security Centre URL:
                </span>
                <p className="font-mono text-sm bg-white px-2 py-1 rounded border mt-1 break-all">
                  {SECURITY_CENTER_URL}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-amber-800 font-medium mb-2">Important</p>
            <ul className="text-amber-700 space-y-1 text-sm">
              <li className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                Meta changes labels and navigation often. If wording differs,
                use the closest matching business settings option.
              </li>
              <li className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                You must keep ownership of the WABA in your own business
                portfolio. Adding {partner.name} as a partner does not transfer
                ownership.
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section className="bg-white rounded-xl shadow-sm p-6 space-y-4">
        <div className="flex items-start gap-3">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
            style={{ backgroundColor: brandColor }}
          >
            1
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Create or access your Meta business portfolio
            </h2>
          </div>
        </div>

        <ol className="space-y-3 text-gray-700">
          <li className="flex gap-3">
            <span className="text-gray-400 font-medium">1.</span>
            <span>
              Go to{" "}
              <a
                href={BUSINESS_SUITE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline inline-flex items-center gap-1"
              >
                Meta Business Suite
                <ExternalLink className="h-3 w-3" />
              </a>
            </span>
          </li>
          <li className="flex gap-3">
            <span className="text-gray-400 font-medium">2.</span>
            <span>
              Log in with the Facebook profile or managed Meta account that will
              own the business assets
            </span>
          </li>
          <li className="flex gap-3">
            <span className="text-gray-400 font-medium">3.</span>
            <span>
              If you do not already have a business portfolio, use the account
              switcher in the top left and click{" "}
              <strong>Create a business portfolio</strong>
            </span>
          </li>
          <li className="flex gap-3">
            <span className="text-gray-400 font-medium">4.</span>
            <span>
              Name it after your business and confirm the business email address
              Meta asks for
            </span>
          </li>
        </ol>

        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
          <p className="font-medium text-gray-900">
            Use your real business details:
          </p>
          <ul className="space-y-1 text-gray-700">
            <li className="flex items-start gap-2">
              <Building2 className="h-4 w-4 mt-0.5 flex-shrink-0 text-gray-500" />
              Business portfolio name should match your public business identity
            </li>
            <li className="flex items-start gap-2">
              <Users className="h-4 w-4 mt-0.5 flex-shrink-0 text-gray-500" />
              Make sure at least one person in your organisation has full
              control
            </li>
          </ul>
        </div>

        <p className="text-gray-600 text-sm italic">
          If your organisation already has a Meta business portfolio, skip the
          creation step and make sure you are working in the correct one before
          continuing.
        </p>
      </section>

      <section className="bg-white rounded-xl shadow-sm p-6 space-y-4">
        <div className="flex items-start gap-3">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
            style={{ backgroundColor: brandColor }}
          >
            2
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Verify your business in Security Centre
            </h2>
          </div>
        </div>

        <ol className="space-y-3 text-gray-700">
          <li className="flex gap-3">
            <span className="text-gray-400 font-medium">1.</span>
            <span>
              Open{" "}
              <a
                href={SECURITY_CENTER_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline inline-flex items-center gap-1"
              >
                Security Centre
                <ExternalLink className="h-3 w-3" />
              </a>{" "}
              for the correct business portfolio
            </span>
          </li>
          <li className="flex gap-3">
            <span className="text-gray-400 font-medium">2.</span>
            <span>
              Click <strong>Start verification</strong> if Meta shows the option
            </span>
          </li>
          <li className="flex gap-3">
            <span className="text-gray-400 font-medium">3.</span>
            <span>
              Enter your legal business name, registered address, phone number,
              and website exactly as they appear on official records
            </span>
          </li>
          <li className="flex gap-3">
            <span className="text-gray-400 font-medium">4.</span>
            <span>
              If Meta cannot match your details automatically, choose the
              closest option or upload the documents it requests
            </span>
          </li>
          <li className="flex gap-3">
            <span className="text-gray-400 font-medium">5.</span>
            <span>
              Complete the confirmation method Meta offers, such as email,
              phone, text, WhatsApp, or domain verification
            </span>
          </li>
        </ol>

        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
          <p className="font-medium text-gray-900">
            What Meta checks most closely:
          </p>
          <ul className="space-y-1 text-gray-700">
            <li className="flex items-start gap-2">
              <BadgeCheck className="h-4 w-4 mt-0.5 flex-shrink-0 text-gray-500" />
              The website should load publicly over HTTPS
            </li>
            <li className="flex items-start gap-2">
              <BadgeCheck className="h-4 w-4 mt-0.5 flex-shrink-0 text-gray-500" />
              The business name and address must match your legal entity details
            </li>
            <li className="flex items-start gap-2">
              <BadgeCheck className="h-4 w-4 mt-0.5 flex-shrink-0 text-gray-500" />
              The person doing this must have full control of the business
              portfolio
            </li>
          </ul>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <p className="text-amber-800 font-medium mb-2">
            If you see “Ineligible for verification”
          </p>
          <p className="text-amber-700 text-sm">
            That does not always mean you are blocked. Meta sometimes requests
            verification later, when a product feature needs it. If you can
            continue to create the WABA, do so, and only come back to
            verification if Meta specifically requires it.
          </p>
        </div>
      </section>

      <section className="bg-white rounded-xl shadow-sm p-6 space-y-4">
        <div className="flex items-start gap-3">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
            style={{ backgroundColor: brandColor }}
          >
            3
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Create or locate your WhatsApp Business Account
            </h2>
          </div>
        </div>

        <ol className="space-y-3 text-gray-700">
          <li className="flex gap-3">
            <span className="text-gray-400 font-medium">1.</span>
            <span>
              In the same Meta business portfolio, open business settings and go
              to the WhatsApp-related section
            </span>
          </li>
          <li className="flex gap-3">
            <span className="text-gray-400 font-medium">2.</span>
            <span>
              Create a new <strong>WhatsApp Business Account</strong> if you do
              not already have one
            </span>
          </li>
          <li className="flex gap-3">
            <span className="text-gray-400 font-medium">3.</span>
            <span>
              Use your company name or the trading name you want attached to
              WhatsApp messaging
            </span>
          </li>
          <li className="flex gap-3">
            <span className="text-gray-400 font-medium">4.</span>
            <span>
              If Meta asks for more onboarding information, complete the basic
              business details and save the account
            </span>
          </li>
        </ol>

        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
          <p className="font-medium text-gray-900">
            What you need at this stage:
          </p>
          <ul className="space-y-1 text-gray-700">
            <li className="flex items-start gap-2">
              <Smartphone className="h-4 w-4 mt-0.5 flex-shrink-0 text-gray-500" />
              A WABA listed inside your own business portfolio
            </li>
            <li className="flex items-start gap-2">
              <Shield className="h-4 w-4 mt-0.5 flex-shrink-0 text-gray-500" />
              Ownership staying with your organisation, not transferred
              elsewhere
            </li>
          </ul>
        </div>

        <p className="text-gray-600 text-sm italic">
          Do not worry about the phone number, webhook, or app subscription in
          this guide. This page stops at the point where your WABA exists and
          can be shared with {partner.name}.
        </p>
      </section>

      <section className="bg-white rounded-xl shadow-sm p-6 space-y-4">
        <div className="flex items-start gap-3">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
            style={{ backgroundColor: brandColor }}
          >
            4
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Add {partner.name} as a partner and give full control of the WABA
            </h2>
          </div>
        </div>

        <ol className="space-y-3 text-gray-700">
          <li className="flex gap-3">
            <span className="text-gray-400 font-medium">1.</span>
            <span>
              Open{" "}
              <a
                href={SETTINGS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline inline-flex items-center gap-1"
              >
                Meta business settings
                <ExternalLink className="h-3 w-3" />
              </a>
            </span>
          </li>
          <li className="flex gap-3">
            <span className="text-gray-400 font-medium">2.</span>
            <span>
              In the left menu, open <strong>Users → Partners</strong>
            </span>
          </li>
          <li className="flex gap-3">
            <span className="text-gray-400 font-medium">3.</span>
            <span>
              Click <strong>Add</strong>, then choose{" "}
              <strong>Give a partner access to your assets</strong>
            </span>
          </li>
          <li className="flex gap-3">
            <span className="text-gray-400 font-medium">4.</span>
            <span>Enter Voxd&apos;s Meta business ID:</span>
          </li>
        </ol>

        <div className="font-mono text-sm bg-gray-100 px-3 py-2 rounded border break-all">
          {VOXD_BUSINESS_ID}
        </div>

        <ol start={5} className="space-y-3 text-gray-700">
          <li className="flex gap-3">
            <span className="text-gray-400 font-medium">5.</span>
            <span>
              Select the <strong>WhatsApp Business Account</strong> asset you
              want to share
            </span>
          </li>
          <li className="flex gap-3">
            <span className="text-gray-400 font-medium">6.</span>
            <span>
              Grant <strong>Full control</strong> for that WABA asset
            </span>
          </li>
          <li className="flex gap-3">
            <span className="text-gray-400 font-medium">7.</span>
            <span>
              Click <strong>Assign assets</strong> and approve the action if
              another admin in your business portfolio must confirm it
            </span>
          </li>
        </ol>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-800 font-medium mb-2">Why full control?</p>
          <p className="text-green-700 text-sm">
            Full control on the WABA lets {partner.name} manage the WhatsApp
            Business Account properly, while your organisation still owns the
            asset and can remove partner access later if needed.
          </p>
        </div>
      </section>

      <section className="bg-white rounded-xl shadow-sm p-6 space-y-4">
        <div className="flex items-start gap-3">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
            style={{ backgroundColor: brandColor }}
          >
            5
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Confirm the handoff is complete
            </h2>
          </div>
        </div>

        <ul className="space-y-2 text-gray-700">
          <li className="flex items-start gap-2">
            <CheckCircle
              className="h-4 w-4 mt-1 flex-shrink-0"
              style={{ color: brandColor }}
            />
            Your WABA is visible in your business portfolio
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle
              className="h-4 w-4 mt-1 flex-shrink-0"
              style={{ color: brandColor }}
            />
            Voxd appears in the partner list for the asset
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle
              className="h-4 w-4 mt-1 flex-shrink-0"
              style={{ color: brandColor }}
            />
            The permission level for the shared WABA is full control
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle
              className="h-4 w-4 mt-1 flex-shrink-0"
              style={{ color: brandColor }}
            />
            Ownership still shows under your business, not Voxd&apos;s
          </li>
        </ul>

        <div className="bg-gray-50 rounded-lg p-4 space-y-2">
          <p className="font-medium text-gray-900">
            Useful to send {partner.name} after this step:
          </p>
          <ul className="space-y-1 text-gray-700">
            <li className="flex items-start gap-2">
              <KeyRound className="h-4 w-4 mt-0.5 flex-shrink-0 text-gray-500" />
              Your WABA name or ID
            </li>
            <li className="flex items-start gap-2">
              <Settings className="h-4 w-4 mt-0.5 flex-shrink-0 text-gray-500" />
              Confirmation that Voxd has been added as partner with full control
            </li>
          </ul>
        </div>
      </section>

      <section className="bg-white rounded-xl shadow-sm p-6 space-y-4">
        <div className="flex items-start gap-3">
          <div
            className="p-2 rounded-lg"
            style={{ backgroundColor: `${brandColor}15` }}
          >
            <Shield className="h-6 w-6" style={{ color: brandColor }} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Notes and common blockers
            </h2>
          </div>
        </div>

        <ul className="space-y-2 text-gray-700">
          <li className="flex items-start gap-2">
            <AlertTriangle
              className="h-4 w-4 mt-1 flex-shrink-0"
              style={{ color: brandColor }}
            />
            If you cannot see the Partners menu, you probably do not have full
            control of the business portfolio.
          </li>
          <li className="flex items-start gap-2">
            <AlertTriangle
              className="h-4 w-4 mt-1 flex-shrink-0"
              style={{ color: brandColor }}
            />
            Another admin may need to approve asset sharing, depending on how
            your Meta setup is governed.
          </li>
          <li className="flex items-start gap-2">
            <AlertTriangle
              className="h-4 w-4 mt-1 flex-shrink-0"
              style={{ color: brandColor }}
            />
            Meta recommends enabling two-factor authentication on the business
            portfolio before sharing assets.
          </li>
          <li className="flex items-start gap-2">
            <AlertTriangle
              className="h-4 w-4 mt-1 flex-shrink-0"
              style={{ color: brandColor }}
            />
            If you edit core legal business details after verification, Meta may
            require you to verify again.
          </li>
        </ul>
      </section>

      <section
        className="rounded-xl shadow-sm p-6 space-y-4"
        style={{ backgroundColor: `${brandColor}10` }}
      >
        <h2 className="text-xl font-bold text-gray-900">Summary</h2>

        <ul className="space-y-2 text-gray-700">
          <li className="flex items-start gap-2">
            <CheckCircle
              className="h-5 w-5 mt-0.5 flex-shrink-0"
              style={{ color: brandColor }}
            />
            Your organisation owns the Meta business portfolio and the WABA
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle
              className="h-5 w-5 mt-0.5 flex-shrink-0"
              style={{ color: brandColor }}
            />
            Your business verification is submitted or complete
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle
              className="h-5 w-5 mt-0.5 flex-shrink-0"
              style={{ color: brandColor }}
            />
            {partner.name} has partner access with full control of the WABA
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle
              className="h-5 w-5 mt-0.5 flex-shrink-0"
              style={{ color: brandColor }}
            />
            You are ready for the next technical setup steps with {partner.name}
          </li>
        </ul>

        <div
          className="flex items-center gap-2 font-medium text-lg mt-4"
          style={{ color: brandColor }}
        >
          <CheckCircle className="h-6 w-6" />
          WABA access handoff complete
        </div>
      </section>
    </PartnerGuideShell>
  );
}
