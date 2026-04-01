import Image from "next/image";
import { Package, Zap, Shield, BarChart3 } from "lucide-react";

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
              Products
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
            Innovative Widget Solutions
          </h1>
          <p className="text-lg md:text-xl max-w-2xl mx-auto opacity-90 mb-10">
            Empowering businesses with next-generation widgets that streamline
            operations, boost productivity, and deliver measurable results.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <span
              className="inline-block px-8 py-3 bg-white font-semibold rounded-lg shadow-lg cursor-default"
              style={{ color: primaryColour }}
            >
              Get Started
            </span>
            <span className="inline-block px-8 py-3 border-2 border-white text-white font-semibold rounded-lg cursor-default">
              Learn More
            </span>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold mb-4">Why Choose Our Widgets?</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Our comprehensive widget platform delivers everything your business
            needs to stay ahead of the competition.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            {
              icon: Package,
              title: "Premium Quality",
              desc: "Crafted with the highest standards to ensure durability and performance in any environment.",
            },
            {
              icon: Zap,
              title: "Lightning Fast",
              desc: "Optimised for speed and efficiency, our widgets deliver results in record time.",
            },
            {
              icon: Shield,
              title: "Enterprise Secure",
              desc: "Built with security at the core, meeting the strictest industry compliance standards.",
            },
            {
              icon: BarChart3,
              title: "Data-Driven",
              desc: "Advanced analytics and reporting to help you make smarter business decisions.",
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

      {/* Stats Section */}
      <section style={{ backgroundColor: `${primaryColour}08` }}>
        <div className="max-w-6xl mx-auto px-6 py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: "10,000+", label: "Active Clients" },
              { value: "99.9%", label: "Uptime" },
              { value: "50M+", label: "Widgets Deployed" },
              { value: "24/7", label: "Support" },
            ].map((stat) => (
              <div key={stat.label}>
                <div
                  className="text-3xl md:text-4xl font-bold mb-1"
                  style={{ color: primaryColour }}
                >
                  {stat.value}
                </div>
                <div className="text-gray-600 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonial */}
      <section className="max-w-4xl mx-auto px-6 py-20 text-center">
        <blockquote className="text-xl md:text-2xl text-gray-700 italic mb-6">
          &ldquo;Switching to {orgName} widgets transformed our workflow. The
          quality and reliability are unmatched in the industry.&rdquo;
        </blockquote>
        <p className="text-gray-500 font-medium">
          — Alex Johnson, VP of Operations at TechCorp
        </p>
      </section>

      {/* CTA Section */}
      <section
        className="text-center text-white py-16"
        style={{ backgroundColor: primaryColour }}
      >
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Upgrade Your Widgets?
          </h2>
          <p className="opacity-90 mb-8">
            Join thousands of businesses already benefiting from our platform.
            Get started today with a free consultation.
          </p>
          <span
            className="inline-block px-8 py-3 bg-white font-semibold rounded-lg shadow-lg cursor-default"
            style={{ color: primaryColour }}
          >
            Request a Demo
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
            &copy; {new Date().getFullYear()} {orgName}. All rights reserved.
          </p>
        </div>
      </footer>

      {/* Chatbot Embed */}
      {children}
    </div>
  );
}
