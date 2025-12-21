"use server";

import db from "../database/db";
import { verifyAccessToken } from "@/lib/auth/verifyToken";
import { ServerActionResponse } from "@/types/types";

const saRequeueWorkerRun = async ({
  workerRunId,
}: {
  workerRunId: string;
}): Promise<ServerActionResponse> => {
  await verifyAccessToken();

  try {
    // Get the original worker run to copy its details
    const originalWorkerRun = await db("workerRun")
      .where("id", workerRunId)
      .first();

    if (!originalWorkerRun) {
      return {
        success: false,
        error: "Worker run not found",
      };
    }

    // Create a new worker run with the same details but queued status
    const [newWorkerRun] = await db("workerRun")
      .insert({
        workerName: originalWorkerRun.workerName,
        sessionId: originalWorkerRun.sessionId,
        scheduledFor: new Date(),
        runStatus: "queued",
        userData: originalWorkerRun.userData,
        sessionData: originalWorkerRun.sessionData,
        workerData: originalWorkerRun.workerData,
      })
      .returning("id");

    return {
      success: true,
      data: { id: newWorkerRun.id },
    };
  } catch (error) {
    console.error("Error requeuing worker run:", error);
    return {
      success: false,
      error: "Failed to requeue worker run",
    };
  }
};

export default saRequeueWorkerRun;
