"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import WhatsAppSim from "@/components/whatsAppSim";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

type Conversation = {
  id: string;
  description: string;
  startTime: string;
  messages: {
    role: "user" | "assistant";
    content: string;
    time: number;
    annotation: string | null;
  }[];
};

export default function ExampleConversationsAccordion({
  conversations,
  businessName,
  brandColor,
  exampleId,
  logoFileExtension,
  organizationId,
  organizationLogoFileExtension,
  organizationLogoDarkBackground,
}: {
  conversations: Conversation[];
  businessName: string;
  brandColor: string;
  exampleId?: string;
  logoFileExtension?: string | null;
  organizationId?: string;
  organizationLogoFileExtension?: string | null;
  organizationLogoDarkBackground?: boolean;
}) {
  const [openId, setOpenId] = useState<string | null>(
    conversations.length > 0 ? conversations[0].id : null
  );

  const toggleItem = (id: string) => {
    // Always keep at least one item open - only switch, never close
    if (id !== openId) {
      setOpenId(id);
    }
  };

  return (
    <div className="space-y-3">
      {conversations.map((conversation, index) => (
        <Collapsible
          key={conversation.id}
          open={openId === conversation.id}
          onOpenChange={() => toggleItem(conversation.id)}
        >
          <CollapsibleTrigger className="w-full">
            <div
              className={cn(
                "flex items-center justify-between p-4 rounded-lg border transition-colors",
                openId === conversation.id
                  ? "bg-gray-50 border-gray-200"
                  : "bg-white border-gray-200 hover:bg-gray-50"
              )}
            >
              <span className="font-medium text-gray-900 text-left">
                {index + 1}. {conversation.description}
              </span>
              <ChevronDown
                className={cn(
                  "h-5 w-5 text-gray-400 transition-transform",
                  openId === conversation.id && "rotate-180"
                )}
              />
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="pt-4 flex justify-center">
              <WhatsAppSim
                messages={conversation.messages.map((m) => ({
                  role: m.role,
                  content: m.content,
                  time: m.time,
                  annotation: m.annotation || "",
                }))}
                businessName={businessName}
                startTime={conversation.startTime}
                exampleId={exampleId}
                logoFileExtension={logoFileExtension}
                organizationId={organizationId}
                organizationLogoFileExtension={organizationLogoFileExtension}
                organizationLogoDarkBackground={organizationLogoDarkBackground}
              />
            </div>
          </CollapsibleContent>
        </Collapsible>
      ))}
    </div>
  );
}
