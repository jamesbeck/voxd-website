import assert from "node:assert/strict";
import test from "node:test";
import { htmlToMarkdown, markdownToHtml } from "./markdownEditorSerializer";

test("round-trips realistic editor markdown sections", () => {
  const markdown = [
    "## AI Support on WhatsApp",
    "",
    "This concept gives customers a quick way to reach your team, get answers and move enquiries forward without waiting for office hours.",
    "",
    "- Answer routine pre sales questions instantly",
    "- Qualify inbound leads before handing them to staff",
    "- Share product or service information in a clear format",
    "- Capture contact details for follow up",
    "- Reduce repetitive work for the team",
    "",
    "Once the core flow is working well, the chatbot can support more detailed journeys and tighter operational handoffs.",
    "",
    "- Future expansion areas",
    "    - Booking confirmations and reminders",
    "    - Escalation to a human with full context",
    "",
    "### Rollout Approach",
    "",
    "Start with the highest volume enquiries first, then expand once the answers and routing rules are proven.",
  ].join("\n");

  const roundTrippedMarkdown = htmlToMarkdown(markdownToHtml(markdown));

  assert.equal(roundTrippedMarkdown, markdown);
});
