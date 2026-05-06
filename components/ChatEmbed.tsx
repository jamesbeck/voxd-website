"use client";

import { useEffect } from "react";

type ChatIdentifyParams = {
  externalId: string;
  email?: string;
  number?: string;
  name?: string;
};

type ChatData = Record<string, string>;

declare global {
  interface Window {
    VoxdChat?: {
      identify: (params: ChatIdentifyParams) => Promise<void>;
      setUserData: (data: ChatData) => Promise<void>;
      setSessionData: (data: ChatData) => Promise<void>;
    };
  }
}

export default function ChatEmbed({
  agentId,
  coreBaseUrl,
  primaryColour,
  identify,
  userData,
  sessionData,
  brandAsOrganisationId,
}: {
  agentId: string;
  coreBaseUrl: string;
  primaryColour: string;
  identify?: ChatIdentifyParams;
  userData?: ChatData;
  sessionData?: ChatData;
  brandAsOrganisationId?: string;
}) {
  useEffect(() => {
    let cancelled = false;
    const script = document.createElement("script");
    script.src = `${coreBaseUrl}/web-client/embed.js`;
    script.setAttribute("data-agent-id", agentId);
    script.setAttribute("data-mode", "fullscreen");
    script.setAttribute("data-color", primaryColour);
    script.setAttribute("data-auto-open", "true");
    if (brandAsOrganisationId) {
      script.setAttribute(
        "data-brand-as-organisation-id",
        brandAsOrganisationId,
      );
    }

    script.addEventListener("load", () => {
      if (cancelled || !window.VoxdChat) return;

      void (async () => {
        try {
          if (identify) {
            await window.VoxdChat?.identify(identify);
          }

          if (userData) {
            await window.VoxdChat?.setUserData(userData);
          }

          if (sessionData) {
            await window.VoxdChat?.setSessionData(sessionData);
          }
        } catch (error) {
          console.error("Failed to configure VoxdChat widget", error);
        }
      })();
    });

    document.body.appendChild(script);

    return () => {
      cancelled = true;
      script.remove();
    };
  }, [
    agentId,
    coreBaseUrl,
    primaryColour,
    identify,
    userData,
    sessionData,
    brandAsOrganisationId,
  ]);

  return null;
}
