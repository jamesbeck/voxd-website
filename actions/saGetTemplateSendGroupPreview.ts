"use server";

import { getChatUsersForSavedTemplateSendGroup } from "@/lib/templateSendGroups";
import { TemplateChatUserRecord } from "@/lib/templateMessages";

function sampleChatUsers(
  chatUsers: TemplateChatUserRecord[],
  sampleSize: number,
): TemplateChatUserRecord[] {
  const pool = [...chatUsers];
  for (let index = pool.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [pool[index], pool[randomIndex]] = [pool[randomIndex], pool[index]];
  }

  return pool.slice(0, sampleSize);
}

const saGetTemplateSendGroupPreview = async ({
  agentId,
  queryId,
  sampleSize = 3,
}: {
  agentId: string;
  queryId: string;
  sampleSize?: number;
}): Promise<{
  success: boolean;
  error?: string;
  previewUsers?: TemplateChatUserRecord[];
  recipientCount?: number;
  totalMatches?: number;
  excludedUsersWithoutWhatsApp?: number;
  queryName?: string;
}> => {
  const groupResult = await getChatUsersForSavedTemplateSendGroup({
    agentId,
    queryId,
  });

  if (!groupResult.success) {
    return { success: false, error: groupResult.error };
  }

  return {
    success: true,
    previewUsers: sampleChatUsers(groupResult.chatUsers, sampleSize),
    recipientCount: groupResult.chatUsers.length,
    totalMatches:
      groupResult.chatUsers.length + groupResult.excludedUsersWithoutWhatsApp,
    excludedUsersWithoutWhatsApp: groupResult.excludedUsersWithoutWhatsApp,
    queryName: groupResult.query.name,
  };
};

export default saGetTemplateSendGroupPreview;
