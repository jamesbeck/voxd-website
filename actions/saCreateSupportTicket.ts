"use server";

import db from "../database/db";
import { ServerActionResponse } from "@/types/types";
import { verifyAccessToken } from "@/lib/auth/verifyToken";
import sendgrid from "@sendgrid/mail";

type CreateSupportTicketInput = {
  agentId: string;
  title: string;
  description: string;
  messageId?: string;
  messageType?: "user" | "assistant";
};

const saCreateSupportTicket = async (
  input: CreateSupportTicketInput
): Promise<ServerActionResponse> => {
  const accessToken = await verifyAccessToken();

  const { agentId, title, description, messageId, messageType } = input;

  if (!agentId || !title?.trim() || !description?.trim()) {
    return {
      success: false,
      error: "Agent ID, title, and description are required",
    };
  }

  // Verify user has access to this agent
  const agent = await db("agent")
    .leftJoin("organisation", "agent.organisationId", "organisation.id")
    .where("agent.id", agentId)
    .select(
      "agent.id",
      "agent.niceName",
      "organisation.partnerId",
      "organisation.id as organisationId"
    )
    .first();

  if (!agent) {
    return { success: false, error: "Agent not found" };
  }

  // Check access control
  if (!accessToken.superAdmin) {
    if (accessToken.partner) {
      if (agent.partnerId !== accessToken.partnerId) {
        return { success: false, error: "You don't have access to this agent" };
      }
    } else {
      if (agent.organisationId !== accessToken.organisationId) {
        return { success: false, error: "You don't have access to this agent" };
      }
    }
  }

  // Create the support ticket
  try {
    const insertData: Record<string, any> = {
      agentId,
      adminUserId: accessToken.adminUserId,
      title: title.trim(),
      description,
      status: "Open",
    };

    // Add message reference if provided
    if (messageId && messageType) {
      if (messageType === "user") {
        insertData.userMessageId = messageId;
      } else if (messageType === "assistant") {
        insertData.assistantMessageId = messageId;
      }
    }

    const [newTicket] = await db("supportTicket")
      .insert(insertData)
      .returning(["id", "ticketNumber", "title", "status", "createdAt"]);

    // Get reporter name for email
    const reporter = await db("adminUser")
      .where("id", accessToken.adminUserId)
      .select("name", "email")
      .first();
    const reporterName = reporter?.name || reporter?.email || "Unknown";

    // Send notification email
    try {
      sendgrid.setApiKey(process.env.SENDGRID_API_KEY!);

      const ticketUrl = `${process.env.NEXT_PUBLIC_APP_URL}/admin/support-tickets/${newTicket.id}`;

      await sendgrid.send({
        from: "Voxd Support <support@voxd.ai>",
        to: ["james.beck@voxd.ai"],
        subject: `New Support Ticket #${newTicket.ticketNumber}: ${newTicket.title}`,
        html: `
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>New Support Ticket</title>
          </head>
          <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
            <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f5f5f5;">
              <tr>
                <td align="center" style="padding: 40px 0;">
                  <table role="presentation" style="width: 600px; max-width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <tr>
                      <td style="padding: 40px 40px 20px 40px; text-align: center;">
                        <h1 style="margin: 0; color: #333333; font-size: 24px; font-weight: 600;">New Support Ticket</h1>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 0 40px 20px 40px;">
                        <p style="margin: 0 0 20px 0; color: #555555; font-size: 16px; line-height: 1.5;">A new support ticket has been created:</p>
                        
                        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                          <tr>
                            <td style="padding: 10px; border-bottom: 1px solid #eeeeee; color: #888888; font-size: 14px; width: 120px;">Ticket #</td>
                            <td style="padding: 10px; border-bottom: 1px solid #eeeeee; color: #333333; font-size: 14px; font-weight: 600;">${newTicket.ticketNumber}</td>
                          </tr>
                          <tr>
                            <td style="padding: 10px; border-bottom: 1px solid #eeeeee; color: #888888; font-size: 14px;">Title</td>
                            <td style="padding: 10px; border-bottom: 1px solid #eeeeee; color: #333333; font-size: 14px;">${newTicket.title}</td>
                          </tr>
                          <tr>
                            <td style="padding: 10px; border-bottom: 1px solid #eeeeee; color: #888888; font-size: 14px;">Agent</td>
                            <td style="padding: 10px; border-bottom: 1px solid #eeeeee; color: #333333; font-size: 14px;">${agent.niceName}</td>
                          </tr>
                          <tr>
                            <td style="padding: 10px; border-bottom: 1px solid #eeeeee; color: #888888; font-size: 14px;">Reported By</td>
                            <td style="padding: 10px; border-bottom: 1px solid #eeeeee; color: #333333; font-size: 14px;">${reporterName}</td>
                          </tr>
                          <tr>
                            <td style="padding: 10px; border-bottom: 1px solid #eeeeee; color: #888888; font-size: 14px;">Status</td>
                            <td style="padding: 10px; border-bottom: 1px solid #eeeeee; color: #333333; font-size: 14px;">
                              <span style="background-color: #ef4444; color: white; padding: 2px 8px; border-radius: 4px; font-size: 12px;">Open</span>
                            </td>
                          </tr>
                        </table>

                        <p style="margin: 0 0 10px 0; color: #888888; font-size: 14px;">Description:</p>
                        <div style="background-color: #f8f9fa; border-radius: 6px; padding: 15px; margin-bottom: 20px;">
                          <p style="margin: 0; color: #333333; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">${description}</p>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td align="center" style="padding: 0 40px 30px 40px;">
                        <a href="${ticketUrl}" style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-size: 14px; font-weight: 600;">View Ticket</a>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 20px 40px 40px 40px; border-top: 1px solid #eeeeee;">
                        <p style="margin: 0; color: #999999; font-size: 12px; line-height: 1.5;">This is an automated message from Voxd Support.</p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
          </html>
        `,
        text: `New Support Ticket #${newTicket.ticketNumber}\n\nTitle: ${newTicket.title}\nAgent: ${agent.niceName}\nReported By: ${reporterName}\nStatus: Open\n\nDescription:\n${description}\n\nView ticket: ${ticketUrl}`,
      });
    } catch (emailError) {
      // Log but don't fail the ticket creation if email fails
      console.error(
        "Failed to send support ticket notification email:",
        emailError
      );
    }

    return {
      success: true,
      data: newTicket,
    };
  } catch (error: any) {
    console.error("Error creating support ticket:", error);
    return {
      success: false,
      error: error?.message || "Failed to create support ticket",
    };
  }
};

export default saCreateSupportTicket;
