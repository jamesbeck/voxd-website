import Image from "next/image";
import Container from "@/components/websiteui/container";
import { getExamples } from "@/lib/getExamples";
import {
  MessageSquare,
  Zap,
  Brain,
  PlugZap,
  Clock,
  Shield,
} from "lucide-react";
import Link from "next/link";

export default async function Home() {
  const examples = await getExamples();

  const eg1 = examples[0];

  const features = [
    {
      icon: Brain,
      title: "Intelligent Conversations",
      description:
        "Advanced AI capable of handling complex workflows and understanding context to deliver human-like responses.",
    },
    {
      icon: PlugZap,
      title: "Seamless Integration",
      description:
        "Connects with any CRM, database, or backend system. No matter your tech stack, we'll make it work.",
    },
    {
      icon: Zap,
      title: "Lightning-Fast Setup",
      description:
        "Get your AI chatbot up and running in as little as 1 day. No lengthy implementation periods.",
    },
    {
      icon: Clock,
      title: "24/7 Availability",
      description:
        "Your chatbot never sleeps. Deliver instant responses to customers around the clock, every day.",
    },
    {
      icon: MessageSquare,
      title: "WhatsApp Native",
      description:
        "Meet customers where they are. Built specifically for WhatsApp with support for rich media and interactions.",
    },
    {
      icon: Shield,
      title: "Enterprise-Grade Security",
      description:
        "Your data is protected with industry-leading security standards and full compliance with data protection regulations.",
    },
    {
      icon: Shield,
      title: "Guardrails and Safety Nets",
      description:
        "We don't just blindly trust AI, our service is built on multiple layers of tailored safety mechanisms.",
    },
  ];

  return (
    <>
      {/* Introduction Section */}
      <Container>
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-br to-primary from-darkgrey bg-clip-text text-transparent">
            We Build Bespoke WhatsApp AI Chatbots Built Around Your Business
          </h2>
          <p className="text-xl text-gray-600 leading-relaxed">
            Transform your customer communication with intelligent AI chatbots
            that work tirelessly on WhatsApp. Designed to fit seamlessly into
            your business operations, our bespoke solutions automate customer
            support, streamline sales, and manage bookings with enterprise-grade
            reliability.
          </p>
          <div className="flex flex-wrap justify-center gap-4 pt-4">
            <div className="bg-primary text-white px-6 py-3 rounded-lg font-semibold">
              Zero Setup Costs
            </div>
            <Link href="/pricing">
              <div className="bg-gray-100 text-gray-900 px-6 py-3 rounded-lg font-semibold">
                From £299 / month
              </div>
            </Link>
          </div>
        </div>
      </Container>

      <div className="w-full h-[400px] relative">
        <Image
          src={`https://${process.env.NEXT_PUBLIC_WASABI_ENDPOINT}/voxd/exampleImages/${eg1.id}.png`}
          alt="Hero Image"
          fill
          className="object-cover"
        />
      </div>

      {/* Features Section */}

      <Container colour="green">
        <div className="text-center mb-12">
          <h3 className="text-3xl md:text-4xl font-bold mb-4">
            Why Choose Voxd?
          </h3>
          <p className="text-lg max-w-2xl mx-auto">
            Everything you need to deliver exceptional customer experiences
            through WhatsApp
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200"
              >
                <div className="flex gap-4 items-center">
                  <div className="bg-primary/10 w-14 h-14 rounded-lg flex items-center justify-center mb-4">
                    <Icon className="w-7 h-7 text-primary" />
                  </div>
                  <h4 className="text-xl font-semibold text-gray-900 mb-3">
                    {feature.title}
                  </h4>
                </div>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
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

      {/* CTA Section */}
      <Container colour="green">
        <div className="py-16 px-4 md:px-6">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h3 className="text-3xl md:text-4xl font-bold">
              Ready to Transform Your Customer Communication?
            </h3>
            <p className="text-lg ">
              Join businesses that are delivering smarter conversations and
              faster results with Voxd.
            </p>
          </div>
        </div>
      </Container>
    </>
  );
}
