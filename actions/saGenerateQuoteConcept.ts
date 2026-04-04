"use server";

import db from "../database/db";
import { ServerActionResponse } from "@/types/types";
import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";
import saGenerateQuoteCosting from "./saGenerateQuoteCosting";

const getPartnerContext = (partnerName: string) => `## What is ${partnerName}?

${partnerName} provides a powerful, enterprise-ready platform for delivering intelligent, automated conversations through WhatsApp. By combining WhatsApp Business integration, large language models (LLMs), and deep system integrations, ${partnerName} enables organisations to communicate with customers in a natural, personal, and highly effective way—without requiring users to download apps, create accounts, or learn new interfaces.

### Key Platform Capabilities

**WhatsApp Integration**
- Direct integration with WhatsApp for Business using the Meta API
- Secure webhook configuration for real-time message reception
- Reliable message capture, storage, and processing

**AI Agent Capabilities**
- Rich contextual prompting with conversation history
- User data and historical context (preferences, previous orders)
- Includes image and file handling, allowing customers to send photos, documents, and more that the AI can understand and respond to
- Real-time integration with external systems (CRM, back-office)
- Access to unlimited knowledge sources (FAQs, policies, product catalogues)
- Tool-enabled intelligence for querying and updating systems
- Multilingual support for global audiences

**AI Workers and Background Automation**
- Sentiment monitoring to detect unhappy users
- Sales qualification to identify high-intent prospects
- Conversation follow-ups for quiet conversations
- Operational updates (order confirmations, delivery updates)

**Outbound Marketing Messages**
- Send targeted marketing messages to customers via WhatsApp
- Recipients can reply directly to marketing messages, which triggers a live conversation with the AI agent
- This two way interaction is unique to WhatsApp and far more powerful than traditional email or SMS marketing
- Ideal for promotions, product launches, re-engagement campaigns and personalised offers

**Why WhatsApp?**
- No apps to download
- No new logins or passwords
- Familiar, personal, and trusted user experience
- Extremely high open and response rates

**Management Portal**
- Access anywhere, fully responsive
- Unlimited admin users
- Pause & takeover for human agent intervention
- Usage analytics and user insights
- Conversation analysis and AI decision visibility
- Data export for reporting or compliance

**Security & Reliability**
- Enterprise-grade security
- Regular penetration testing
- Progression towards ISO 27001 and ISO 42001 certification
- Fully managed infrastructure with 24/7 availability

**Integration Capabilities**
- Seamless integration with any external application
- Google Workspace, Microsoft 365, CRM systems
- Custom back-office and accounting systems
- Real-time data synchronisation`;

