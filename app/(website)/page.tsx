import Container from "@/components/websiteui/container";
import { getExamples } from "@/lib/getExamples";
import { MessageSquare } from "lucide-react";
import ExampleCarousel from "@/components/ExampleCarousel";
import saGetTopFeatures from "@/actions/saGetTopFeatures";
import { getIcon } from "@/lib/iconMap";
import Link from "next/link";

export default async function Home() {
  const allExamples = await getExamples();
  const examples = allExamples.filter(
    (ex) => ex.partnerId === "019a6ec7-43b1-7da4-a2d8-8c84acb387b4",
  );

  const features = await saGetTopFeatures();

  return (
    <>
      {/* Introduction Section */}
      <Container colour="blue">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <h2 className="text-4xl md:text-5xl font-bold text-white">
            AI chatbots that feel human - and work like part of your team
          </h2>
          <p className="text-xl text-white/90 leading-relaxed">
            Not scripted bots. Not generic AI. Fully integrated, business-aware
            chatbots that understand your customers, your systems, and your
            brand — and respond like a real person would.
          </p>
          <div className="flex flex-col md:flex-row items-center justify-center gap-6 pt-4">
            <a
              href="https://wa.me/TBC"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 bg-white text-primary px-8 py-4 rounded-lg font-semibold text-lg hover:bg-white/90 transition-colors shadow-lg hover:shadow-xl"
            >
              <MessageSquare className="w-6 h-6" />
              Get Started on WhatsApp
            </a>
            <div className="hidden md:block">
              <div className="bg-gray-200 w-32 h-32 rounded-lg flex items-center justify-center text-gray-500 text-sm">
                QR Code
              </div>
              <p className="text-sm text-gray-500 mt-2">Scan to chat</p>
            </div>
          </div>
        </div>
      </Container>

      {/* Example Carousel */}
      <ExampleCarousel examples={examples} />

      {/* Features Section */}

      <Container colour="blue">
        <div className="text-center mb-12">
          <h3 className="text-3xl md:text-4xl font-bold mb-4">
            Why Choose Voxd?
          </h3>
          <p className="text-lg max-w-2xl mx-auto">
            Everything you need to deliver exceptional experiences through
            WhatsApp
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {features.map((feature) => {
            const Icon = getIcon(feature.icon);
            return (
              <Link
                key={feature.id}
                href={`/features/${feature.slug}`}
                className="bg-white p-6 rounded-xl shadow-sm hover:shadow-xl transition-all duration-200 block hover:scale-105"
              >
                <div className="flex gap-4 items-center">
                  <div className="bg-primary/10 w-14 h-14 rounded-lg flex items-center justify-center mb-4">
                    <Icon className="w-7 h-7 text-primary" />
                  </div>
                  <h4 className="text-xl font-semibold text-gray-900 mb-3">
                    {feature.title}
                  </h4>
                </div>
                <p className="text-gray-600 leading-relaxed">{feature.short}</p>
              </Link>
            );
          })}
        </div>
      </Container>

      {/* Talk to Clive Section */}
      <Container>
        <div className="px-4 md:px-6">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <h3 className="text-3xl md:text-4xl font-bold ">
              Don't Just Take Our Word For It
            </h3>
            <p className="text-xlleading-relaxed">
              Meet <span className="font-semibold">Clive</span>, our
              WhatsApp-based sales assistant. Chat with him now to discover what
              an intelligent chatbot could do for your business – and experience
              the power of Voxd firsthand.
            </p>
            <div className="pt-6">
              <a
                href="#"
                className="inline-flex items-center gap-3 bg-primary text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-primary/90 transition-colors shadow-lg hover:shadow-xl"
              >
                <MessageSquare className="w-6 h-6" />
                Chat with Clive on WhatsApp
              </a>
            </div>
            <p className="text-sm pt-2">
              Available 24/7 • Instant responses • No commitment required
            </p>
          </div>
        </div>
      </Container>
    </>
  );
}
