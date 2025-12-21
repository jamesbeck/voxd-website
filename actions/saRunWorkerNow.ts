"use server";

import db from "../database/db";
import { verifyAccessToken } from "@/lib/auth/verifyToken";
import { ServerActionResponse } from "@/types/types";

const saRunWorkerNow = async ({
  workerRunId,
}: {
  workerRunId: string;
}): Promise<ServerActionResponse> => {
  await verifyAccessToken();

  try {
    // Update the worker run to schedule it for now, only if it hasn't started yet
    const updated = await db("workerRun")
      .where("id", workerRunId)
      .where("runStatus", "queued")
      .whereNull("startedAt")
      .update({
        scheduledFor: new Date(),
      });

    if (updated === 0) {
      return {
        success: false,
        error:
          "Worker run not found, not in queued status, or has already started",
      };
    }

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error running worker now:", error);
    return {
      success: false,
      error: "Failed to run worker now",
    };
  }
};

export default saRunWorkerNow;
