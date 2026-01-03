"use client";

import { useState } from "react";
import {
  Smartphone,
  Server,
  Brain,
  Database,
  ChevronDown,
  ArrowDown,
  Plug,
  MessageSquare,
  Webhook,
  Cpu,
  Send,
  CheckCircle,
} from "lucide-react";

interface Stage {
  id: string;
  step: number;
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  description: string;
  details: string[];
  isReturn?: boolean;
}

const stages: Stage[] = [
  {
    id: "user-sends",
    step: 1,
    title: "User Sends Message",
    subtitle: "WhatsApp on any device",
    icon: Smartphone,
    color: "bg-green-500",
    description:
      "The journey begins when a customer sends a message through WhatsApp on their phone, tablet, or computer.",
    details: [
      "Works with any standard WhatsApp app — no special downloads required",
      "Supports text messages, images, voice notes, documents, and location",
      "Available 24/7 — customers can reach out anytime",
      "Familiar interface that billions of people already use daily",
    ],
  },
  {
    id: "meta-receives",
    step: 2,
    title: "Meta Receives Message",
    subtitle: "WhatsApp Business API",
    icon: Server,
    color: "bg-blue-500",
    description:
      "Meta's official WhatsApp Business API receives the message and triggers a secure webhook to notify Voxd.",
    details: [
      "Enterprise-grade infrastructure with 99.9% uptime",
      "End-to-end encryption maintained throughout",
      "Webhook notification sent to Voxd servers in milliseconds",
      "Message metadata includes sender info, timestamp, and message type",
    ],
  },
  {
    id: "voxd-processes",
    step: 3,
    title: "Voxd Processes Message",
    subtitle: "Context enrichment & orchestration",
    icon: Database,
    color: "bg-primary",
    description:
      "Voxd receives the webhook, queues the message, and enriches it with context from your business systems.",
    details: [
      "Message securely stored and queued for processing",
      "Conversation history retrieved for context",
      "User profile and preferences loaded (name, past orders, preferences)",
      "Agent-specific prompts, rules, and guardrails applied",
      "External data fetched from your CRM, booking system, or other integrations",
    ],
  },
  {
    id: "integrations",
    step: 3.5,
    title: "External Integrations",
    subtitle: "CRM, M365, Google Workspace, APIs & more",
    icon: Plug,
    color: "bg-orange-500",
    description:
      "Voxd connects to your business systems to fetch real-time data, ensuring the AI has accurate, up-to-date information.",
    details: [
      "CRM Systems — Salesforce, HubSpot, Pipedrive, Zoho, and more",
      "Accounting Software — Xero, QuickBooks, Sage, FreshBooks",
      "Microsoft 365 — Calendar, Email, SharePoint, Teams",
      "Google Workspace — Calendar, Drive, Sheets, Gmail",
      "E-commerce — Shopify, WooCommerce, Magento",
      "Booking Systems — Calendly, Acuity, custom solutions",
      "Custom APIs — Any system with a REST or GraphQL API",
      "All connections are managed securely by Voxd — the AI never connects directly to your systems",
    ],
  },
  {
    id: "ai-generates",
    step: 4,
    title: "AI Generates Response",
    subtitle: "Powered by leading language models",
    icon: Brain,
    color: "bg-purple-500",
    description:
      "The enriched message is sent to a powerful AI model which generates an intelligent, context-aware response.",
    details: [
      "Supports multiple AI providers — OpenAI, Anthropic, Google, and more",
      "Custom prompts tailored specifically to your business and brand voice",
      "Full conversation history included for contextual understanding",
      "Access to tools for real-time lookups (stock levels, appointments, etc.)",
      "Multi-layered guardrails prevent hallucinations and policy violations",
      "Response generated in seconds, not minutes",
    ],
  },
  {
    id: "voxd-validates",
    step: 5,
    title: "Voxd Validates Response",
    subtitle: "Quality control & tool execution",
    icon: Cpu,
    color: "bg-primary",
    description:
      "Voxd receives the AI response, executes any tool calls (like booking an appointment), and validates the output.",
    details: [
      "AI tool calls executed securely (CRM updates, bookings, lookups)",
      "Response validated against business rules and policies",
      "Message formatted appropriately for WhatsApp",
      "Analytics and performance metrics recorded",
      "Conversation state updated for future context",
    ],
    isReturn: true,
  },
  {
    id: "meta-delivers",
    step: 6,
    title: "Meta Delivers Response",
    subtitle: "Back through WhatsApp Business API",
    icon: Send,
    color: "bg-blue-500",
    description:
      "Voxd sends the response back through Meta's WhatsApp Business API for delivery to the user.",
    details: [
      "Message sent via official WhatsApp Business API",
      "Delivery confirmation received from Meta",
      "Support for rich messages — buttons, lists, templates",
      "Automatic retry on temporary delivery failures",
    ],
    isReturn: true,
  },
  {
    id: "user-receives",
    step: 7,
    title: "User Receives Reply",
    subtitle: "Instant notification on their device",
    icon: CheckCircle,
    color: "bg-green-500",
    description:
      "The customer receives an instant, intelligent response right in their WhatsApp chat — ready to continue the conversation.",
    details: [
      "Push notification delivered to user's device",
      "Response appears in the same familiar WhatsApp interface",
      "Conversation continues naturally — user can reply anytime",
      "Full conversation history maintained for context",
      "Average response time: under 5 seconds",
    ],
    isReturn: true,
  },
];

