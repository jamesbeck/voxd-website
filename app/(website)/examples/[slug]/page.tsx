import db from "@/database/db";
import H1 from "@/components/adminui/h1";
import WhatsAppSim from "@/components/whatsAppSim";
import { getExampleBySlug } from "@/lib/getExamples";
import Image from "next/image";
import Container from "@/components/websiteui/container";

export default async function ExamplesPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const example = await getExampleBySlug(slug);

  return (
    <div>
      <style>
        {`
          #example-body h2 {
            font-size: 1.2rem;
            font-weight: 600;
            margin-top: 30px;
            margin-bottom: 10px;
          }

          #example-body h3 {
            font-size: 1rem;
            font-weight: 600;
          }

          #example-body p {
            margin-bottom: 30px;
          }

          #example-body ul {
            list-style-type: disc;
            margin-left: 40px;
            margin-bottom: 30px;
          }

          #example-body ol {
            list-style-type: decimal;
            margin-left: 40px;
            margin-bottom: 30px;
          }
        `}
      </style>

      <div className="relative w-full h-[300px]">
        <Image
          src={`/examples/${example.id}.png`}
          alt={example?.title || ""}
          fill
          style={{ objectFit: "cover" }}
          className="w-full h-full"
        />
      </div>

      <Container>
        <H1>{example.title}</H1>
        <div
          id="example-body"
          dangerouslySetInnerHTML={{ __html: example.body }}
        />
        <div className="flex space-x-4 overflow-x-scroll">
          {example.exampleConversations.map((conversation) => {
            console.log(conversation.messages);
            return (
              <WhatsAppSim
                key={conversation.id}
                messages={conversation.messages}
              />
            );
          })}
        </div>
      </Container>
    </div>
  );
}
