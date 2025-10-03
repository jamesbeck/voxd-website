import Image from "next/image";
import Container from "@/components/websiteui/container";
import WhatsAppSim from "@/components/whatsAppSim";
import { getExamples } from "@/lib/getExamples";

export default async function Home() {
  const examples = await getExamples();

  const eg1 = examples[0];

  return (
    <>
      <div className="w-full h-[400px] relative">
        <Image
          src={`https://${process.env.NEXT_PUBLIC_WASABI_ENDPOINT}/swiftreply/exampleImages/${eg1.id}.png`}
          alt="Hero Image"
          fill
          className="object-cover"
        />
        {/* <Container>
          <WhatsAppSim
            messages={eg1.exampleConversations[0].messages}
            businessName={eg1.businessName}
            startTime={eg1.exampleConversations[0].startTime}
            exampleId={eg1.id}
          />
        </Container> */}
      </div>
      <Container>
        <div className="px-6 text-center flex flex-col justify-center items-center gap-6">
          <h2 className="text-3xl font-bold">
            Bespoke WhatsApp AI Chatbots – Built Around Your Business
          </h2>

          <h2 className="text-3xl font-bold">Coming Soon!</h2>

          {/* <p>
          Looking to supercharge your customer communication? Our bespoke
          WhatsApp-powered AI chatbots are designed to fit seamlessly into your
          business.
        </p>

        <ul className="text-left max-w-2xl">
          <li className="mb-2">
            ✅ Integrates with any CRM or backend system – no matter what you
            use, we’ll connect it.
          </li>
          <li className="mb-2">
            ✅ Extremely intelligent – capable of handling even the most complex
            workflows with ease.
          </li>
          <li className="mb-2">
            ✅ Lightning-fast setup – up and running in as little as 1 day.
          </li>
          <li className="mb-2">
            ✅ Simple pricing – <b>zero</b> setup costs, from £399 per month.
          </li>
        </ul>

        <p>
          Whether you need to automate customer support, streamline sales, or
          manage bookings, our AI chatbots work tirelessly to deliver instant,
          reliable responses – 24/7.
        </p>

        <h2 className="text-3xl font-bold">
          Smarter conversations. Faster results.
        </h2> */}
        </div>
      </Container>
    </>
  );
}
