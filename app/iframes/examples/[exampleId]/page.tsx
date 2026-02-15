import { notFound } from "next/navigation";
import { getExampleForPublic } from "@/lib/getExampleForPublic";
import ExampleConversationsViewer from "@/components/ExampleConversationsViewer";
import { MarkdownContent } from "@/components/MarkdownContent";

export default async function ExampleIframePage({
  params,
}: {
  params: { exampleId: string };
}) {
  const { exampleId } = await params;

  const example = await getExampleForPublic({ exampleId });

  if (!example) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-5xl mx-auto p-6 space-y-8">
        {/* Title and Business Name */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{example.title}</h1>
          <p className="text-gray-500 text-sm mt-1">{example.businessName}</p>
        </div>

        {/* Body Content */}
        {example.body && (
          <div className="prose prose-gray max-w-none">
            <MarkdownContent content={example.body} />
          </div>
        )}

        {/* Example Conversations */}
        {example.exampleConversations.length > 0 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Example Conversations
              </h2>
              <p className="text-gray-500 text-sm mt-1">
                See how this chatbot interacts with users
              </p>
            </div>

            <ExampleConversationsViewer
              conversations={example.exampleConversations}
              businessName={example.businessName}
              brandColor="#6366f1"
              exampleId={example.id}
              logoFileExtension={example.logoFileExtension}
            />
          </div>
        )}
      </div>
    </div>
  );
}
