"use server";

import { ServerActionResponse } from "@/types/types";
import { verifyAccessToken } from "@/lib/auth/verifyToken";
import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";
import db from "../database/db";

const saGenerateFaqAnswer = async ({
  question,
  existingAnswer,
  instructions,
}: {
  question: string;
  existingAnswer?: string;
  instructions?: string;
}): Promise<ServerActionResponse> => {
  const accessToken = await verifyAccessToken();

  // Only super admins can generate FAQ answers
  if (!accessToken.superAdmin) {
    return {
      success: false,
      error: "Only super admins can generate FAQ answers",
    };
  }

  if (!question || question.trim() === "") {
    return { success: false, error: "Question is required" };
  }

  // Get the partner's OpenAI API key
  if (!accessToken.partnerId) {
    return {
      success: false,
      error: "No partner associated with your account",
    };
  }

  const partner = await db("partner")
    .where("id", accessToken.partnerId)
    .select("openAiApiKey")
    .first();

  if (!partner?.openAiApiKey) {
    return {
      success: false,
      error:
        "Your partner account does not have an OpenAI API key configured. Please contact an administrator.",
    };
  }

  const openai = createOpenAI({
    apiKey: partner.openAiApiKey,
  });

  const systemPrompt = `You are an expert FAQ writer for Voxd, a company that provides WhatsApp-based AI chatbot services for businesses.

## About Voxd

Voxd provides WhatsApp-based chatbot services that help businesses automate customer interactions.

### How Voxd Works:
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
Voxd runs "workers" - separate scripts (normally AI-based) that monitor conversations and perform actions outside the message reply mechanism:
- Monitor conversation sentiment and notify customer service reps if users are unhappy
- Send user details to sales teams when they show sufficient interest
- Workers can be scheduled to run at specific times after conversations end
- Workers can reply to users, useful for continuing quiet conversations or providing order updates

### Outbound Messaging:
- Voxd can send outbound messages to users
- For first-time contacts: Messages must use Meta-approved templates
- Within 24-hour reply window: Messages can be free-form
- Meta charges for "cold" messages, but replies within the window are free

### Key Benefits:
- 24/7 automated customer support via WhatsApp
- Intelligent AI responses with full context awareness
- Integration with existing business systems
- Proactive customer engagement through workers
- Cost-effective messaging within reply windows

## Your Task

Write a clear, helpful, and professional answer to the FAQ question provided. The answer should:
- Be accurate and informative about Voxd's services
- Be written in a friendly but professional tone
- Be concise but comprehensive
- Use simple language that non-technical users can understand
- Include relevant details that would help the user understand Voxd's capabilities

**Format your answer using Markdown for better readability:**
- Use **bold** for emphasis on key terms or important points
- Use bullet points or numbered lists when listing multiple items
- Use \`inline code\` for technical terms, API names, or specific values
- Use > blockquotes for important notes or tips
- Keep paragraphs short and scannable
- Do NOT use headings (##, ###) - keep answers flowing naturally

If the question is not specifically about Voxd or its services, provide a helpful general answer while relating it back to how Voxd might be relevant where appropriate.`;

  // Build the user prompt based on whether we have existing answer and instructions
  let userPrompt = `Please write an FAQ answer for the following question:\n\n"${question}"`;

  if (existingAnswer && existingAnswer.trim()) {
    userPrompt += `\n\n## Existing Answer\nHere is the current answer that needs to be improved or modified:\n\n${existingAnswer}`;
  }

  if (instructions && instructions.trim()) {
    userPrompt += `\n\n## Instructions\nPlease follow these specific instructions when writing/modifying the answer:\n\n${instructions}`;
  } else if (existingAnswer && existingAnswer.trim()) {
    userPrompt += `\n\nPlease improve this answer while maintaining its core message.`;
  }

  try {
    const { text } = await generateText({
      model: openai("gpt-5.2"),
      system: systemPrompt,
      prompt: userPrompt,
      temperature: 0.7,
    });

    if (!text) {
      return { success: false, error: "Failed to generate answer" };
    }

    return { success: true, data: { answer: text } };
  } catch (error) {
    console.error("Error generating FAQ answer:", error);
    return {
      success: false,
      error: "Failed to generate answer. Please try again.",
    };
  }
};

export default saGenerateFaqAnswer;
