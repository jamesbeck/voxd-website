import H1 from "@/components/adminui/h1";
import WhatsAppSim from "@/components/whatsAppSim";
import db from "@/database/db";
import Image from "next/image";

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const caseStudy = await db("caseStudy").where("slug", slug).first();

  const demoConversations = await db("demoConversation").where(
    "caseStudyId",
    caseStudy?.id
  );

  return (
    <div>
      <H1>{caseStudy?.title}</H1>

      <style>
        {`
          h2 {
            font-size: 1.2rem;
            font-weight: 600;
            margin-top: 30px;
            margin-bottom: 10px;
          }

          h3 {
            font-size: 1rem;
            font-weight: 600;
          }

          p {
            margin-bottom: 30px;
          }

          ul {
            list-style-type: disc;
            margin-left: 40px;
            margin-bottom: 30px;
          }
        `}
      </style>

      <div dangerouslySetInnerHTML={{ __html: caseStudy?.body || "" }} />

      <div className="flex justify-center">
        {demoConversations.map((conversation) => (
          <div key={conversation.id}>
            <WhatsAppSim messages={conversation.messages} />
          </div>
        ))}
      </div>
    </div>
  );
}
