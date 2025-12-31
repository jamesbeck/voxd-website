"use server";

import { ServerActionResponse } from "@/types/types";
import db from "../database/db";

const saDeleteChunk = async ({
  chunkId,
}: {
  chunkId: string;
}): Promise<ServerActionResponse> => {
  try {
    await db("knowledgeChunk").delete().where({ id: chunkId });
  } catch (error) {
    console.error("Error deleting chunk:", error);
    return { success: false, error: "Error deleting chunk" };
  }

  return { success: true };
};

export default saDeleteChunk;
