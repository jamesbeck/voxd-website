import Image from "next/image";
import {
  MessageSquare,
  Globe,
  Smartphone,
  MousePointerClick,
} from "lucide-react";

export default function DemoWebsite({
  orgName,
  logoUrl,
  logoBgColour,
  primaryColour,
  children,
}: {
  orgName: string;
  logoUrl: string | null;
  logoBgColour: string;
  primaryColour: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-gray-200 shadow-sm">
        <div
          className="flex items-center justify-between px-6 py-3"
          style={{ backgroundColor: logoBgColour }}
        >
          <div className="flex items-center gap-3">
            {logoUrl ? (
              <Image
                src={logoUrl}
                alt={orgName}
                width={140}
                height={40}
                className="h-10 w-auto object-contain"
                unoptimized
              />
            ) : (
              <span className="text-xl font-bold">{orgName}</span>
            )}
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
            <span className="cursor-default text-gray-700 hover:text-gray-900 transition-colors">
              Home
            </span>
            <span className="cursor-default text-gray-700 hover:text-gray-900 transition-colors">
              Services
            </span>
            <span className="cursor-default text-gray-700 hover:text-gray-900 transition-colors">
              About
            </span>
            <span className="cursor-default text-gray-700 hover:text-gray-900 transition-colors">
              Contact
            </span>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section
        className="relative overflow-hidden"
        style={{ backgroundColor: primaryColour }}
      >
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-72 h-72 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 rounded-full bg-white blur-3xl" />
        </div>
        <div className="relative max-w-6xl mx-auto px-6 py-24 md:py-32 text-center text-white">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
            Sample Website
          </h1>
          <p className="text-lg md:text-xl max-w-2xl mx-auto opacity-90 mb-10">
            This is a sample website demonstrating how a chatbot integration
            could look on your site. Try the chat assistant in the bottom-right
            corner to see it in action.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <span
              className="inline-block px-8 py-3 bg-white font-semibold rounded-lg shadow-lg cursor-default"
              style={{ color: primaryColour }}
            >
              Sample Button
            </span>
            <span className="inline-block px-8 py-3 border-2 border-white text-white font-semibold rounded-lg cursor-default">
              Sample Link
            </span>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold mb-4">
            How the Chatbot Integration Works
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            This preview shows how an AI-powered chatbot can be embedded into
            any website, providing instant support for your visitors.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            {
              icon: MessageSquare,
              title: "Instant Responses",
              desc: "The chatbot provides immediate answers to visitor questions, available around the clock.",
            },
            {
              icon: MousePointerClick,
              title: "Easy to Embed",
              desc: "A simple code snippet is all it takes to add the chatbot to any page on your website.",
            },
            {
              icon: Globe,
              title: "Works Everywhere",
              desc: "The chat assistant works seamlessly across desktop and mobile browsers.",
            },
            {
              icon: Smartphone,
              title: "WhatsApp Integration",
              desc: "Connect the same AI assistant to WhatsApp for a unified customer experience.",
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className="bg-gray-50 rounded-xl p-6 text-center hover:shadow-md transition-shadow"
            >
              <div
                className="w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4"
                style={{ backgroundColor: `${primaryColour}15` }}
              >
                <feature.icon
                  className="w-6 h-6"
                  style={{ color: primaryColour }}
                />
              </div>
              <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
              <p className="text-gray-600 text-sm">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Info Banner */}
      <section style={{ backgroundColor: `${primaryColour}08` }}>
        <div className="max-w-4xl mx-auto px-6 py-16 text-center">
          <h2 className="text-2xl font-bold mb-4">This Is a Sample Website</h2>
          <p className="text-gray-600 max-w-2xl mx-auto mb-2">
            The content on this page is placeholder text. This site exists
            purely to demonstrate how a chatbot looks and feels when embedded
            into a real web page.
          </p>
          <p className="text-gray-500 text-sm">
            Try clicking the chat icon in the bottom-right corner to interact
            with the AI assistant.
          </p>
        </div>
      </section>

      {/* Testimonial */}
      <section className="max-w-4xl mx-auto px-6 py-20 text-center">
        <blockquote className="text-xl md:text-2xl text-gray-700 italic mb-6">
          &ldquo;This is a preview of how the chatbot will appear on your
          website. The page layout, navigation, and content are all
          placeholders.&rdquo;
        </blockquote>
        <p className="text-gray-500 font-medium">— Sample Website Preview</p>
      </section>

      {/* CTA Section */}
      <section
        className="text-center text-white py-16"
        style={{ backgroundColor: primaryColour }}
      >
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-3xl font-bold mb-4">Try the Chat Assistant</h2>
          <p className="opacity-90 mb-8">
            Click the chat icon in the bottom-right corner of this page to see
            the AI assistant in action. This is exactly how it would appear on
            your own website.
          </p>
          <span
            className="inline-block px-8 py-3 bg-white font-semibold rounded-lg shadow-lg cursor-default"
            style={{ color: primaryColour }}
          >
            Sample Button
          </span>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6 py-10 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 opacity-60">
            {logoUrl ? (
              <Image
                src={logoUrl}
                alt={orgName}
                width={100}
                height={30}
                className="h-8 w-auto object-contain"
                unoptimized
              />
            ) : (
              <span className="font-semibold">{orgName}</span>
            )}
          </div>
          <p className="text-gray-400 text-sm">
            Sample website for chatbot preview purposes only.
          </p>
        </div>
      </footer>

      {/* Chatbot Embed */}
      {children}
    </div>
  );
}
