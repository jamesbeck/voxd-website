import Container from "@/components/websiteui/container";
import DataFlowDiagram from "@/components/websiteui/DataFlowDiagram";

interface HowItWorksProps {
  businessName: string;
}

export default function HowItWorks({ businessName }: HowItWorksProps) {
  return (
    <>
      <Container colour="blue" header>
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <h1 className="text-4xl md:text-5xl font-bold text-white">
            How It Works
          </h1>
          <p className="text-xl text-white/90 leading-relaxed">
            See how messages flow from your customers through WhatsApp, to our
            AI, and back — with real-time access to all your business systems.
          </p>
        </div>
      </Container>

      <Container>
        <DataFlowDiagram businessName={businessName} />
      </Container>
    </>
  );
}
