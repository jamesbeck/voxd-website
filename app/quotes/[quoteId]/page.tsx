import { notFound } from "next/navigation";
import { format } from "date-fns";
import Link from "next/link";
import Image from "next/image";
import {
  FileText,
  Calendar,
  Building,
  User,
  CheckCircle,
  Clock,
  Rocket,
  BookOpen,
  HelpCircle,
  FileCheck,
  ArrowRight,
  MessageSquare,
  LayoutDashboard,
  Smartphone,
  Users,
  PauseCircle,
  Send,
  BarChart3,
  Eye,
  Bot,
  Download,
  ThumbsUp,
  Wrench,
  Sparkles,
  Shield,
  Headphones,
  Zap,
  RefreshCw,
  Lock,
} from "lucide-react";
import { getQuoteForPublic } from "@/lib/getQuoteForPublic";
import ExampleConversationsAccordion from "./ExampleConversationsAccordion";
import FloatingTableOfContents from "./FloatingTableOfContents";
import { MarkdownContent } from "@/components/MarkdownContent";

export default async function PublicQuotePage({
  params,
}: {
  params: { quoteId: string };
}) {
  const quoteId = (await params).quoteId;
  const quote = await getQuoteForPublic({ quoteId });

  if (!quote) {
    return notFound();
  }

  const brandColor = quote.partner.colour
    ? `#${quote.partner.colour}`
    : "#6366f1";
  const logoUrl = quote.partner.domain
    ? `https://s3.eu-west-1.wasabisys.com/voxd/partnerLogos/${quote.partner.domain}`
    : "/logo.svg";

  const sections = [
    { id: "introduction", label: "Introduction", icon: "FileText" as const },
    { id: "specification", label: "Specification", icon: "BookOpen" as const },
    {
      id: "portal",
      label: "Management Portal",
      icon: "LayoutDashboard" as const,
    },
    { id: "service", label: "The Voxd Service", icon: "Wrench" as const },
    ...(quote.exampleConversations.length > 0
      ? [
          {
            id: "examples",
            label: "Examples",
            icon: "MessageSquare" as const,
          },
        ]
      : []),
    ...(quote.setupFee !== null || quote.monthlyFee !== null
      ? [{ id: "pricing", label: "Investment", icon: "FileCheck" as const }]
      : []),
    { id: "next-steps", label: "Next Steps", icon: "Rocket" as const },
    { id: "resources", label: "Resources", icon: "HelpCircle" as const },
    { id: "sign-contract", label: "Sign Contract", icon: "FileCheck" as const },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with partner logo */}
      <header className="py-8 px-4 bg-white border-b">
        <div className="max-w-3xl xl:max-w-6xl mx-auto flex justify-center xl:justify-start xl:pl-[290px]">
          <Image
            src={logoUrl}
            alt={quote.partner.name}
            width={180}
            height={60}
            unoptimized
            className="h-12 w-auto object-contain"
          />
        </div>
      </header>

      {/* Content wrapper with sidebar on desktop */}
      <div className="max-w-3xl xl:max-w-6xl mx-auto px-4 py-8 xl:flex xl:gap-8">
        {/* Desktop sticky ToC */}
        <FloatingTableOfContents sections={sections} brandColor={brandColor} />

        {/* Main content */}
        <main className="flex-1 max-w-3xl space-y-8">
          {/* Introduction Section */}
          <section
            id="introduction"
            className="bg-white rounded-xl shadow-sm p-6 space-y-6 scroll-mt-8"
          >
            <div className="flex items-start gap-3">
              <div
                className="p-2 rounded-lg"
                style={{ backgroundColor: `${brandColor}15` }}
              >
                <FileText className="h-6 w-6" style={{ color: brandColor }} />
              </div>
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-gray-900">
                  {quote.title}
                </h2>
                <p className="text-gray-500 text-sm mt-1">
                  AI Chatbot Implementation Proposal
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-gray-500">Date Created</p>
                  <p className="font-medium text-gray-900">
                    {format(new Date(quote.createdAt), "dd MMMM yyyy")}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-sm">
                <Building className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-gray-500">Prepared For</p>
                  <p className="font-medium text-gray-900">
                    {quote.organisationName}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-sm">
                <User className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-gray-500">Prepared By</p>
                  <p className="font-medium text-gray-900">
                    {quote.createdBy?.name || quote.partner.name}
                  </p>
                  {quote.createdBy?.email && (
                    <p className="text-gray-500 text-xs">
                      {quote.createdBy.email}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="border-t pt-6">
              {quote.generatedIntroduction ? (
                <div className="prose prose-gray max-w-none">
                  <MarkdownContent content={quote.generatedIntroduction} />
                </div>
              ) : (
                <p className="text-gray-500 italic">
                  Introduction is being prepared. Please check back soon.
                </p>
              )}
            </div>
          </section>

          {/* Specification Section */}
          <section
            id="specification"
            className="bg-white rounded-xl shadow-sm p-6 space-y-6 scroll-mt-8"
          >
            <div className="flex items-start gap-3">
              <div
                className="p-2 rounded-lg"
                style={{ backgroundColor: `${brandColor}15` }}
              >
                <BookOpen className="h-6 w-6" style={{ color: brandColor }} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Specification
                </h2>
                <p className="text-gray-500 text-sm mt-1">
                  Details of your custom chatbot
                </p>
              </div>
            </div>

            <div className="space-y-6">
              {quote.generatedSpecification ? (
                <div className="prose prose-gray max-w-none">
                  <MarkdownContent content={quote.generatedSpecification} />
                </div>
              ) : (
                <p className="text-gray-500 italic">
                  Specification details are being finalised. Please check back
                  soon.
                </p>
              )}
            </div>
          </section>

          {/* Voxd Portal Section */}
          <section
            id="portal"
            className="bg-white rounded-xl shadow-sm p-6 space-y-6 scroll-mt-8"
          >
            <div className="flex items-start gap-3">
              <div
                className="p-2 rounded-lg"
                style={{ backgroundColor: `${brandColor}15` }}
              >
                <LayoutDashboard
                  className="h-6 w-6"
                  style={{ color: brandColor }}
                />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Voxd Management Portal
                </h2>
                <p className="text-gray-500 text-sm mt-1">
                  Included with every chatbot
                </p>
              </div>
            </div>

            <p className="text-gray-600">
              Every chatbot comes with full access to the Voxd management
              portal, giving you complete visibility and control over your AI
              assistant.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
                <Smartphone
                  className="h-5 w-5 mt-0.5 flex-shrink-0"
                  style={{ color: brandColor }}
                />
                <div>
                  <p className="font-medium text-gray-900 text-sm">
                    Access Anywhere
                  </p>
                  <p className="text-gray-500 text-xs mt-0.5">
                    Mobile-friendly portal accessible from any device
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
                <Users
                  className="h-5 w-5 mt-0.5 flex-shrink-0"
                  style={{ color: brandColor }}
                />
                <div>
                  <p className="font-medium text-gray-900 text-sm">
                    Unlimited Admin Users
                  </p>
                  <p className="text-gray-500 text-xs mt-0.5">
                    Add as many team members as you need
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
                <PauseCircle
                  className="h-5 w-5 mt-0.5 flex-shrink-0"
                  style={{ color: brandColor }}
                />
                <div>
                  <p className="font-medium text-gray-900 text-sm">
                    Pause & Takeover
                  </p>
                  <p className="text-gray-500 text-xs mt-0.5">
                    Pause AI replies and manually interact with users
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
                <Send
                  className="h-5 w-5 mt-0.5 flex-shrink-0"
                  style={{ color: brandColor }}
                />
                <div>
                  <p className="font-medium text-gray-900 text-sm">
                    Template Messages
                  </p>
                  <p className="text-gray-500 text-xs mt-0.5">
                    Send pre-approved messages to individuals or groups
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
                <BarChart3
                  className="h-5 w-5 mt-0.5 flex-shrink-0"
                  style={{ color: brandColor }}
                />
                <div>
                  <p className="font-medium text-gray-900 text-sm">
                    Usage Analytics
                  </p>
                  <p className="text-gray-500 text-xs mt-0.5">
                    Charts and graphs showing usage statistics
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
                <Eye
                  className="h-5 w-5 mt-0.5 flex-shrink-0"
                  style={{ color: brandColor }}
                />
                <div>
                  <p className="font-medium text-gray-900 text-sm">
                    User Insights
                  </p>
                  <p className="text-gray-500 text-xs mt-0.5">
                    View all users and captured information
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
                <MessageSquare
                  className="h-5 w-5 mt-0.5 flex-shrink-0"
                  style={{ color: brandColor }}
                />
                <div>
                  <p className="font-medium text-gray-900 text-sm">
                    Conversation Analysis
                  </p>
                  <p className="text-gray-500 text-xs mt-0.5">
                    View raw conversations and AI decision-making details
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
                <Bot
                  className="h-5 w-5 mt-0.5 flex-shrink-0"
                  style={{ color: brandColor }}
                />
                <div>
                  <p className="font-medium text-gray-900 text-sm">
                    AI Workers
                  </p>
                  <p className="text-gray-500 text-xs mt-0.5">
                    Monitor AI workers analysing and actioning conversations
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
                <Download
                  className="h-5 w-5 mt-0.5 flex-shrink-0"
                  style={{ color: brandColor }}
                />
                <div>
                  <p className="font-medium text-gray-900 text-sm">
                    Data Export
                  </p>
                  <p className="text-gray-500 text-xs mt-0.5">
                    Export all your data whenever you need it
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
                <ThumbsUp
                  className="h-5 w-5 mt-0.5 flex-shrink-0"
                  style={{ color: brandColor }}
                />
                <div>
                  <p className="font-medium text-gray-900 text-sm">
                    Feedback & Training
                  </p>
                  <p className="text-gray-500 text-xs mt-0.5">
                    Give feedback on messages to help your bot improve
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* The Voxd Service Section */}
          <section
            id="service"
            className="bg-white rounded-xl shadow-sm p-6 space-y-6 scroll-mt-8"
          >
            <div className="flex items-start gap-3">
              <div
                className="p-2 rounded-lg"
                style={{ backgroundColor: `${brandColor}15` }}
              >
                <Wrench className="h-6 w-6" style={{ color: brandColor }} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  The Voxd Service
                </h2>
                <p className="text-gray-500 text-sm mt-1">
                  What we proactively do for you
                </p>
              </div>
            </div>

            <p className="text-gray-600">
              Beyond the technology, Voxd provides an ongoing managed service to
              ensure your chatbot continues to deliver exceptional results.
            </p>

            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 rounded-lg border border-gray-100">
                <Bot
                  className="h-5 w-5 mt-0.5 flex-shrink-0"
                  style={{ color: brandColor }}
                />
                <div>
                  <p className="font-medium text-gray-900 text-sm">
                    AI Agent Development
                  </p>
                  <p className="text-gray-500 text-sm mt-1">
                    Build and maintain an appropriate set of AI agents to
                    deliver the functionality outlined in the specification.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 rounded-lg border border-gray-100">
                <Sparkles
                  className="h-5 w-5 mt-0.5 flex-shrink-0"
                  style={{ color: brandColor }}
                />
                <div>
                  <p className="font-medium text-gray-900 text-sm">
                    Expert Consultancy
                  </p>
                  <p className="text-gray-500 text-sm mt-1">
                    Become an expert consultant for your business, working with
                    your team to ensure the correct contextual data is available
                    to the bot.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 rounded-lg border border-gray-100">
                <Shield
                  className="h-5 w-5 mt-0.5 flex-shrink-0"
                  style={{ color: brandColor }}
                />
                <div>
                  <p className="font-medium text-gray-900 text-sm">
                    Reliable 24/7 Service
                  </p>
                  <p className="text-gray-500 text-sm mt-1">
                    Maintain the system and provide a continuous, reliable,
                    secure service available around the clock.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 rounded-lg border border-gray-100">
                <Headphones
                  className="h-5 w-5 mt-0.5 flex-shrink-0"
                  style={{ color: brandColor }}
                />
                <div>
                  <p className="font-medium text-gray-900 text-sm">
                    Agreed SLA Support
                  </p>
                  <p className="text-gray-500 text-sm mt-1">
                    8 working hour response time guaranteed, although we almost
                    always respond much sooner.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 rounded-lg border border-gray-100">
                <Zap
                  className="h-5 w-5 mt-0.5 flex-shrink-0"
                  style={{ color: brandColor }}
                />
                <div>
                  <p className="font-medium text-gray-900 text-sm">
                    Cutting-Edge Technology
                  </p>
                  <p className="text-gray-500 text-sm mt-1">
                    Keep pace with the fast-moving LLM landscape—we implement
                    the latest models from providers as they&apos;re released,
                    so your bot is always as capable as technology allows.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 rounded-lg border border-gray-100">
                <RefreshCw
                  className="h-5 w-5 mt-0.5 flex-shrink-0"
                  style={{ color: brandColor }}
                />
                <div>
                  <p className="font-medium text-gray-900 text-sm">
                    Updates & Patches
                  </p>
                  <p className="text-gray-500 text-sm mt-1">
                    Apply code updates and security patches to keep your system
                    running smoothly and securely.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 rounded-lg border border-gray-100">
                <Lock
                  className="h-5 w-5 mt-0.5 flex-shrink-0"
                  style={{ color: brandColor }}
                />
                <div>
                  <p className="font-medium text-gray-900 text-sm">
                    Enterprise Security
                  </p>
                  <p className="text-gray-500 text-sm mt-1">
                    Keep all data secure with regular penetration testing and
                    progression towards ISO 27001 and ISO 42001 certification.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Example Conversations Section */}
          {quote.exampleConversations.length > 0 && (
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
                    See how your chatbot could interact with customers
                  </p>
                </div>
              </div>

              <ExampleConversationsAccordion
                conversations={quote.exampleConversations}
                organisationName={quote.organisationName}
                brandColor={brandColor}
              />
            </section>
          )}

          {/* Pricing Section */}
          {(quote.setupFee !== null || quote.monthlyFee !== null) && (
            <section
              id="pricing"
              className="bg-white rounded-xl shadow-sm p-6 space-y-6 scroll-mt-8"
            >
              <div className="flex items-start gap-3">
                <div
                  className="p-2 rounded-lg"
                  style={{ backgroundColor: `${brandColor}15` }}
                >
                  <FileCheck
                    className="h-6 w-6"
                    style={{ color: brandColor }}
                  />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Investment
                  </h2>
                  <p className="text-gray-500 text-sm mt-1">
                    Your chatbot pricing
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {quote.setupFee !== null && (
                  <div
                    className="p-4 rounded-lg border"
                    style={{ borderColor: `${brandColor}30` }}
                  >
                    <p className="text-sm text-gray-500">One-time Setup Fee</p>
                    <p
                      className="text-2xl font-bold"
                      style={{ color: brandColor }}
                    >
                      £{quote.setupFee.toLocaleString()}
                    </p>
                  </div>
                )}

                {quote.monthlyFee !== null && (
                  <div
                    className="p-4 rounded-lg border"
                    style={{ borderColor: `${brandColor}30` }}
                  >
                    <p className="text-sm text-gray-500">Monthly Fee</p>
                    <p
                      className="text-2xl font-bold"
                      style={{ color: brandColor }}
                    >
                      £{quote.monthlyFee.toLocaleString()}
                      <span className="text-sm font-normal text-gray-500">
                        /month
                      </span>
                    </p>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Next Steps Section */}
          <section
            id="next-steps"
            className="bg-white rounded-xl shadow-sm p-6 space-y-6 scroll-mt-8"
          >
            <div className="flex items-start gap-3">
              <div
                className="p-2 rounded-lg"
                style={{ backgroundColor: `${brandColor}15` }}
              >
                <Rocket className="h-6 w-6" style={{ color: brandColor }} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Next Steps</h2>
                <p className="text-gray-500 text-sm mt-1">
                  Your path to launch
                </p>
              </div>
            </div>

            <div className="space-y-6 ml-3">
              {/* Day 1 */}
              <div className="relative pl-8 pb-6 border-l-2 border-gray-200">
                <div
                  className="absolute -left-3 top-0 w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                  style={{ backgroundColor: brandColor }}
                >
                  1
                </div>
                <h3 className="font-semibold text-gray-900 mb-3">
                  Day 1 – Getting Started
                </h3>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2 text-sm text-gray-600">
                    <CheckCircle
                      className="h-4 w-4 mt-0.5 flex-shrink-0"
                      style={{ color: brandColor }}
                    />
                    Sign contract and direct debit mandate
                  </li>
                  <li className="flex items-start gap-2 text-sm text-gray-600">
                    <CheckCircle
                      className="h-4 w-4 mt-0.5 flex-shrink-0"
                      style={{ color: brandColor }}
                    />
                    Assign admin user(s) to manage your chatbot
                  </li>
                  <li className="flex items-start gap-2 text-sm text-gray-600">
                    <CheckCircle
                      className="h-4 w-4 mt-0.5 flex-shrink-0"
                      style={{ color: brandColor }}
                    />
                    Setup and verify Meta Business Profile & WhatsApp Business
                    Account (we can help with this)
                  </li>
                  <li className="flex items-start gap-2 text-sm text-gray-600">
                    <CheckCircle
                      className="h-4 w-4 mt-0.5 flex-shrink-0"
                      style={{ color: brandColor }}
                    />
                    Add Voxd as a partner on your WABA
                  </li>
                  <li className="flex items-start gap-2 text-sm text-gray-600">
                    <CheckCircle
                      className="h-4 w-4 mt-0.5 flex-shrink-0"
                      style={{ color: brandColor }}
                    />
                    Share LLM API key with Voxd
                  </li>
                  <li className="flex items-start gap-2 text-sm text-gray-600">
                    <CheckCircle
                      className="h-4 w-4 mt-0.5 flex-shrink-0"
                      style={{ color: brandColor }}
                    />
                    Share external systems access details or data
                  </li>
                </ul>
              </div>

              {/* Day 2 */}
              <div className="relative pl-8 pb-6 border-l-2 border-gray-200">
                <div
                  className="absolute -left-3 top-0 w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                  style={{ backgroundColor: brandColor }}
                >
                  2
                </div>
                <h3 className="font-semibold text-gray-900 mb-3">
                  Day 2 – Build
                </h3>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2 text-sm text-gray-600">
                    <Clock
                      className="h-4 w-4 mt-0.5 flex-shrink-0"
                      style={{ color: brandColor }}
                    />
                    Voxd builds your custom chatbot
                  </li>
                </ul>
              </div>

              {/* Day 3 */}
              <div className="relative pl-8 pb-6 border-l-2 border-gray-200">
                <div
                  className="absolute -left-3 top-0 w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                  style={{ backgroundColor: brandColor }}
                >
                  3
                </div>
                <h3 className="font-semibold text-gray-900 mb-3">
                  Day 3 – Test
                </h3>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2 text-sm text-gray-600">
                    <Clock
                      className="h-4 w-4 mt-0.5 flex-shrink-0"
                      style={{ color: brandColor }}
                    />
                    Test your chatbot and provide feedback
                  </li>
                </ul>
              </div>

              {/* Launch */}
              <div className="relative pl-8">
                <div
                  className="absolute -left-3 top-0 w-6 h-6 rounded-full flex items-center justify-center text-white"
                  style={{ backgroundColor: brandColor }}
                >
                  <Rocket className="h-3 w-3" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">🚀 Launch!</h3>
                <p className="text-sm text-gray-600">
                  Your AI chatbot goes live and starts helping your customers.
                </p>
              </div>
            </div>
          </section>

          {/* Resources Section */}
          <section
            id="resources"
            className="bg-white rounded-xl shadow-sm p-6 space-y-6 scroll-mt-8"
          >
            <div className="flex items-start gap-3">
              <div
                className="p-2 rounded-lg"
                style={{ backgroundColor: `${brandColor}15` }}
              >
                <HelpCircle className="h-6 w-6" style={{ color: brandColor }} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Resources</h2>
                <p className="text-gray-500 text-sm mt-1">
                  Learn more about our platform
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Link
                href="/"
                className="flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors"
              >
                <span className="font-medium text-gray-900">How It Works</span>
                <ArrowRight className="h-4 w-4 text-gray-400" />
              </Link>

              <Link
                href="/faq"
                className="flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors"
              >
                <span className="font-medium text-gray-900">FAQ</span>
                <ArrowRight className="h-4 w-4 text-gray-400" />
              </Link>

              <Link
                href="/terms"
                className="flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors"
              >
                <span className="font-medium text-gray-900">
                  Terms & Conditions
                </span>
                <ArrowRight className="h-4 w-4 text-gray-400" />
              </Link>

              <Link
                href="/privacy-policy"
                className="flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-colors"
              >
                <span className="font-medium text-gray-900">
                  Privacy Policy
                </span>
                <ArrowRight className="h-4 w-4 text-gray-400" />
              </Link>
            </div>
          </section>

          {/* CTA Section */}
          <section
            id="sign-contract"
            className="rounded-xl p-6 text-center space-y-4 scroll-mt-8"
            style={{ backgroundColor: `${brandColor}10` }}
          >
            <h2 className="text-xl font-bold text-gray-900">
              Ready to proceed?
            </h2>
            <p className="text-gray-600">
              Click below to sign the contract and set up your direct debit
              mandate.
            </p>
            <button
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-white font-semibold transition-opacity hover:opacity-90"
              style={{ backgroundColor: brandColor }}
            >
              <FileCheck className="h-5 w-5" />
              Sign Contract & Setup Payment
            </button>
            <p className="text-xs text-gray-500">
              You&apos;ll be redirected to our secure signing portal.
            </p>
          </section>

          {/* Footer */}
          <footer className="text-center py-8 text-sm text-gray-500">
            <p>
              Powered by{" "}
              <Link href="/" className="font-medium hover:underline">
                Voxd
              </Link>
            </p>
            <p className="mt-1">
              <Link href="/privacy-policy" className="hover:underline">
                Privacy Policy
              </Link>
              {" • "}
              <Link href="/terms" className="hover:underline">
                Terms of Service
              </Link>
            </p>
          </footer>
        </main>
      </div>
    </div>
  );
}
