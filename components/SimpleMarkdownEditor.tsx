"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { useEffect, useRef } from "react";
import {
  Bold,
  Italic,
  List,
  Heading2,
  Heading3,
  Undo,
  Redo,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SimpleMarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function SimpleMarkdownEditor({
  value,
  onChange,
  placeholder = "Start typing...",
  className,
}: SimpleMarkdownEditorProps) {
  const isLocalUpdate = useRef(false);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [2, 3],
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content: value,
    editorProps: {
      attributes: {
        class:
          "prose prose-sm max-w-none focus:outline-none min-h-[200px] p-4 [&_p]:mb-4 [&_h2]:mb-3 [&_h2]:text-2xl [&_h2]:font-bold [&_h3]:mb-2 [&_h3]:text-xl [&_h3]:font-semibold [&_ul]:mb-4 [&_ul]:list-disc [&_ul]:pl-6 [&_li]:mb-1 [&_ul_ul]:list-[circle] [&_ul_ul]:mt-1 [&_ul_ul]:mb-1 [&_ul_ul_ul]:list-[square]",
      },
    },
    onUpdate: ({ editor }) => {
      // Convert to markdown-like format
      isLocalUpdate.current = true;
      const html = editor.getHTML();
      const markdown = htmlToMarkdown(html);
      onChange(markdown);
    },
  });

  // Update editor content when value changes externally
  useEffect(() => {
    if (editor && !isLocalUpdate.current) {
      const html = markdownToHtml(value);
      const currentHtml = editor.getHTML();

      // Only update if the content is actually different
      if (html !== currentHtml) {
        editor.commands.setContent(html, { emitUpdate: false });
      }
    }
    isLocalUpdate.current = false;
  }, [value, editor]);

  if (!editor) {
    return null;
  }

  return (
    <div className={cn("border rounded-md", className)}>
      {/* Toolbar */}
      <div className="flex flex-wrap gap-1 p-2 border-b bg-muted/30">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onMouseDown={(e) => {
            e.preventDefault();
            editor.chain().focus().toggleHeading({ level: 2 }).run();
          }}
          className={cn(
            "h-8 w-8 p-0",
            editor.isActive("heading", { level: 2 }) && "bg-accent",
          )}
        >
          <Heading2 className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onMouseDown={(e) => {
            e.preventDefault();
            editor.chain().focus().toggleHeading({ level: 3 }).run();
          }}
          className={cn(
            "h-8 w-8 p-0",
            editor.isActive("heading", { level: 3 }) && "bg-accent",
          )}
        >
          <Heading3 className="h-4 w-4" />
        </Button>
        <div className="w-px h-8 bg-border mx-1" />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onMouseDown={(e) => {
            e.preventDefault();
            editor.chain().focus().toggleBold().run();
          }}
          className={cn("h-8 w-8 p-0", editor.isActive("bold") && "bg-accent")}
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onMouseDown={(e) => {
            e.preventDefault();
            editor.chain().focus().toggleItalic().run();
          }}
          className={cn(
            "h-8 w-8 p-0",
            editor.isActive("italic") && "bg-accent",
          )}
        >
          <Italic className="h-4 w-4" />
        </Button>
        <div className="w-px h-8 bg-border mx-1" />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onMouseDown={(e) => {
            e.preventDefault();
            editor.chain().focus().toggleBulletList().run();
          }}
          className={cn(
            "h-8 w-8 p-0",
            editor.isActive("bulletList") && "bg-accent",
          )}
        >
          <List className="h-4 w-4" />
        </Button>
        <div className="w-px h-8 bg-border mx-1" />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onMouseDown={(e) => {
            e.preventDefault();
            editor.chain().focus().undo().run();
          }}
          disabled={!editor.can().undo()}
          className="h-8 w-8 p-0"
        >
          <Undo className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onMouseDown={(e) => {
            e.preventDefault();
            editor.chain().focus().redo().run();
          }}
          disabled={!editor.can().redo()}
          className="h-8 w-8 p-0"
        >
          <Redo className="h-4 w-4" />
        </Button>
      </div>

      {/* Editor */}
      <EditorContent editor={editor} />
    </div>
  );
}

// Recursively convert a <ul> HTML string to markdown with indentation
function convertUlToMarkdown(ulHtml: string, depth: number = 0): string {
  const lines: string[] = [];
  const indent = "  ".repeat(depth);

  // Match each <li>...</li> including nested content
  const liRegex = /<li>([\s\S]*?)<\/li>/g;
  let liMatch;

  while ((liMatch = liRegex.exec(ulHtml)) !== null) {
    let liContent = liMatch[1];

    // Check for nested <ul> inside this <li>
    const nestedUlIndex = liContent.indexOf("<ul>");
    if (nestedUlIndex !== -1) {
      // Get the text before the nested <ul>
      const textBefore = liContent.substring(0, nestedUlIndex).trim();
      lines.push(`${indent}- ${textBefore}`);
      // Extract the nested <ul>...</ul> and recursively process
      const nestedUlMatch = liContent.match(/<ul>([\s\S]*)<\/ul>/);
      if (nestedUlMatch) {
        lines.push(convertUlToMarkdown(nestedUlMatch[0], depth + 1));
      }
    } else {
      lines.push(`${indent}- ${liContent.trim()}`);
    }
  }

  return lines.join("\n");
}

