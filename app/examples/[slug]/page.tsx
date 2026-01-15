import { notFound } from "next/navigation";
import { headers } from "next/headers";
import Image from "next/image";
import type { Metadata } from "next";
import { FileText, MessageSquare } from "lucide-react";
import { getExampleForPublic } from "@/lib/getExampleForPublic";
import ExampleConversationsAccordion from "@/components/ExampleConversationsAccordion";
import FloatingTableOfContents from "../../previews/[exampleId]/FloatingTableOfContents";
import { MarkdownContent } from "@/components/MarkdownContent";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const example = await getExampleForPublic({ slug });

  if (!example) {
    return {
      title: "Example Not Found",
      description: "The requested example could not be found.",
    };
  }

  const title = `${example.title} | ${example.partner.name}`;
  const description =
    example.short ||
    `See how ${example.businessName} uses AI chatbots on WhatsApp`;

  // Use hero image as OG image (best for social sharing), fall back to logo, then partner logo
  const ogImage = example.heroImageFileExtension
    ? `https://${process.env.NEXT_PUBLIC_WASABI_ENDPOINT}/voxd/exampleImages/${example.id}.${example.heroImageFileExtension}`
    : example.logoFileExtension
    ? `https://${process.env.NEXT_PUBLIC_WASABI_ENDPOINT}/voxd/exampleLogos/${example.id}.${example.logoFileExtension}`
    : example.partner.domain
    ? `https://s3.eu-west-1.wasabisys.com/voxd/partnerLogos/${example.partner.domain}`
    : null;

  // Get current host from request headers
  const headersList = await headers();
  const host = headersList.get("host") || "voxd.io";
  const protocol = host.includes("localhost") ? "http" : "https";
  const pageUrl = `${protocol}://${host}/examples/${slug}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      url: pageUrl,
      siteName: example.partner.name,
      ...(ogImage && {
        images: [
          {
            url: ogImage,
            width: 1200,
            height: 630,
            alt: `${example.businessName} Logo`,
          },
        ],
      }),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(ogImage && {
        images: [ogImage],
      }),
    },
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function ExamplesPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const example = await getExampleForPublic({ slug });

  if (!example) {
    return notFound();
  }

  const brandColor = example.partner.colour
    ? `#${example.partner.colour}`
    : "#6366f1";
  const partnerLogoUrl = example.partner.domain
    ? `https://s3.eu-west-1.wasabisys.com/voxd/partnerLogos/${example.partner.domain}`
    : "/logo.svg";

  const exampleLogoUrl = example.logoFileExtension
    ? `https://${process.env.NEXT_PUBLIC_WASABI_ENDPOINT}/voxd/exampleLogos/${example.id}.${example.logoFileExtension}`
    : null;

  const sections = [
    { id: "overview", label: "Overview", icon: "FileText" as const },
    ...(example.exampleConversations.length > 0
      ? [
          {
            id: "examples",
            label: "Examples",
            icon: "MessageSquare" as const,
          },
        ]
      : []),
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with partner logo */}
      <header className="py-8 px-4 bg-white border-b">
        <div className="max-w-3xl xl:max-w-6xl mx-auto flex items-center justify-center">
          <Image
            src={partnerLogoUrl}
            alt={example.partner.name}
            width={180}
            height={60}
            unoptimized
            className="h-12 w-auto object-contain"
          />
        </div>
      </header>

      {/* Hero Image */}
      {example.heroImageFileExtension && (
        <div className="relative w-full">
          <Image
            src={`https://${process.env.NEXT_PUBLIC_WASABI_ENDPOINT}/voxd/exampleImages/${example.id}.${example.heroImageFileExtension}`}
            alt={example.title}
            width={1920}
            height={600}
            unoptimized
            className="w-full h-[300px] md:h-[400px] object-cover"
          />
          {exampleLogoUrl && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Image
                src={exampleLogoUrl}
                alt={`${example.businessName} Logo`}
                width={300}
                height={300}
                unoptimized
                className="w-auto h-40 object-contain drop-shadow-2xl"
              />
            </div>
          )}
        </div>
      )}

      {/* Content wrapper with sidebar on desktop */}
      <div className="max-w-3xl xl:max-w-6xl mx-auto px-4 py-8 xl:flex xl:gap-8">
        {/* Desktop sticky ToC */}
        <FloatingTableOfContents sections={sections} brandColor={brandColor} />

        {/* Main content */}
        <main className="flex-1 max-w-3xl space-y-8">
          {/* Overview Section */}
          <section
            id="overview"
            className="bg-white rounded-xl shadow-sm p-6 space-y-6 scroll-mt-8"
          >
            <div className="flex items-start gap-3">
              <div
                className="p-2 rounded-lg"
                style={{ backgroundColor: `${brandColor}15` }}
              >
                <FileText className="h-6 w-6" style={{ color: brandColor }} />
              </div>
              <div className="flex-1">
                <h2 className="text-xl md:text-2xl font-bold text-gray-900">
                  {example.title}
                </h2>
                <p className="text-gray-500 text-sm mt-1">
                  {example.businessName}
                </p>
              </div>
            </div>

            <div className="space-y-6">
              {example.body ? (
                <div className="prose prose-gray max-w-none">
                  <MarkdownContent content={example.body} />
                </div>
              ) : (
                <p className="text-gray-500 italic">
                  Details are being prepared. Please check back soon.
                </p>
              )}
            </div>
          </section>

          {/* Example Conversations Section */}
          {example.exampleConversations.length > 0 && (
            <section
              id="examples"
              className="bg-white rounded-xl shadow-sm p-6 space-y-6 scroll-mt-8"
            >
              <div className="flex items-start gap-3">
                <div
                  className="p-2 rounded-lg"
                  style={{ backgroundColor: `${brandColor}15` }}
                >
                  <MessageSquare
                    className="h-6 w-6"
                    style={{ color: brandColor }}
                  />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Example Conversations
                  </h2>
                  <p className="text-gray-500 text-sm mt-1">
                    See how this chatbot interacts with users
                  </p>
                </div>
              </div>

              <ExampleConversationsAccordion
                conversations={example.exampleConversations}
                businessName={example.businessName}
                brandColor={brandColor}
                exampleId={example.id}
                logoFileExtension={example.logoFileExtension}
              />
            </section>
          )}

          {/* Footer */}
          <footer className="text-center py-8 text-sm text-gray-500">
            <p>
              Powered by{" "}
              <span className="font-medium">{example.partner.name}</span>
            </p>
          </footer>
        </main>
      </div>
    </div>
  );
}