function StageAccordion({
  stage,
  isOpen,
  onToggle,
  isLast,
}: {
  stage: Stage;
  isOpen: boolean;
  onToggle: () => void;
  isLast: boolean;
}) {
  const Icon = stage.icon;

  return (
    <div className="relative">
      {/* Connector line to next stage */}
      {!isLast && (
        <div className="absolute left-6 top-full w-0.5 h-6 bg-gray-200 z-0" />
      )}

      <div className="relative z-10 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Header */}
        <button
          onClick={onToggle}
          className={`w-full flex items-center gap-4 p-4 text-left transition-colors ${
            isOpen ? "bg-gray-50 border-b border-gray-100" : "hover:bg-gray-50"
          }`}
        >
          {/* Step indicator */}
          <div
            className={`flex-shrink-0 w-12 h-12 ${stage.color} rounded-xl flex items-center justify-center`}
          >
            <Icon className="w-6 h-6 text-white" />
          </div>

          {/* Title */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-500">
                Step{" "}
                {Number.isInteger(stage.step)
                  ? stage.step
                  : Math.floor(stage.step)}
                {!Number.isInteger(stage.step) && "+"}
              </span>
            </div>
            <h4 className="text-lg font-semibold text-gray-900">
              {stage.title}
            </h4>
            <p className="text-sm text-gray-500 truncate">{stage.subtitle}</p>
          </div>

          {/* Chevron */}
          <ChevronDown
            className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </button>

        {/* Expandable content */}
        <div
          className={`overflow-hidden transition-all duration-300 ease-in-out ${
            isOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <div className="px-4 pb-4 pt-4">
            <div className="pl-16">
              <p className="text-gray-600 mb-4">{stage.description}</p>
              <ul className="space-y-2">
                {stage.details.map((detail, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <div
                      className={`w-1.5 h-1.5 rounded-full ${stage.color} mt-2 flex-shrink-0`}
                    />
                    <span className="text-gray-700 text-sm">{detail}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DataFlowDiagram() {
  const [openStages, setOpenStages] = useState<Set<string>>(
    new Set(["user-sends"])
  );

  const toggleStage = (id: string) => {
    setOpenStages((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const expandAll = () => {
    setOpenStages(new Set(stages.map((s) => s.id)));
  };

  const collapseAll = () => {
    setOpenStages(new Set());
  };

  return (
    <div className="relative">
      {/* Controls */}
      <div className="flex justify-end gap-2 mb-4">
        <button
          onClick={expandAll}
          className="text-sm text-primary hover:text-primary/80 transition-colors"
        >
          Expand all
        </button>
        <span className="text-gray-300">|</span>
        <button
          onClick={collapseAll}
          className="text-sm text-primary hover:text-primary/80 transition-colors"
        >
          Collapse all
        </button>
      </div>

      {/* Accordion stages */}
      <div className="space-y-6">
        {stages.map((stage, index) => (
          <StageAccordion
            key={stage.id}
            stage={stage}
            isOpen={openStages.has(stage.id)}
            onToggle={() => toggleStage(stage.id)}
            isLast={index === stages.length - 1}
          />
        ))}
      </div>
    </div>
  );
}
