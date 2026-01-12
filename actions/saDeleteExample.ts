"use server";

import db from "../database/db";
import { ServerActionResponse } from "@/types/types";
import { verifyAccessToken } from "@/lib/auth/verifyToken";
import { addLog } from "@/lib/addLog";

const saDeleteExample = async ({
  exampleId,
}: {
  exampleId: string;
}): Promise<ServerActionResponse> => {
  const accessToken = await verifyAccessToken();

  if (!accessToken?.superAdmin && !accessToken?.partner) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    // Get the example
    const example = await db("example")
      .where({ id: exampleId })
      .select("partnerId", "title")
      .first();

    if (!example) {
      return { success: false, error: "Example not found" };
    }

    // If user is a partner, verify they own this example
    if (accessToken.partner && !accessToken.superAdmin) {
      if (example.partnerId !== accessToken.partnerId) {
        return { success: false, error: "Unauthorized" };
      }
    }

    // Log example deletion before deleting
    await addLog({
      adminUserId: accessToken.adminUserId,
      event: "Example Deleted",
      description: `Example "${example.title}" deleted`,
      partnerId: accessToken.partnerId,
      data: {
        title: example.title,
        exampleId,
      },
    });

    // Delete related records first
    await db("exampleConversation").where({ exampleId }).delete();
    await db("exampleIndustry").where({ exampleId }).delete();
    await db("exampleFunction").where({ exampleId }).delete();

    // Delete the example
    await db("example").where({ id: exampleId }).delete();

    return { success: true };
  } catch (error) {
    console.error("Error deleting example:", error);
    return { success: false, error: "Failed to delete example" };
  }
};

export default saDeleteExample;
