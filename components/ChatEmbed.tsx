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
  interface WindowEventMap {
    "voxdchat:ready": CustomEvent<{
      chat: NonNullable<Window["VoxdChat"]>;
    }>;
  }

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
    let configured = false;
    const script = document.createElement("script");

    const configureChat = async (
      chat: NonNullable<Window["VoxdChat"]> | undefined,
    ) => {
      if (cancelled || configured || !chat) return;

      configured = true;

      try {
        if (identify) {
          await chat.identify(identify);
        }

        if (userData) {
          await chat.setUserData(userData);
        }

        if (sessionData) {
          await chat.setSessionData(sessionData);
        }

        if (!cancelled) {
          chat.open();
        }
      } catch (error) {
        configured = false;
        console.error("Failed to configure VoxdChat widget", error);
      }
    };

    const handleReady = (event: WindowEventMap["voxdchat:ready"]) => {
      void configureChat(event.detail.chat);
    };

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

    window.addEventListener("voxdchat:ready", handleReady);

    script.addEventListener("load", () => {
      if (window.VoxdChat) {
        void configureChat(window.VoxdChat);
      }
    });

    document.body.appendChild(script);

    return () => {
      cancelled = true;
      window.removeEventListener("voxdchat:ready", handleReady);
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
