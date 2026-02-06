import { notFound } from "next/navigation";
import Image from "next/image";
import type { Metadata } from "next";
import {
  Calendar,
  CheckCircle,
  Shield,
  Clock,
  Key,
  Settings,
  ExternalLink,
  Copy,
  Building,
  Mail,
  Lock,
} from "lucide-react";
import getPartnerFromHeaders from "@/lib/getPartnerFromHeaders";

export async function generateMetadata(): Promise<Metadata> {
  const partner = await getPartnerFromHeaders();

  if (!partner) {
    return {
      title: "Guide Not Found",
      description: "The requested guide could not be found.",
    };
  }

  const title = `How to Create a Google Calendar Integration App | ${partner.name}`;
  const description =
    "Step-by-step guide for Google Workspace admins to create an internal OAuth app for calendar integration.";

  const favicon =
    partner.domain && partner.logoFileExtension
      ? `https://s3.eu-west-1.wasabisys.com/voxd/partnerLogos/${partner.domain}.${partner.logoFileExtension}`
      : "/logo.svg";

  return {
    title,
    description,
    icons: {
      icon: favicon,
    },
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function GoogleCalendarGuidePage() {
  const partner = await getPartnerFromHeaders();

  if (!partner) {
    return notFound();
  }

  const brandColor = partner.colour ? `#${partner.colour}` : "#6366f1";
  const partnerLogoUrl =
    partner.domain && partner.logoFileExtension
      ? `https://s3.eu-west-1.wasabisys.com/voxd/partnerLogos/${partner.domain}.${partner.logoFileExtension}`
      : "/logo.svg";

  const callbackUrl = `https://${partner.domain}/api/auth/google/callback`;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with partner logo */}
      <header className="sticky top-0 z-50 py-4 px-4 bg-white border-b">
        <div className="max-w-3xl xl:max-w-6xl mx-auto flex items-center justify-center">
          <Image
            src={partnerLogoUrl}
            alt={partner.name || "Partner"}
            width={180}
            height={60}
            unoptimized
            className="h-8 sm:h-12 w-auto object-contain"
          />
        </div>
      </header>

      {/* Content wrapper */}
      <div className="max-w-3xl mx-auto px-4 py-8">
        <main className="space-y-8">
          {/* Title Section */}
          <section className="bg-white rounded-xl shadow-sm p-6 space-y-4">
            <div className="flex items-start gap-4">
              <div
                className="p-3 rounded-lg flex-shrink-0"
                style={{ backgroundColor: `${brandColor}15` }}
              >
                <Calendar className="h-8 w-8" style={{ color: brandColor }} />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                  How to Create an Internal Google Calendar Integration App
                </h1>
                <p className="text-gray-500 mt-2">
                  A guide for Google Workspace admins
                </p>
              </div>
            </div>

            <p className="text-gray-700">
              This guide walks you through creating a private
              (&ldquo;internal&rdquo;) Google OAuth app inside your own Google
              Workspace tenant so {partner.name} can connect securely to your
              calendars.
            </p>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-800 font-medium mb-2">
                Because this app is marked Internal, it:
              </p>
              <ul className="text-green-700 space-y-1 text-sm">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  Only works for users in your organisation
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  Does not require Google verification
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  Does not require public privacy policies or Terms of Service
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  Is owned and controlled entirely by you
                </li>
              </ul>
            </div>

            <div className="flex items-center gap-2 text-gray-600 text-sm">
              <Clock className="h-4 w-4" />
              <span>Typical setup time: 10–15 minutes</span>
            </div>
          </section>

          {/* Before you start */}
          <section className="bg-white rounded-xl shadow-sm p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div
                className="p-2 rounded-lg"
                style={{ backgroundColor: `${brandColor}15` }}
              >
                <CheckCircle
                  className="h-6 w-6"
                  style={{ color: brandColor }}
                />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Before you start
                </h2>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-gray-700 font-medium mb-2">
                  You&apos;ll need:
                </p>
                <ul className="text-gray-600 space-y-1 ml-4 list-disc">
                  <li>Google Workspace admin access</li>
                  <li>Permission to create projects in Google Cloud Console</li>
                </ul>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <p className="text-gray-700 font-medium">
                  These values are already defined:
                </p>

                <div className="space-y-2">
                  <div>
                    <span className="text-gray-500 text-sm">
                      Application name:
                    </span>
                    <p className="font-mono text-sm bg-white px-2 py-1 rounded border mt-1">
                      Chatbot Integration
                    </p>
                  </div>

                  <div>
                    <span className="text-gray-500 text-sm">
                      OAuth redirect (callback) URL:
                    </span>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="font-mono text-sm bg-white px-2 py-1.5 rounded border flex-1 break-all">
                        {callbackUrl}
                      </code>
                    </div>
                  </div>

                  <div>
                    <span className="text-gray-500 text-sm">
                      Scopes required:
                    </span>
                    <div className="font-mono text-sm bg-white px-2 py-1.5 rounded border mt-1 space-y-0.5">
                      <p>https://www.googleapis.com/auth/calendar</p>
                      <p>email</p>
                      <p>profile</p>
                    </div>
                    <p className="text-gray-500 text-xs mt-1">
                      (email and profile are standard OpenID scopes and are
                      required for identifying users.)
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Step 1 */}
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
                  Create a Google Cloud Project
                </h2>
              </div>
            </div>

            <ol className="space-y-3 text-gray-700">
              <li className="flex gap-3">
                <span className="text-gray-400 font-medium">1.</span>
                <span>
                  Go to{" "}
                  <a
                    href="https://console.cloud.google.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline inline-flex items-center gap-1"
                  >
                    console.cloud.google.com
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-gray-400 font-medium">2.</span>
                <span>
                  At the top, click the project dropdown and choose{" "}
                  <strong>New Project</strong>
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-gray-400 font-medium">3.</span>
                <span>
                  Name it something like:{" "}
                  <code className="bg-gray-100 px-1 rounded">
                    Chatbot Integration
                  </code>
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-gray-400 font-medium">4.</span>
                <span>
                  Click <strong>Create</strong>
                </span>
              </li>
            </ol>

            <p className="text-gray-600 text-sm italic">
              Wait a few seconds, then make sure your new project is selected.
            </p>
          </section>

          {/* Step 2 */}
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
                  Enable the Google Calendar API
                </h2>
              </div>
            </div>

            <ol className="space-y-3 text-gray-700">
              <li className="flex gap-3">
                <span className="text-gray-400 font-medium">1.</span>
                <span>
                  From the left menu, go to{" "}
                  <strong>APIs & Services → Library</strong>
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-gray-400 font-medium">2.</span>
                <span>
                  Search for <strong>Google Calendar API</strong>
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-gray-400 font-medium">3.</span>
                <span>Click it</span>
              </li>
              <li className="flex gap-3">
                <span className="text-gray-400 font-medium">4.</span>
                <span>
                  Click <strong>Enable</strong>
                </span>
              </li>
            </ol>
          </section>

          {/* Step 3 */}
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
                  Configure the OAuth Consent Screen (Internal App)
                </h2>
              </div>
            </div>

            <ol className="space-y-3 text-gray-700">
              <li className="flex gap-3">
                <span className="text-gray-400 font-medium">1.</span>
                <span>
                  Go to <strong>APIs & Services → OAuth consent screen</strong>
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-gray-400 font-medium">2.</span>
                <span>
                  Choose <strong>Internal</strong>
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-gray-400 font-medium">3.</span>
                <span>
                  Click <strong>Create</strong>
                </span>
              </li>
            </ol>

            <div className="bg-gray-50 rounded-lg p-4 space-y-4">
              <div>
                <p className="font-medium text-gray-900 mb-2">
                  Fill in - App information:
                </p>
                <div className="space-y-2 ml-4">
                  <div className="flex gap-2">
                    <span className="text-gray-500">App name:</span>
                    <code className="bg-white px-1 rounded">
                      Chatbot Integration
                    </code>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-gray-500">User support email:</span>
                    <span className="text-gray-700">
                      your admin email address
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <p className="font-medium text-gray-900 mb-2">
                  Developer contact information:
                </p>
                <p className="ml-4 text-gray-700">Your admin email address</p>
              </div>
            </div>

            <p className="text-gray-700">
              Click <strong>Save and Continue</strong>.
            </p>

            <div className="border-t pt-4">
              <p className="font-medium text-gray-900 mb-3">Scopes</p>
              <ol className="space-y-3 text-gray-700">
                <li className="flex gap-3">
                  <span className="text-gray-400 font-medium">1.</span>
                  <span>
                    Click <strong>Add or Remove Scopes</strong>
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="text-gray-400 font-medium">2.</span>
                  <div>
                    <span>Add:</span>
                    <div className="font-mono text-sm bg-gray-100 px-2 py-1.5 rounded mt-1 space-y-0.5">
                      <p>https://www.googleapis.com/auth/calendar</p>
                      <p>email</p>
                      <p>profile</p>
                    </div>
                  </div>
                </li>
              </ol>
              <p className="text-gray-700 mt-3">
                Click <strong>Update</strong>, then{" "}
                <strong>Save and Continue</strong>.
              </p>
              <p className="text-gray-600 text-sm mt-2">
                You can skip Test users (Internal apps do not need them).
              </p>
              <p className="text-gray-700 mt-2">
                Finish by clicking <strong>Back to Dashboard</strong>.
              </p>
            </div>
          </section>

          {/* Step 4 */}
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
                  Create OAuth Credentials
                </h2>
              </div>
            </div>

            <ol className="space-y-3 text-gray-700">
              <li className="flex gap-3">
                <span className="text-gray-400 font-medium">1.</span>
                <span>
                  Go to <strong>APIs & Services → Credentials</strong>
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-gray-400 font-medium">2.</span>
                <span>
                  Click <strong>Create Credentials → OAuth client ID</strong>
                </span>
              </li>
              <li className="flex gap-3">
                <span className="text-gray-400 font-medium">3.</span>
                <span>
                  Choose Application type: <strong>Web application</strong>
                </span>
              </li>
            </ol>

            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <p className="font-medium text-gray-900">Fill in:</p>
              <div className="space-y-2 ml-4">
                <div className="flex gap-2">
                  <span className="text-gray-500">Name:</span>
                  <code className="bg-white px-1 rounded">
                    Chatbot Integration
                  </code>
                </div>
                <div>
                  <span className="text-gray-500">
                    Authorized redirect URIs:
                  </span>
                  <code className="font-mono text-sm bg-white px-2 py-1.5 rounded border mt-1 block break-all">
                    {callbackUrl}
                  </code>
                </div>
              </div>
            </div>

            <p className="text-gray-700">
              Then click <strong>Create</strong>.
            </p>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-amber-800">A popup will appear showing:</p>
              <ul className="mt-2 space-y-1 text-amber-700">
                <li className="flex items-center gap-2">
                  <Key className="h-4 w-4" />
                  <strong>Client ID</strong>
                </li>
                <li className="flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  <strong>Client Secret</strong>
                </li>
              </ul>
              <p className="text-amber-800 mt-2 font-medium">
                Copy both of these somewhere safe.
              </p>
            </div>
          </section>

          {/* Final Step */}
          <section className="bg-white rounded-xl shadow-sm p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div
                className="p-2 rounded-lg"
                style={{ backgroundColor: `${brandColor}15` }}
              >
                <Mail className="h-6 w-6" style={{ color: brandColor }} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Final Step — Send These Details to {partner.name}
                </h2>
              </div>
            </div>

            <p className="text-gray-700">Please securely send us:</p>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="font-medium text-gray-900 mb-2">Required</p>
                <ul className="space-y-1 text-gray-700">
                  <li className="flex items-center gap-2">
                    <CheckCircle
                      className="h-4 w-4"
                      style={{ color: brandColor }}
                    />
                    Client ID
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle
                      className="h-4 w-4"
                      style={{ color: brandColor }}
                    />
                    Client Secret
                  </li>
                </ul>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <p className="font-medium text-gray-900 mb-2">
                  Helpful (optional)
                </p>
                <ul className="space-y-1 text-gray-600">
                  <li className="flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    Your Google Workspace domain (e.g., yourcompany.com)
                  </li>
                  <li className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Project name (for reference)
                  </li>
                </ul>
              </div>
            </div>

            <p className="text-gray-700">
              Once we receive these, we&apos;ll connect your internal app to our
              system and enable calendar syncing.
            </p>
          </section>

          {/* Security Notes */}
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
                  Security & Ownership Notes
                </h2>
              </div>
            </div>

            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start gap-2">
                <CheckCircle
                  className="h-4 w-4 mt-1 flex-shrink-0"
                  style={{ color: brandColor }}
                />
                This app belongs to your organisation
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle
                  className="h-4 w-4 mt-1 flex-shrink-0"
                  style={{ color: brandColor }}
                />
                Only users in your Workspace domain can authorise it
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle
                  className="h-4 w-4 mt-1 flex-shrink-0"
                  style={{ color: brandColor }}
                />
                You can revoke access at any time from Google Cloud Console
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle
                  className="h-4 w-4 mt-1 flex-shrink-0"
                  style={{ color: brandColor }}
                />
                {partner.name} never has access to your Google admin account
              </li>
            </ul>
          </section>

          {/* Summary */}
          <section
            className="rounded-xl shadow-sm p-6 space-y-4"
            style={{ backgroundColor: `${brandColor}10` }}
          >
            <h2 className="text-xl font-bold text-gray-900">Summary</h2>

            <p className="text-gray-700">You&apos;ve created:</p>

            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start gap-2">
                <CheckCircle
                  className="h-5 w-5 mt-0.5 flex-shrink-0"
                  style={{ color: brandColor }}
                />
                An internal OAuth application
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle
                  className="h-5 w-5 mt-0.5 flex-shrink-0"
                  style={{ color: brandColor }}
                />
                Limited to calendar access plus basic user identity
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle
                  className="h-5 w-5 mt-0.5 flex-shrink-0"
                  style={{ color: brandColor }}
                />
                Owned by your Workspace tenant
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle
                  className="h-5 w-5 mt-0.5 flex-shrink-0"
                  style={{ color: brandColor }}
                />
                With credentials {partner.name} can use to integrate with Google
                Calendar
              </li>
            </ul>

            <div
              className="flex items-center gap-2 font-medium text-lg mt-4"
              style={{ color: brandColor }}
            >
              <CheckCircle className="h-6 w-6" />
              Setup complete
            </div>
          </section>

          {/* Footer */}
          <footer className="flex justify-center py-8">
            <Image
              src={partnerLogoUrl}
              alt={partner.name || "Partner"}
              width={120}
              height={40}
              unoptimized
              className="h-8 w-auto object-contain opacity-50"
            />
          </footer>
        </main>
      </div>
    </div>
  );
}
