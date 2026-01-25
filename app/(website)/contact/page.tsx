import Container from "@/components/websiteui/container";
import { MessageSquare, Mail, Phone, Building2 } from "lucide-react";
import WhatsAppQRCode from "@/components/WhatsAppQRCode";
import ContactForm from "@/components/ContactForm";

export default function ContactPage() {
  return (
    <>
      {/* Header Section */}
      <Container colour="blue">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <h1 className="text-4xl md:text-5xl font-bold text-white">
            Contact Us
          </h1>
          <p className="text-xl text-white/90 leading-relaxed">
            Get in touch with our team. We&apos;re here to help answer your
            questions and discuss how Voxd can transform your customer
            communications.
          </p>
        </div>
      </Container>

      {/* Chat with Clive Section */}
      <Container>
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <h2 className="text-3xl md:text-4xl font-bold">
            The Fastest Way to Reach Us
          </h2>
          <p className="text-lg text-gray-600 leading-relaxed">
            Chat with <span className="font-semibold">Clive</span>, our AI sales
            assistant on WhatsApp. Available 24/7, he can answer your questions
            instantly and connect you with our team.
          </p>
          <div className="flex flex-col md:flex-row items-center justify-center gap-6 pt-4">
            <a
              href="https://wa.me/+447418641010"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 bg-primary text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-primary/90 transition-colors shadow-lg hover:shadow-xl"
            >
              <MessageSquare className="w-6 h-6" />
              <span className="flex flex-col items-start">
                <span>Chat with Clive on WhatsApp</span>
                <span className="text-xs font-normal opacity-70">
                  Click or scan
                </span>
              </span>
            </a>
            <div className="hidden md:block">
              <WhatsAppQRCode url="https://wa.me/+447418641010" />
            </div>
          </div>
          <p className="text-sm text-gray-500 pt-2">
            Available 24/7 • Instant responses • No commitment required
          </p>
        </div>
      </Container>

      {/* Contact Form Section */}
      <Container colour="blue">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Send Us a Message
            </h2>
            <p className="text-lg opacity-90">
              Prefer email? Fill out the form below and we&apos;ll get back to
              you within 24 hours.
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm p-8 rounded-2xl">
            <ContactForm />
          </div>
        </div>
      </Container>

      {/* Email Addresses Section */}
      <Container>
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Email Us Directly
            </h2>
            <p className="text-lg text-gray-600">
              Reach the right team for your enquiry
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Sales */}
            <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-lg transition-shadow text-center">
              <div className="bg-primary/10 w-14 h-14 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Phone className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Sales</h3>
              <p className="text-gray-600 mb-4">
                New business enquiries and demos
              </p>
              <a
                href="mailto:sales@voxd.ai"
                className="text-primary hover:underline font-medium"
              >
                sales@voxd.ai
              </a>
            </div>

            {/* Client Success */}
            <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-lg transition-shadow text-center">
              <div className="bg-primary/10 w-14 h-14 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Building2 className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Client Success</h3>
              <p className="text-gray-600 mb-4">
                Support for existing customers
              </p>
              <a
                href="mailto:clientsuccess@voxd.ai"
                className="text-primary hover:underline font-medium"
              >
                clientsuccess@voxd.ai
              </a>
            </div>

            {/* Accounts */}
            <div className="bg-white p-6 rounded-xl shadow-sm hover:shadow-lg transition-shadow text-center">
              <div className="bg-primary/10 w-14 h-14 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Mail className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Accounts</h3>
              <p className="text-gray-600 mb-4">
                Billing and invoice enquiries
              </p>
              <a
                href="mailto:accounts@voxd.ai"
                className="text-primary hover:underline font-medium"
              >
                accounts@voxd.ai
              </a>
            </div>
          </div>
        </div>
      </Container>
    </>
  );
}
