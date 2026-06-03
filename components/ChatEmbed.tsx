"use client";

import { useEffect } from "react";

const waitForVoxdChat = async (timeoutMs = 3000) => {
  const deadline = Date.now() + timeoutMs;

  while (!window.VoxdChat && Date.now() < deadline) {
    await new Promise((resolve) => window.setTimeout(resolve, 50));
  }

  return window.VoxdChat;
};

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
      open: () => void;
      setUserData: (data: ChatData) => Promise<void>;
      setSessionData: (data: ChatData) => Promise<void>;
    };
  }
}

export default function ChatEmbed({
  agentId,
  coreBaseUrl,
  primaryColour,
  mode = "fullscreen",
  identify,
  userData,
  sessionData,
  brandAsOrganisationId,
}: {
  agentId: string;
  coreBaseUrl: string;
  primaryColour: string;
  mode?: "fullscreen" | "widget";
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
    script.setAttribute("data-mode", mode);
    script.setAttribute("data-color", primaryColour);
    if (brandAsOrganisationId) {
      script.setAttribute(
        "data-brand-as-organisation-id",
        brandAsOrganisationId,
      );
    }

    script.addEventListener("load", () => {
      void (async () => {
        try {
          const chat = await waitForVoxdChat();

          if (cancelled || !chat) return;

          if (identify) {
            await chat.identify(identify);
          }

          if (userData) {
            await chat.setUserData(userData);
          }

          if (sessionData) {
            await chat.setSessionData(sessionData);
          }

          chat.open();
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
    mode,
    identify,
    userData,
    sessionData,
    brandAsOrganisationId,
  ]);

  return null;
}