const saGenerateQuoteConcept = async ({
  quoteId,
  extraPrompt,
  mode = "scratch",
  existingIntroduction,
  existingConcept,
}: {
  quoteId: string;
  extraPrompt?: string;
  mode?: "scratch" | "amend";
  existingIntroduction?: string;
  existingConcept?: string;
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

  const partnerName = quote.partnerName || "Our company";

  // Get knowledge sources linked to this quote
  const quoteKnowledgeSources = await db("quoteKnowledgeSource")
    .leftJoin(
      "knowledgeSource",
      "quoteKnowledgeSource.knowledgeSourceId",
      "knowledgeSource.id",
    )
    .where("quoteKnowledgeSource.quoteId", quoteId)
    .select(
      "knowledgeSource.name as itemName",
      "quoteKnowledgeSource.otherName",
      "quoteKnowledgeSource.note",
    )
    .orderBy("quoteKnowledgeSource.createdAt", "asc");

  // Get integrations linked to this quote
  const quoteIntegrations = await db("quoteIntegration")
    .leftJoin("integration", "quoteIntegration.integrationId", "integration.id")
    .where("quoteIntegration.quoteId", quoteId)
    .select(
      "integration.name as itemName",
      "quoteIntegration.otherName",
      "quoteIntegration.note",
    )
    .orderBy("quoteIntegration.createdAt", "asc");

  // Check if there's any specification content to work with
  const hasContent =
    quote.background ||
    quote.objectives ||
    quoteKnowledgeSources.length > 0 ||
    quoteIntegrations.length > 0 ||
    quote.otherNotes;

  if (!hasContent) {
    return {
      success: false,
      error:
        "Please add some specification details before generating the concept",
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

## Client Information

${quote.background ? `### Background\n${quote.background}\n` : ""}
${quote.objectives ? `### Objectives\n${quote.objectives}\n` : ""}
${
  quoteKnowledgeSources.length > 0
    ? `### Knowledge Sources\n${quoteKnowledgeSources
        .map((ks: any) => {
          const name = ks.itemName || ks.otherName;
          return ks.note ? `- **${name}**: ${ks.note}` : `- **${name}**`;
        })
        .join("\n")}\n`
    : ""
}
${
  quoteIntegrations.length > 0
    ? `### Integrations\n${quoteIntegrations
        .map((i: any) => {
          const name = i.itemName || i.otherName;
          return i.note ? `- **${name}**: ${i.note}` : `- **${name}**`;
        })
        .join("\n")}\n`
    : ""
}
${quote.otherNotes ? `### Other Notes\n${quote.otherNotes}\n` : ""}
`.trim();

  try {
    // Get the partner context with dynamic name
    const partnerContext = getPartnerContext(partnerName);

    // Build amend-specific context if in amend mode
    const isAmendMode =
      mode === "amend" && existingIntroduction && existingConcept;

    // Generate the concept introduction
    const introSystemPrompt = isAmendMode
      ? `You are an expert sales consultant for ${partnerName}, a company that provides WhatsApp-based AI chatbot services.

${partnerContext}

Your task is to AMEND an existing concept introduction based on the user's instructions. You have the existing introduction and should modify it according to their specific requests while maintaining the overall structure and purpose.

The introduction should:
- Be friendly and welcoming, addressing the client by their organisation name
- Acknowledge their business and industry based on the background provided
- Express genuine excitement about the potential to help transform their customer communications
- Set the stage for explaining how AI chatbots can benefit their specific business
- Be no more than 2 paragraphs
- Be conversational but professional

IMPORTANT RULES:
- Do NOT thank them for their time or for meeting with us - we have never met them
- Do NOT assume we have had any prior conversations or meetings
- Do NOT ask any questions - this is not a consultation or discovery session
- Do NOT include example conversations or WhatsApp message flows
- This is a written concept document, not a live presentation
- Avoid use of hyphens in the content
- Do not use the Oxford comma before 'and' in a list

Write in Markdown format. Use **bold** for emphasis where appropriate. Do not use headings - this will be displayed under an "Introduction" heading.

EXISTING INTRODUCTION TO AMEND:
${existingIntroduction}

USER'S AMENDMENT INSTRUCTIONS:
${extraPrompt || "Please improve and refine the existing content."}`
      : `You are an expert sales consultant for ${partnerName}, a company that provides WhatsApp-based AI chatbot services.

${partnerContext}

Your task is to write a warm, engaging INTRODUCTION for a concept to a potential client. This introduction should:
- Be friendly and welcoming, addressing the client by their organisation name
- Acknowledge their business and industry based on the background provided
- Express genuine excitement about the potential to help transform their customer communications
- Set the stage for explaining how AI chatbots can benefit their specific business
- Be no more than 2 paragraphs
- Be conversational but professional

IMPORTANT RULES:
- Do NOT thank them for their time or for meeting with us - we have never met them
- Do NOT assume we have had any prior conversations or meetings
- Do NOT ask any questions - this is not a consultation or discovery session
- Do NOT include example conversations or WhatsApp message flows
- This is a written concept document, not a live presentation
- Avoid use of hyphens in the content
- Do not use the Oxford comma before 'and' in a list

Write in Markdown format. Use **bold** for emphasis where appropriate. Do not use headings - this will be displayed under an "Introduction" heading.${extraPrompt ? `\n\nADDITIONAL INSTRUCTIONS FROM USER:\n${extraPrompt}` : ""}`;

    const introPrompt = isAmendMode
      ? `Please amend the existing concept introduction for the following client based on the amendment instructions provided:\n\n${specificationContext}`
      : `Please write a concept introduction for the following client:\n\n${specificationContext}`;

    const { text: conceptIntro } = await generateText({
      model: openai("gpt-5.4"),
      system: introSystemPrompt,
      prompt: introPrompt,
    });

    // Build the main concept system prompt
    const mainConceptSystemPrompt = isAmendMode
      ? `You are an expert sales consultant for ${partnerName}, a company that provides WhatsApp-based AI chatbot services.

${partnerContext}

Your task is to AMEND an existing concept based on the user's instructions. You have the existing concept and should modify it according to their specific requests while maintaining the overall structure and coverage of key themes.

The concept should cover themes like:
- What a chatbot could do for their business
- Saving money and time while improving customer experience
- Getting ahead of the competition with AI
- The benefits of WhatsApp vs other channels
- Seamless integration capabilities
- Security and safeguards
- Additional benefits
- Outbound marketing messages (when relevant to the client's business) — WhatsApp can be used for outbound marketing, and uniquely, recipients can reply directly to these messages which triggers a live conversation with the AI agent
- Future potential
- Summary / Conclusion

IMPORTANT RULES:
- Do NOT thank them for their time or for meeting with us - we have never met them
- Do NOT assume we have had any prior conversations or meetings
- Do NOT ask any questions - this is not a consultation or discovery session
- Do NOT include example conversations or WhatsApp message flows (these will be handled separately)
- Do NOT include mock-ups or sample dialogues
- This is a written concept document, not a live presentation
- Avoid use of hyphens in the content
- Do not use the Oxford comma before 'and' in a list
- ONLY reference knowledge sources and integrations that are explicitly listed in the specification. Do NOT invent, assume or suggest any additional data sources, integrations or system connections beyond what is provided. The chatbot will only have access to the listed knowledge sources and integrations.

FORMATTING RULES:
- Structure the concept with clear Markdown headings (## for main sections and ### for subsections).
- Use a mix of short paragraphs and bullet points. Do not rely solely on bullets — vary the format across sections.
- No single bullet list should exceed roughly 12 items. If a topic has many points, break it into subsections using ### subtitles with shorter lists or paragraphs under each.
- Each section should be concise and scannable — either a few short paragraphs, or a brief intro sentence followed by 3 to 12 bullet points.
- Be enthusiastic but not pushy.

EXISTING CONCEPT TO AMEND:
${existingConcept}

USER'S AMENDMENT INSTRUCTIONS:
${extraPrompt || "Please improve and refine the existing content."}`
      : `You are an expert sales consultant for ${partnerName}, a company that provides WhatsApp-based AI chatbot services.

${partnerContext}

Your task is to write a compelling, persuasive concept that helps the client understand how a WhatsApp AI chatbot could transform their business. Based on their background and industry, you should cover the key themes below. However, you have creative freedom to choose appropriate section headings that fit the specific context and industry of this client. Don't feel constrained to use the exact headings below - adapt them to sound natural and relevant for this particular business.

**Key themes to address (use appropriate headings for the context):**

1. **What a chatbot could do for their business**
   - Focus on logical, specific features relevant to their sector
   - Describe the types of enquiries and tasks it could handle
   - Explain how it would work in their specific context
   - Where relevant offer multilingual support for diverse customer bases

2. **Saving money and time while improving customer experience**
   - Identify specific areas where they can reduce costs (staffing, response times)
   - Highlight time savings for both the business and their customers
   - Explain how this improves the customer experience with 24/7 availability

3. **Getting ahead of the competition with AI**
   - Position this as an easy, accessible way to introduce AI into their business
   - Emphasise the competitive advantage of early adoption
   - Highlight how this sets them apart from competitors still using traditional channels

4. **The benefits of WhatsApp vs other channels**
   - No apps to download - customers already have WhatsApp
   - No new logins or passwords to remember
   - Personal, familiar experience that customers trust
   - Higher engagement rates than email or web forms
   - Instant, convenient communication on the go

5. **Seamless integration capabilities**
   - Integration with external applications (CRM, booking systems, inventory)
   - Google Workspace and Microsoft 365 connectivity
   - Connection to existing back-office and accounting systems
   - Real-time data synchronisation across platforms

6. **Security and safeguards**
   - Enterprise-grade security measures
   - AI guardrails to ensure appropriate responses
   - Data protection and privacy compliance
   - Regular security testing and monitoring
   - Clear escalation paths to human agents when needed

7. **Additional benefits**
   - Proactive customer engagement through AI workers
   - Analytics and insights into customer interactions
   - Continuous improvement through feedback loops
   - Scalability to handle growth without proportional cost increase

8. **Outbound marketing messages** (include when relevant to the client's business)
   - WhatsApp can be used for outbound marketing messages such as promotions, product launches, re-engagement campaigns and personalised offers
   - What makes this unique is that recipients can reply directly to these marketing messages, which triggers a live conversation with the AI agent
   - This transforms traditional one way marketing into an interactive, two way experience
   - Far more engaging than email or SMS where replies typically go nowhere
   - Combine with AI intelligence to provide personalised follow-up based on the customer's response

9. **Future potential**
   - Describe realistic but more advanced future capabilities that could be added to the chatbot over time
   - Think about features that would be natural next steps once the initial chatbot is established
   - Consider industry-specific advanced use cases (e.g., predictive recommendations, voice integration, proactive outreach campaigns)
   - Keep suggestions grounded and achievable, but show the exciting growth potential
   - Frame this as a journey - starting with solid foundations and growing into more sophisticated capabilities

10. **Summary / Conclusion**
   - End with a sincere, heartfelt message about how genuinely excited we would be to work on building a chatbot for their business
   - Express enthusiasm for the potential partnership
   - Keep it warm and authentic, not salesy
   - Do NOT use "Closing" as a heading - use "Summary", "Conclusion", "In Summary", "Looking Forward", or similar

IMPORTANT RULES:
- Do NOT thank them for their time or for meeting with us - we have never met them
- Do NOT assume we have had any prior conversations or meetings
- Do NOT ask any questions - this is not a consultation or discovery session
- Do NOT include example conversations or WhatsApp message flows (these will be handled separately)
- Do NOT include mock-ups or sample dialogues
- This is a written concept document, not a live presentation
- Avoid use of hyphens in the content
- Do not use the Oxford comma before 'and' in a list
- ONLY reference knowledge sources and integrations that are explicitly listed in the specification. Do NOT invent, assume or suggest any additional data sources, integrations or system connections beyond what is provided. The chatbot will only have access to the listed knowledge sources and integrations.

FORMATTING RULES:
- Structure the concept with clear Markdown headings (## for main sections and ### for subsections).
- Use a mix of short paragraphs and bullet points. Do not rely solely on bullets — vary the format across sections.
- No single bullet list should exceed roughly 12 items. If a topic has many points, break it into subsections using ### subtitles with shorter lists or paragraphs under each.
- Each section should be concise and scannable — either a few short paragraphs, or a brief intro sentence followed by 3 to 12 bullet points.
- Be enthusiastic but not pushy. The goal is to help the client see the genuine value and potential for their specific business.

Make sure to tailor every section to their specific industry and needs based on the background information provided.${extraPrompt ? `\n\nADDITIONAL INSTRUCTIONS FROM USER:\n${extraPrompt}` : ""}`;

    const mainConceptPrompt = isAmendMode
      ? `Please amend the existing concept for the following client based on the amendment instructions provided:\n\n${specificationContext}`
      : `Please write a concept for the following client:\n\n${specificationContext}`;

    // Generate the main concept
    const { text: concept } = await generateText({
      model: openai("gpt-5.4"),
      system: mainConceptSystemPrompt,
      prompt: mainConceptPrompt,
    });

    if (!conceptIntro || !concept) {
      return { success: false, error: "Failed to generate concept content" };
    }

    // Save the generated content to the database
    await db("quote").where({ id: quoteId }).update({
      generatedConceptIntroduction: conceptIntro,
      generatedConcept: concept,
    });

    // Auto-generate costing breakdown based on the concept
    await saGenerateQuoteCosting({ quoteId, source: "concept" });

    return {
      success: true,
      data: {
        generatedConceptIntroduction: conceptIntro,
        generatedConcept: concept,
      },
    };
  } catch (error) {
    console.error("Error generating quote concept:", error);
    return {
      success: false,
      error: "Failed to generate concept. Please try again.",
    };
  }
};

export default saGenerateQuoteConcept;
