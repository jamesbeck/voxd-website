import { marked } from "marked";
import TurndownService from "turndown";

const turndownService = new TurndownService({
  headingStyle: "atx",
  bulletListMarker: "-",
  emDelimiter: "*",
  strongDelimiter: "**",
});

function normalizeMarkdown(markdown: string): string {
  return markdown
    .replace(/\r\n/g, "\n")
    .replace(/^(\s*)-\s+/gm, "$1- ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function markdownToHtml(markdown: string): string {
  if (!markdown.trim()) {
    return "";
  }

  return marked.parse(markdown, {
    async: false,
    gfm: true,
  }) as string;
}

export function htmlToMarkdown(html: string): string {
  if (!html.trim()) {
    return "";
  }

  return normalizeMarkdown(turndownService.turndown(html));
}
