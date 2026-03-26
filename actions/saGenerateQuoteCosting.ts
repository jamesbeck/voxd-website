"use server";

import db from "../database/db";
import { createOpenAI } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";
import { CostingBreakdown } from "@/types/types";
import sendgrid from "@sendgrid/mail";
import { verifyAccessToken } from "@/lib/auth/verifyToken";

const HOURLY_RATE = 100;
const MONTHLY_BASE = 150;
const MONTHLY_PER_INTEGRATION = 50;
const HOURS_PER_DAY = 5;

const costingSchema = z.object({
  integrations: z.array(
    z.object({
      name: z
        .string()
        .describe(
          "The name of the integration or external service, e.g. 'Microsoft 365', 'Salesforce', 'Google Workspace'",
        ),
      tasks: z.array(
        z.object({
          name: z
            .string()
            .describe(
              "The name of the task or function, e.g. 'Initial Setup & Tooling', 'Check Calendar Availability', 'Create Lead'",
            ),
          hours: z
            .number()
            .describe(
              "Estimated hours for a human developer to code this function/tool",
            ),
          description: z
            .string()
            .describe(
              "A description of what this function/tool does and justification for the time estimate, e.g. 'Queries the Microsoft Graph API to check a user's calendar availability for a given date range. Requires OAuth2 setup, pagination handling, and timezone normalisation.'",
            ),
        }),
      ),
    }),
  ),
});

