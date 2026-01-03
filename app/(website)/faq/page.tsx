import Container from "@/components/websiteui/container";
import { getPublicFaqs, getPublicFaqCategories } from "@/lib/getPublicFaqs";
import FaqClient from "./faqClient";
import { HelpCircle, MessageSquare } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "FAQ | Voxd",
  description:
    "Find answers to frequently asked questions about Voxd's WhatsApp AI chatbot services.",
};

export default async function FaqPage() {
  const [faqs, categories] = await Promise.all([
    getPublicFaqs(),
    getPublicFaqCategories(),
  ]);

  return (
    <>
      {/* Hero Section */}
      <Container>
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-2">
            <HelpCircle className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-br to-primary from-darkgrey bg-clip-text text-transparent">
            Frequently Asked Questions
          </h1>
          <p className="text-xl text-gray-600 leading-relaxed max-w-2xl mx-auto">
            Everything you need to know about Voxd and our WhatsApp AI chatbot
            services. Can't find what you're looking for?{" "}
            <a
              href="/contact"
              className="text-primary hover:underline font-medium"
            >
              Contact us
            </a>
            .
          </p>
        </div>
      </Container>

      {/* FAQ Content */}
      <Container>
        <div className="max-w-4xl mx-auto">
          <FaqClient faqs={faqs} categories={categories} />
        </div>
      </Container>

      {/* CTA Section */}
      <Container colour="green">
        <div className="py-8 max-w-3xl mx-auto text-center space-y-6">
          <h3 className="text-2xl md:text-3xl font-bold">
            Still Have Questions?
          </h3>
          <p className="text-lg opacity-90">
            Our team is here to help. Get in touch and we'll get back to you as
            soon as possible.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <a
              href="/contact"
              className="inline-flex items-center gap-2 bg-white text-primary px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors shadow-lg"
            >
              <MessageSquare className="w-5 h-5" />
              Contact Us
            </a>
          </div>
        </div>
      </Container>
    </>
  );
}
