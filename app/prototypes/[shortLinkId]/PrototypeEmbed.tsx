"use client";

import { useEffect } from "react";

export default function PrototypeEmbed({
  agentId,
  organisationId,
  quoteId,
  coreBaseUrl,
}: {
  agentId: string;
  organisationId: string;
  quoteId: string;
  coreBaseUrl: string;
}) {
  useEffect(() => {
    const baseUrl = coreBaseUrl;
    const script = document.createElement("script");
    script.src = `${baseUrl}/web-client/dist/embed.js`;
    script.setAttribute("data-agent-id", agentId);
    script.setAttribute("data-mode", "fullscreen");
    script.setAttribute(
      "data-session-data",
      JSON.stringify({ quoteId }),
    );
    script.setAttribute("data-brand-as-organisation-id", organisationId);
    document.body.appendChild(script);

    return () => {
      script.remove();
    };
  }, [agentId, organisationId, quoteId, coreBaseUrl]);

  return null;
}
