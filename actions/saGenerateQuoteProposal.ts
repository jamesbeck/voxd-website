"use server";

import db from "../database/db";
import { ServerActionResponse } from "@/types/types";
import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";

const getPartnerContext = (partnerName: string) => `## About ${partnerName}

${partnerName} provides WhatsApp-based AI chatbot services that help businesses automate customer interactions.

### How ${partnerName} Works:
1. **WhatsApp Integration**: We use the Meta API to add webhooks to WhatsApp Business Accounts (WABAs)
2. **Message Processing**: Incoming messages are saved to our database and queued for processing
3. **AI-Powered Responses**: Each message is sent to an LLM (Large Language Model) along with:
   - An agent-specific prompt customized for the business
   - Full conversation history
   - User data and history (name, previous orders, etc.)
   - Relevant information from external applications (user account details, addresses, etc.)
   - Tools giving the LLM real-time access to external systems (CRM and back-office systems)
   - Tools providing access to unlimited knowledge documents (policies, FAQs, general information, product lists, menus, etc.)
4. **Response Delivery**: The AI-generated reply is saved and sent back to the user via the Meta Graph API

### Workers System:
${partnerName} runs "workers" - separate AI-powered scripts that monitor conversations and perform actions outside the message reply mechanism:
- Monitor conversation sentiment and notify customer service reps if users are unhappy
- Send user details to sales teams when they show sufficient interest
- Workers can be scheduled to run at specific times after conversations end
- Workers can reply to users, useful for continuing quiet conversations or providing order updates

### Outbound Messaging:
- ${partnerName} can send outbound messages to users
- For first-time contacts: Messages must use Meta-approved templates
- Within 24-hour reply window: Messages can be free-form
- Meta charges for "cold" messages, but replies within the window are free

### Key Benefits:
- 24/7 automated customer support via WhatsApp
- Intelligent AI responses with full context awareness
- Integration with existing business systems
- Proactive customer engagement through workers
- Cost-effective messaging within reply windows
- Where relevant offer multilingual support for diverse customer bases`;

const saGenerateQuoteProposal = async ({
  quoteId,
  extraPrompt,
}: {
  quoteId: string;
  extraPrompt?: string;
}): Promise<ServerActionResponse> => {
  if (!quoteId) {
    return { success: false, error: "Quote ID is required" };
  }

  // Get the quote with all specification details and partner's API key
  const quote = await db("quote")
    .leftJoin("organisation", "quote.organisationId", "organisation.id")
    .leftJoin("partner", "organisation.partnerId", "partner.id")
    .select(
      "quote.*",
      "organisation.name as organisationName",
      "partner.name as partnerName",
      "partner.openAiApiKey",
    )
    .where({ "quote.id": quoteId })
    .first();

  if (!quote) {
    return { success: false, error: "Quote not found" };
  }

  // Check if partner has an OpenAI API key
  if (!quote.openAiApiKey) {
    return {
      success: false,
      error: "Partner does not have an OpenAI API key configured",
    };
  }

  // Get the partner context with dynamic name
  const partnerName = quote.partnerName || "Our company";
  const partnerContext = getPartnerContext(partnerName);

  // Check if there's any specification content to work with
  const hasContent =
    quote.background ||
    quote.objectives ||
    quote.dataSourcesAndIntegrations ||
    quote.otherNotes;

  if (!hasContent) {
    return {
      success: false,
      error:
        "Please add some specification details before generating the proposal",
    };
  }

  const openai = createOpenAI({
    apiKey: quote.openAiApiKey,
  });

  // Build the specification context
  const specificationContext = `
## Quote Details
- **Title**: ${quote.title}
- **Organisation**: ${quote.organisationName}

## Provided Specification

${quote.background ? `### Background\n${quote.background}\n` : ""}
${quote.objectives ? `### Objectives\n${quote.objectives}\n` : ""}
${quote.dataSourcesAndIntegrations ? `### Data Sources & Integrations\n${quote.dataSourcesAndIntegrations}\n` : ""}
${quote.otherNotes ? `### Other Notes\n${quote.otherNotes}\n` : ""}
`.trim();

  try {
    // Generate the introduction
    const { text: introduction } = await generateText({
      model: openai("gpt-5.2"),
      system: `You are an expert proposal writer for ${partnerName}, a company that provides WhatsApp-based AI chatbot services.

${partnerContext}

The above context is for YOUR UNDERSTANDING ONLY of what ${partnerName} does. Do NOT automatically include all ${partnerName} capabilities in the proposal.

Your task is to write a compelling, professional INTRODUCTION section for a client proposal. This introduction should:
- Welcome the client and thank them for their interest
- Briefly explain that we provide WhatsApp AI chatbot solutions
- Set the stage for the detailed specification that follows
- Be warm, professional, and confident
- Reference ONLY the client's specific needs as mentioned in their specification
- Be around 2-3 paragraphs
- Avoid use of hyphens in the content
- Do not use the Oxford comma before 'and' in a list

IMPORTANT: Only reference features and capabilities that the client has specifically mentioned or requested. Do not add optional features or suggest additional capabilities beyond what they've asked for.

Write in Markdown format. Use **bold** for emphasis. Do not use headings in this section - it will be displayed under an "Introduction" heading.${
        extraPrompt
          ? `\n\nADDITIONAL INSTRUCTIONS FROM USER:\n${extraPrompt}`
          : ""
      }`,
      prompt: `Please write an introduction for the following proposal:\n\n${specificationContext}`,
      temperature: 0.7,
    });

    // Generate the detailed specification
    const { text: specification } = await generateText({
      model: openai("gpt-5.2"),
      system: `You are an expert proposal writer for ${partnerName}, a company that provides WhatsApp-based AI chatbot services.

${partnerContext}

The above context is for YOUR UNDERSTANDING ONLY of what ${partnerName} does. Do NOT automatically include all ${partnerName} capabilities in the proposal.

Your task is to write a detailed, professional SPECIFICATION section for a client proposal. Based on the client's provided information, you should:
- Rewrite and expand on ONLY what the client has provided, using professional language
- Do NOT add features, integrations, or capabilities that the client hasn't mentioned
- Do NOT make assumptions about what the client might want
- Explain how we will deliver what they've specifically asked for
- Use clear sections with appropriate Markdown headings (##, ###)
- Include bullet points where appropriate
- Be clear and professional - the client should understand what they're getting
- Stay focused on their stated requirements only
- Avoid use of hyphens in the content

CRITICAL: Only include what the client has explicitly written in their specification. If they haven't mentioned workers, don't add workers. If they haven't mentioned CRM integration, don't add CRM integration. Stick strictly to their requirements.

Write in Markdown format. Use appropriate headings (## for main sections, ### for subsections), **bold** for emphasis, bullet points for lists.${
        extraPrompt
          ? `\n\nADDITIONAL INSTRUCTIONS FROM USER:\n${extraPrompt}`
          : ""
      }`,
      prompt: `Please write a detailed specification based on the following information:\n\n${specificationContext}`,
      temperature: 0.7,
    });

    if (!introduction || !specification) {
      return { success: false, error: "Failed to generate proposal content" };
    }

    // Save the generated content to the database
    await db("quote").where({ id: quoteId }).update({
      generatedProposalIntroduction: introduction,
      generatedSpecification: specification,
    });

    return {
      success: true,
      data: {
        generatedProposalIntroduction: introduction,
        generatedSpecification: specification,
      },
    };
  } catch (error) {
    console.error("Error generating quote proposal:", error);
    return {
      success: false,
      error: "Failed to generate proposal. Please try again.",
    };
  }
};

export default saGenerateQuoteProposal;
