"use client";

import { useEffect } from "react";

export default function ChatEmbed({
  agentId,
  coreBaseUrl,
  primaryColour,
  sessionData,
  brandAsOrganisationId,
}: {
  agentId: string;
  coreBaseUrl: string;
  primaryColour: string;
  sessionData?: Record<string, string>;
  brandAsOrganisationId?: string;
}) {
  useEffect(() => {
    const script = document.createElement("script");
    script.src = `${coreBaseUrl}/web-client/embed.js`;
    script.setAttribute("data-agent-id", agentId);
    script.setAttribute("data-mode", "fullscreen");
    script.setAttribute("data-color", primaryColour);
    script.setAttribute("data-auto-open", "true");
    if (sessionData) {
      script.setAttribute("data-session-data", JSON.stringify(sessionData));
    }
    if (brandAsOrganisationId) {
      script.setAttribute(
        "data-brand-as-organisation-id",
        brandAsOrganisationId,
      );
    }
    document.body.appendChild(script);

    return () => {
      script.remove();
    };
  }, [agentId, coreBaseUrl, primaryColour, sessionData, brandAsOrganisationId]);

  return null;
}
