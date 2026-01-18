"use server";

import { ServerActionResponse } from "@/types/types";
import db from "../database/db";
import { addLog } from "@/lib/addLog";

const saDeleteQuoteViews = async ({
  quoteId,
}: {
  quoteId: string;
}): Promise<ServerActionResponse> => {
  try {
    const deletedCount = await db("quoteView").delete().where({ quoteId });

    await addLog({
      event: "Quote Views Deleted",
      description: `Deleted ${deletedCount} view(s) for quote ${quoteId}`,
      data: {
        quoteId,
        deletedCount,
      },
    });

    return { success: true, data: { deletedCount } };
  } catch (error) {
    return { success: false, error: "Error deleting quote views" };
  }
};

export default saDeleteQuoteViews;