// Simple HTML to Markdown conversion
function htmlToMarkdown(html: string): string {
  let markdown = html;

  // Convert bullet lists first (before processing inline elements)
  // Match outermost <ul>...</ul> blocks (not nested ones, those are handled recursively)
  markdown = markdown.replace(
    /<ul>([\s\S]*?)<\/ul>(?![\s\S]*?<\/li>)/g,
    (match) => {
      return convertUlToMarkdown(match) + "\n\n";
    },
  );

  // Fallback: handle any remaining <ul> blocks that weren't caught
  while (markdown.includes("<ul>")) {
    markdown = markdown.replace(/<ul>([\s\S]*?)<\/ul>/g, (match) => {
      return convertUlToMarkdown(match) + "\n\n";
    });
  }

  // Convert headings
  markdown = markdown.replace(/<h2>(.*?)<\/h2>/g, "## $1\n\n");
  markdown = markdown.replace(/<h3>(.*?)<\/h3>/g, "### $1\n\n");

  // Convert paragraphs
  markdown = markdown.replace(/<p>(.*?)<\/p>/g, "$1\n\n");

  // Convert bold
  markdown = markdown.replace(/<strong>(.*?)<\/strong>/g, "**$1**");

  // Convert italic (but not if it's part of a bold marker)
  markdown = markdown.replace(/<em>(.*?)<\/em>/g, "*$1*");

  // Clean up extra newlines
  markdown = markdown.replace(/\n{3,}/g, "\n\n");
  markdown = markdown.trim();

  return markdown;
}

// Get the indentation level of a markdown list line (number of 2-space indents)
function getListIndent(line: string): number {
  const match = line.match(/^(\s*)- /);
  if (!match) return -1;
  return Math.floor(match[1].length / 2);
}

// Simple Markdown to HTML conversion
function markdownToHtml(markdown: string): string {
  if (!markdown) return "";

  let html = markdown;

  // Convert bold (do this before italic to avoid conflicts)
  html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");

  // Convert italic (but not if it's a bullet marker)
  html = html.replace(/(?<!\*)\*(?!\*)([^*]+?)\*(?!\*)/g, "<em>$1</em>");

  // Process lists with nested indentation support
  const lines = html.split("\n");
  const processed: string[] = [];
  let currentDepth = -1; // -1 means not in a list

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const indent = getListIndent(line);

    if (indent >= 0) {
      const content = line.replace(/^\s*- /, "");

      if (currentDepth === -1) {
        // Start a new list
        processed.push("<ul>");
        currentDepth = 0;
      }

      if (indent > currentDepth) {
        // Open nested lists for each level deeper
        for (let d = currentDepth; d < indent; d++) {
          processed.push("<ul>");
        }
      } else if (indent < currentDepth) {
        // Close nested lists and their parent <li> for each level shallower
        for (let d = currentDepth; d > indent; d--) {
          processed.push("</ul>");
        }
      }

      currentDepth = indent;
      processed.push(`<li>${content}</li>`);
    } else {
      // Close all open lists
      if (currentDepth >= 0) {
        for (let d = currentDepth; d > 0; d--) {
          processed.push("</ul>");
        }
        processed.push("</ul>");
        currentDepth = -1;
      }
      processed.push(line);
    }
  }

  // Close any remaining open lists
  if (currentDepth >= 0) {
    for (let d = currentDepth; d > 0; d--) {
      processed.push("</ul>");
    }
    processed.push("</ul>");
  }

  html = processed.join("\n");

  // Convert headings
  html = html.replace(/^## (.*?)$/gm, "<h2>$1</h2>");
  html = html.replace(/^### (.*?)$/gm, "<h3>$1</h3>");

  // Wrap remaining text in paragraphs
  const blocks = html.split("\n\n");
  html = blocks
    .map((block) => {
      block = block.trim();
      if (
        !block ||
        block.startsWith("<h") ||
        block.startsWith("<ul") ||
        block.includes("</ul>") ||
        block.includes("<li>")
      ) {
        return block;
      }
      // Don't wrap single lines that are already wrapped
      if (block.startsWith("<") && block.endsWith(">")) {
        return block;
      }
      return `<p>${block}</p>`;
    })
    .join("\n");

  return html;
}
