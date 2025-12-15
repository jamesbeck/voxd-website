import Image from "next/image";
import Container from "@/components/websiteui/container";
import { getExamples } from "@/lib/getExamples";
import {
  MessageSquare,
  Zap,
  Brain,
  PlugZap,
  Clock,
  AlertTriangle,
  Layers,
  LayoutDashboard,
  MessagesSquare,
  Edit3,
  PauseCircle,
  UserCheck,
  BarChart3,
  Download,
  Sliders,
  GitBranch,
  ShieldAlert,
  ShieldCheck,
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
        "Advanced AI capable of handling complex workflows, maintaining context, and delivering human-like responses.",
    },
    {
      icon: PlugZap,
      title: "Seamless Integration",
      description:
        "Connects effortlessly with CRMs, databases, APIs, and backend systems — regardless of your tech stack.",
    },
    {
      icon: Zap,
      title: "Lightning-Fast Setup",
      description:
        "Go live in as little as one day with minimal configuration and no long onboarding cycles.",
    },
    {
      icon: Clock,
      title: "24/7 Availability",
      description:
        "Always-on AI support that delivers instant responses around the clock, every day of the year.",
    },
    {
      icon: MessageSquare,
      title: "WhatsApp Native",
      description:
        "Built specifically for WhatsApp with first-class support for rich media, templates, and interactive messages.",
    },
    {
      icon: ShieldCheck,
      title: "Enterprise-Grade Security",
      description:
        "Industry-leading security practices, encrypted data, and full compliance with data protection regulations.",
    },
    {
      icon: AlertTriangle,
      title: "Guardrails & Safety Nets",
      description:
        "Multi-layered safety mechanisms to prevent hallucinations, enforce policies, and reduce operational risk.",
    },
    {
      icon: Layers,
      title: "Multi-Agent Architecture",
      description:
        "Specialized AI agents collaborate behind the scenes to handle different tasks, intents, and scenarios.",
    },
    {
      icon: LayoutDashboard,
      title: "Unified Operator Dashboard",
      description:
        "A central dashboard to monitor, manage, and control all AI conversations across channels in real time.",
    },
    {
      icon: MessagesSquare,
      title: "Conversation Explorer",
      description:
        "Browse raw conversations with full message history, metadata, timestamps, and AI decision traces.",
    },
    {
      icon: Edit3,
      title: "Reply Annotation & Feedback",
      description:
        "Annotate AI responses, leave internal notes, and provide feedback to continuously improve model behavior.",
    },
    {
      icon: PauseCircle,
      title: "AI Response Control",
      description:
        "Pause, resume, or override AI responses at any time — giving humans full control when needed.",
    },
    {
      icon: UserCheck,
      title: "Human-in-the-Loop Replies",
      description:
        "Jump into live conversations and reply manually, with seamless handoff between AI and human operators.",
    },
    {
      icon: BarChart3,
      title: "Usage & Performance Analytics",
      description:
        "Track message volumes, response times, resolution rates, and AI performance metrics in real time.",
    },
    {
      icon: Download,
      title: "Data Export & Audit Logs",
      description:
        "Export conversations, annotations, and usage data for reporting, compliance, or external analysis.",
    },
    {
      icon: Sliders,
      title: "Dynamic Prompt & Policy Management",
      description:
        "Adjust prompts, rules, and constraints without redeploying or interrupting live conversations.",
    },
    {
      icon: GitBranch,
      title: "Conversation Versioning",
      description:
        "Track changes to prompts, logic, and responses over time with full rollback capabilities.",
    },
    {
      icon: ShieldAlert,
      title: "Role-Based Access Control",
      description:
        "Fine-grained permissions for admins, operators, reviewers, and auditors.",
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
            Transform your organisation communication with intelligent AI
            chatbots that work tirelessly on WhatsApp. Designed to fit
            seamlessly into your business operations, our bespoke solutions
            automate organisation support, streamline sales, and manage bookings
            with enterprise-grade reliability.
          </p>
          <div className="flex flex-col md:flex-row items-center justify-center gap-6 pt-4">
            <a
              href="https://wa.me/TBC"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 bg-primary text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-primary/90 transition-colors shadow-lg hover:shadow-xl"
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
            Everything you need to deliver exceptional organisation experiences
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
              Ready to Transform Your Organisation Communication?
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
