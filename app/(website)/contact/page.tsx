import Container from "@/components/websiteui/container";

export default function ContactPage() {
  return (
    <Container colour="blue">
      <div className="max-w-4xl mx-auto text-center space-y-6">
        <h1 className="text-4xl md:text-5xl font-bold text-white">
          Contact Us
        </h1>
        <p className="text-xl text-white/90 leading-relaxed">
          Get in touch with our team. We're here to help answer your questions
          and discuss how Voxd can transform your customer communications.
        </p>
      </div>
    </Container>
  );
}
