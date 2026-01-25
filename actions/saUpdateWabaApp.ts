"use server";

import db from "../database/db";
import { verifyAccessToken } from "@/lib/auth/verifyToken";
import { ServerActionResponse } from "@/types/types";
import { addLog } from "@/lib/addLog";
import saSubscribe from "@/lib/meta/saSubscribe";
import saSyncWabaWithMeta from "@/actions/saSyncWabaWithMeta";

export default async function saUpdateWabaApp({
  wabaId,
  appId,
}: {
  wabaId: string;
  appId: string | null;
}): Promise<ServerActionResponse> {
  try {
    const accessToken = await verifyAccessToken();

    // Only super admins can update WABA app
    if (!accessToken.superAdmin) {
      return { success: false, error: "Unauthorized: Only super admins can change WABA app" };
    }

    // Get the current WABA for logging
    const waba = await db("waba")
      .leftJoin("app as currentApp", "waba.appId", "currentApp.id")
      .where("waba.id", wabaId)
      .select("waba.*", "currentApp.name as currentAppName")
      .first();

    if (!waba) {
      return { success: false, error: "WABA not found" };
    }

    // Get new app details if provided
    let newAppName: string | null = null;
    if (appId) {
      const newApp = await db("app").where({ id: appId }).first();
      if (!newApp) {
        return { success: false, error: "App not found" };
      }
      newAppName = newApp.name;
    }

    // If there's a current app, unsubscribe from it first
    if (waba.appId) {
      await saSubscribe({ wabaId, unsubscribe: true });
      // We don't fail if unsubscribe fails - continue with the change
    }

    // Update the WABA's appId
    await db("waba").where({ id: wabaId }).update({ appId });

    // Log the change
    await addLog({
      event: "waba_app_changed",
      description: `Changed WABA app from "${waba.currentAppName || "None"}" to "${newAppName || "None"}"`,
      data: {
        wabaId,
        wabaName: waba.name,
        oldAppId: waba.appId,
        oldAppName: waba.currentAppName,
        newAppId: appId,
        newAppName,
      },
    });

    // If an app was set, subscribe it to the WABA
    if (appId) {
      const subscribeResult = await saSubscribe({ wabaId, unsubscribe: false });
      
      if (!subscribeResult.success) {
        // Return success for the update but include subscription error as warning
        return {
          success: true,
          data: {
            updated: true,
            subscribeError: subscribeResult.error,
          },
        };
      }
    }

    // Resync the WABA with Meta to get updated data
    await saSyncWabaWithMeta({ wabaId });

    return { success: true };
  } catch (error) {
    console.error("Error updating WABA app:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update WABA app",
    };
  }
}
