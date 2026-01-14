import Container from "@/components/websiteui/container";
import DataFlowDiagram from "@/components/websiteui/DataFlowDiagram";

interface HowItWorksProps {
  businessName: string;
}

export default function HowItWorks({ businessName }: HowItWorksProps) {
  return (
    <Container>
      <div className="text-center mb-12">
        <h3 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h3>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          See how messages flow from your customers through WhatsApp, to our AI,
          and back — with real-time access to all your business systems
        </p>
      </div>
      <DataFlowDiagram businessName={businessName} />
    </Container>
  );
}