const saGenerateQuoteCosting = async ({
  quoteId,
  source,
}: {
  quoteId: string;
  source: "concept" | "proposal";
}): Promise<{
  success: boolean;
  error?: string;
  data?: {
    costingBreakdown: CostingBreakdown;
    setupFeeVoxdCost: number;
    monthlyFeeVoxdCost: number;
    buildDays: number;
  };
}> => {
  if (!quoteId) {
    return { success: false, error: "Quote ID is required" };
  }

  const quote = await db("quote")
    .leftJoin("organisation", "quote.organisationId", "organisation.id")
    .leftJoin("partner", "organisation.partnerId", "partner.id")
    .select(
      "quote.*",
      "organisation.name as organisationName",
      "partner.openAiApiKey",
      "partner.name as partnerName",
    )
    .where({ "quote.id": quoteId })
    .first();

  if (!quote) {
    return { success: false, error: "Quote not found" };
  }

  if (!quote.openAiApiKey) {
    return {
      success: false,
      error: "Partner does not have an OpenAI API key configured",
    };
  }

  // Determine input text based on source
  const inputText =
    source === "concept"
      ? [quote.generatedConceptIntroduction, quote.generatedConcept]
          .filter(Boolean)
          .join("\n\n")
      : [quote.generatedProposalIntroduction, quote.generatedSpecification]
          .filter(Boolean)
          .join("\n\n");

  if (!inputText) {
    return {
      success: false,
      error: `No ${source} content available to estimate costing`,
    };
  }

  const openai = createOpenAI({
    apiKey: quote.openAiApiKey,
  });

  // Build existing costing context for consistency
  const existingCosting = quote.costingBreakdown as CostingBreakdown | null;
  const existingCostingContext = existingCosting
    ? `\n\n## Existing Costing Breakdown (for consistency)

The following is the previous costing breakdown. You should use this as a baseline and only change what has actually changed based on the updated ${source}. Do not change estimates for integrations or functions that have not changed in the ${source}. This is to ensure pricing consistency.

\`\`\`json
${JSON.stringify(existingCosting.integrations, null, 2)}
\`\`\`

Previous calculation was based on: ${existingCosting.costingCalculatedFrom}`
    : "";

  const systemPrompt = `You are an expert at estimating development costs for WhatsApp AI chatbot integrations. Your job is to analyse a concept or proposal for an AI chatbot and identify:

1. All external integrations/services the chatbot will need to connect to (e.g. Microsoft 365, Salesforce, Google Workspace, custom APIs, etc.)
2. For each integration, the individual tools/functions that a developer will need to code for the AI agent to interact with that service
3. An honest time estimate in hours for a human developer to code each function

Rules:
- Every integration MUST include an "Initial Setup & Tooling" task that covers authentication setup, API client configuration, and basic tooling. This is typically 2-4 hours depending on the complexity of the service.
- Each additional function/tool should represent a distinct capability the AI agent needs (e.g. "Check Calendar Availability", "Create Lead", "Send Email").
- Time estimates should be LEAN. These functions are being built by experienced developers who work with these APIs daily, using existing tooling and patterns. Do not overestimate.
- Be thorough — identify ALL integrations mentioned or implied in the text.
- If the text mentions vague integrations (e.g. "CRM integration"), make reasonable assumptions about what functions would be needed.
- For each task, provide a clear description of what the function does and justify the time estimate.

CALIBRATION EXAMPLES — Use these as a guide for typical time estimates:

Google Workspace / Gmail Calendar:
- Initial Setup & Tooling: 2 hours (OAuth2 config, API client, basic auth flow)
- Check availability of a specific user: 0.5 hours (query calendar API, parse free/busy slots)
- Save new calendar event: 1.5 hours (create event with attendees, location, reminders)

Salesforce CRM:
- Initial Setup & Tooling: 3 hours (OAuth2 connected app, API client, token refresh)
- Check if contact already exists by email: 0.5 hours (SOQL query, parse response)
- Create lead and add all opportunity information: 2 hours (create lead, create opportunity, link records)

Time estimates can be as low as 0.25 hours (15 minutes) for very simple tasks. Most simple read/query functions take 0.5-1 hour. Write/create functions typically take 1-2 hours. Setup tasks typically take 2-3 hours. Only complex multi-step functions with significant business logic should exceed 2 hours.

IMPORTANT — Do NOT include any of the following as integrations. These are already part of the existing platform infrastructure and must be excluded:
- WhatsApp or the WhatsApp Business API (Meta API)
- Any other messaging channels (web chat, Telegram, SMS, etc.)
- OpenAI, or any other LLM/AI model provider
- Any infrastructure for managing the chatbot itself (hosting, deployment, monitoring, message processing, etc.)
- The chatbot platform or management portal
- Knowledge ingestion from URLs, PDFs, Word documents, other files, or manual user entry — this capability already exists in the platform

ONLY include integrations with the client's specific external applications, third-party services, or their tenancies with other providers (e.g. their CRM, their calendar system, their booking platform, their accounting software, etc.). Assume all core chatbot infrastructure already exists.${existingCostingContext}`;

  const userPrompt = `Please analyse the following ${source} and provide a detailed breakdown of all integrations and functions required:\n\n${inputText}`;

  try {
    const { object } = await generateObject({
      model: openai("gpt-5.2"),
      schema: costingSchema,
      system: systemPrompt,
      prompt: userPrompt,
    });

    // Calculate totals server-side to avoid AI maths errors
    const totalIntegrationTime = object.integrations.reduce(
      (total, integration) =>
        total + integration.tasks.reduce((sum, task) => sum + task.hours, 0),
      0,
    );

    const buildDays = Math.ceil(totalIntegrationTime / HOURS_PER_DAY);

    const costingBreakdown: CostingBreakdown = {
      integrations: object.integrations,
      totalIntegrationTime,
      totalIntegrationCost: totalIntegrationTime * HOURLY_RATE,
      totalMonthly:
        MONTHLY_BASE + object.integrations.length * MONTHLY_PER_INTEGRATION,
      costingCalculatedFrom: source,
    };

    // Save breakdown and update Voxd cost fields
    await db("quote")
      .where({ id: quoteId })
      .update({
        costingBreakdown: JSON.stringify(costingBreakdown),
        setupFeeVoxdCost: costingBreakdown.totalIntegrationCost,
        monthlyFeeVoxdCost: costingBreakdown.totalMonthly,
        buildDays,
      });

    // Send email notification with breakdown
    try {
      sendgrid.setApiKey(process.env.SENDGRID_API_KEY!);

      // Get current user info
      let userName = "System";
      try {
        const accessToken = await verifyAccessToken(false);
        if (accessToken) {
          userName = accessToken.name || accessToken.email;
        }
      } catch {
        // No user context (e.g. called from background process)
      }

      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001";
      const quoteUrl = `${appUrl}/admin/quotes/${quoteId}?tab=pricing`;

      const integrationRows = costingBreakdown.integrations
        .map((integration) => {
          const integrationHours = integration.tasks.reduce(
            (sum, t) => sum + t.hours,
            0,
          );
          const taskRows = integration.tasks
            .map(
              (task) =>
                `<tr>
                  <td style="padding: 6px 10px; border-bottom: 1px solid #eeeeee; color: #555555; font-size: 13px; padding-left: 30px;">${task.name}</td>
                  <td style="padding: 6px 10px; border-bottom: 1px solid #eeeeee; color: #555555; font-size: 13px; text-align: right;">${task.hours}h</td>
                </tr>`,
            )
            .join("");
          return `<tr>
              <td style="padding: 8px 10px; border-bottom: 1px solid #dddddd; color: #333333; font-size: 14px; font-weight: 600;">${integration.name}</td>
              <td style="padding: 8px 10px; border-bottom: 1px solid #dddddd; color: #333333; font-size: 14px; font-weight: 600; text-align: right;">${integrationHours}h</td>
            </tr>${taskRows}`;
        })
        .join("");

      await sendgrid.send({
        from: "Voxd <notifications@voxd.ai>",
        to: ["james.beck@voxd.ai"],
        subject: `Quote Costing Updated: ${quote.title}`,
        html: `
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
            <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f5f5f5;">
              <tr>
                <td align="center" style="padding: 40px 0;">
                  <table role="presentation" style="width: 100%; max-width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <tr>
                      <td style="padding: 40px 40px 20px 40px; text-align: center;">
                        <h1 style="margin: 0; color: #333333; font-size: 24px; font-weight: 600;">Quote Costing Updated</h1>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding: 0 40px 20px 40px;">
                        <p style="margin: 0 0 10px 0; color: #555555; font-size: 16px; line-height: 1.5;"><strong>${quote.title}</strong> (${quote.organisationName})</p>
                        <p style="margin: 0 0 5px 0; color: #888888; font-size: 14px;">Partner: ${quote.partnerName || "Unknown"}</p>
                        <p style="margin: 0 0 5px 0; color: #888888; font-size: 14px;">Triggered by: ${userName}</p>
                        <p style="margin: 0 0 20px 0; color: #888888; font-size: 14px;">Calculated from ${source}</p>
                        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                          <thead>
                            <tr>
                              <th style="padding: 8px 10px; border-bottom: 2px solid #333333; text-align: left; font-size: 14px; color: #333333;">Integration / Task</th>
                              <th style="padding: 8px 10px; border-bottom: 2px solid #333333; text-align: right; font-size: 14px; color: #333333;">Hours</th>
                            </tr>
                          </thead>
                          <tbody>
                            ${integrationRows}
                          </tbody>
                        </table>
                        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; background-color: #f9f9f9; border-radius: 6px;">
                          <tr>
                            <td style="padding: 12px 16px; font-size: 14px; color: #555555;">Total Hours</td>
                            <td style="padding: 12px 16px; font-size: 14px; color: #333333; font-weight: 600; text-align: right;">${costingBreakdown.totalIntegrationTime}h</td>
                          </tr>
                          <tr>
                            <td style="padding: 12px 16px; font-size: 14px; color: #555555;">Setup Cost</td>
                            <td style="padding: 12px 16px; font-size: 14px; color: #333333; font-weight: 600; text-align: right;">&pound;${costingBreakdown.totalIntegrationCost.toLocaleString()}</td>
                          </tr>
                          <tr>
                            <td style="padding: 12px 16px; font-size: 14px; color: #555555;">Monthly Cost</td>
                            <td style="padding: 12px 16px; font-size: 14px; color: #333333; font-weight: 600; text-align: right;">&pound;${costingBreakdown.totalMonthly.toLocaleString()}</td>
                          </tr>
                          <tr>
                            <td style="padding: 12px 16px; font-size: 14px; color: #555555;">Build Days</td>
                            <td style="padding: 12px 16px; font-size: 14px; color: #333333; font-weight: 600; text-align: right;">${buildDays}</td>
                          </tr>
                        </table>
                        <div style="text-align: center; margin-top: 20px;">
                          <a href="${quoteUrl}" style="display: inline-block; padding: 12px 24px; background-color: #333333; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 14px; font-weight: 500;">View Quote</a>
                        </div>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
          </html>`,
      });
    } catch (emailError) {
      // Don't fail the costing if email fails
      console.error("Error sending costing notification email:", emailError);
    }

    return {
      success: true,
      data: {
        costingBreakdown,
        setupFeeVoxdCost: costingBreakdown.totalIntegrationCost,
        monthlyFeeVoxdCost: costingBreakdown.totalMonthly,
        buildDays,
      },
    };
  } catch (error) {
    console.error("Error generating quote costing:", error);
    return {
      success: false,
      error: "Failed to generate costing estimate",
    };
  }
};

export default saGenerateQuoteCosting;
