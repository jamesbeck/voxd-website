"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import saSearchMentionableUsers from "@/actions/saSearchMentionableUsers";

type MentionableUser = {
  id: string;
  name: string | null;
  email: string;
};

interface MentionTextareaProps {
  ticketId: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

// Parse value string into segments (text and mentions)
type Segment =
  | { type: "text"; content: string }
  | { type: "mention"; displayName: string; userId: string };

function parseValueToSegments(value: string): Segment[] {
  const mentionRegex = /@\[([^\]]+)\]\(([^)]+)\)/g;
  const segments: Segment[] = [];
  let lastIndex = 0;
  let match;

  while ((match = mentionRegex.exec(value)) !== null) {
    if (match.index > lastIndex) {
      segments.push({
        type: "text",
        content: value.slice(lastIndex, match.index),
      });
    }
    segments.push({
      type: "mention",
      displayName: match[1],
      userId: match[2],
    });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < value.length) {
    segments.push({ type: "text", content: value.slice(lastIndex) });
  }

  return segments;
}

function segmentsToValue(segments: Segment[]): string {
  return segments
    .map((seg) =>
      seg.type === "text" ? seg.content : `@[${seg.displayName}](${seg.userId})`
    )
    .join("");
}

export default function MentionTextarea({
  ticketId,
  value,
  onChange,
  placeholder,
  className,
}: MentionTextareaProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<MentionableUser[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [mentionSearch, setMentionSearch] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const [suggestionPosition, setSuggestionPosition] = useState({
    top: 0,
    left: 0,
  });
  const isComposingRef = useRef(false);
  // Store the saved selection for when clicking on suggestions
  const savedSelectionRef = useRef<{ node: Node; offset: number } | null>(null);

  const segments = parseValueToSegments(value);

  const searchUsers = useCallback(
    async (search: string) => {
      setIsSearching(true);
      const result = await saSearchMentionableUsers({ ticketId, search });
      setIsSearching(false);
      if (result.success) {
        setSuggestions(result.data);
        setSelectedIndex(0);
      }
    },
    [ticketId]
  );

  // Debounced search
  useEffect(() => {
    if (!showSuggestions) return;
    const timer = setTimeout(() => {
      searchUsers(mentionSearch);
    }, 300);
    return () => clearTimeout(timer);
  }, [mentionSearch, showSuggestions, searchUsers]);

  // Get plain text from editor for mention detection
  const getEditorText = useCallback((): string => {
    if (!editorRef.current) return "";
    let text = "";
    const walk = (node: Node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        text += node.textContent || "";
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as HTMLElement;
        if (el.dataset.mentionId) {
          // This is a mention chip - add placeholder that won't interfere
          text += `\u0000MENTION:${el.dataset.mentionId}:${el.dataset.mentionName}\u0000`;
        } else {
          el.childNodes.forEach(walk);
        }
      }
    };
    editorRef.current.childNodes.forEach(walk);
    return text;
  }, []);

  // Convert editor content to value string
  const syncEditorToValue = useCallback(() => {
    if (!editorRef.current) return;

    const newSegments: Segment[] = [];

    const walk = (node: Node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent || "";
        if (text) {
          newSegments.push({ type: "text", content: text });
        }
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as HTMLElement;
        if (el.dataset.mentionId) {
          newSegments.push({
            type: "mention",
            displayName: el.dataset.mentionName || "",
            userId: el.dataset.mentionId,
          });
        } else if (el.tagName === "BR") {
          newSegments.push({ type: "text", content: "\n" });
        } else {
          el.childNodes.forEach(walk);
        }
      }
    };

    editorRef.current.childNodes.forEach(walk);

    const newValue = segmentsToValue(newSegments);
    if (newValue !== value) {
      onChange(newValue);
    }
  }, [value, onChange]);

  // Check for @ mention trigger
  const checkForMentionTrigger = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    if (!range.collapsed) return;

    // Get text before cursor in current text node
    const node = range.startContainer;
    if (node.nodeType !== Node.TEXT_NODE) {
      setShowSuggestions(false);
      return;
    }

    const textBeforeCursor = (node.textContent || "").slice(
      0,
      range.startOffset
    );
    const lastAtIndex = textBeforeCursor.lastIndexOf("@");

    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.slice(lastAtIndex + 1);
      // Check if there's a space (mention cancelled) or it's part of a completed mention
      if (!textAfterAt.includes(" ") && !textAfterAt.includes("\n")) {
        setMentionSearch(textAfterAt);
        setShowSuggestions(true);

        // Position suggestions
        if (editorRef.current) {
          const editorRect = editorRef.current.getBoundingClientRect();
          const rangeRect = range.getBoundingClientRect();
          setSuggestionPosition({
            top: rangeRect.bottom - editorRect.top + 4,
            left: Math.max(0, rangeRect.left - editorRect.left),
          });
        }

        // Save the selection for when clicking on suggestions
        savedSelectionRef.current = {
          node: node,
          offset: range.startOffset,
        };
        return;
      }
    }

    setShowSuggestions(false);
    setMentionSearch("");
    savedSelectionRef.current = null;
  }, []);

  const insertMention = useCallback(
    (user: MentionableUser) => {
      if (!editorRef.current) return;

      // Try to get current selection, or use saved selection
      let node: Node | null = null;
      let offset: number = 0;

      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        if (range.startContainer.nodeType === Node.TEXT_NODE) {
          node = range.startContainer;
          offset = range.startOffset;
        }
      }

      // Fall back to saved selection if current selection is not in a text node
      if (!node && savedSelectionRef.current) {
        node = savedSelectionRef.current.node;
        offset = savedSelectionRef.current.offset;
      }

      if (!node || node.nodeType !== Node.TEXT_NODE) {
        setShowSuggestions(false);
        setMentionSearch("");
        return;
      }

      const textBeforeCursor = (node.textContent || "").slice(0, offset);
      const lastAtIndex = textBeforeCursor.lastIndexOf("@");

      if (lastAtIndex !== -1) {
        const displayName = user.name || user.email;

        // Create mention element
        const mentionEl = document.createElement("span");
        mentionEl.className =
          "bg-primary/20 text-primary font-medium px-1 rounded inline-block";
        mentionEl.contentEditable = "false";
        mentionEl.dataset.mentionId = user.id;
        mentionEl.dataset.mentionName = displayName;
        mentionEl.textContent = `@${displayName}`;

        // Split text node and insert mention
        const beforeText = textBeforeCursor.slice(0, lastAtIndex);
        const afterText = (node.textContent || "").slice(offset);

        const parent = node.parentNode;
        if (parent) {
          const beforeNode = document.createTextNode(beforeText);
          const afterNode = document.createTextNode(" " + afterText);

          parent.insertBefore(beforeNode, node);
          parent.insertBefore(mentionEl, node);
          parent.insertBefore(afterNode, node);
          parent.removeChild(node);

          // Set cursor after the space
          const sel = window.getSelection();
          if (sel) {
            const newRange = document.createRange();
            newRange.setStart(afterNode, 1);
            newRange.collapse(true);
            sel.removeAllRanges();
            sel.addRange(newRange);
          }

          // Focus the editor
          editorRef.current?.focus();
        }
      }

      setShowSuggestions(false);
      setMentionSearch("");
      savedSelectionRef.current = null;
      syncEditorToValue();
    },
    [syncEditorToValue]
  );

  const handleInput = useCallback(() => {
    if (isComposingRef.current) return;
    syncEditorToValue();
    checkForMentionTrigger();
  }, [syncEditorToValue, checkForMentionTrigger]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (showSuggestions && suggestions.length > 0) {
        switch (e.key) {
          case "ArrowDown":
            e.preventDefault();
            setSelectedIndex((prev) =>
              prev < suggestions.length - 1 ? prev + 1 : prev
            );
            return;
          case "ArrowUp":
            e.preventDefault();
            setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev));
            return;
          case "Enter":
            e.preventDefault();
            insertMention(suggestions[selectedIndex]);
            return;
          case "Escape":
            e.preventDefault();
            setShowSuggestions(false);
            return;
          case "Tab":
            e.preventDefault();
            insertMention(suggestions[selectedIndex]);
            return;
        }
      }

      // Handle backspace on mention
      if (e.key === "Backspace") {
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          if (range.collapsed) {
            const node = range.startContainer;
            const offset = range.startOffset;

            // Check if we're at the start of a text node right after a mention
            if (node.nodeType === Node.TEXT_NODE && offset === 0) {
              const prev = node.previousSibling;
              if (prev && prev.nodeType === Node.ELEMENT_NODE) {
                const el = prev as HTMLElement;
                if (el.dataset.mentionId) {
                  e.preventDefault();
                  el.remove();
                  syncEditorToValue();
                  return;
                }
              }
            }

            // Check if cursor is inside the editor element directly (not in a text node)
            if (
              node.nodeType === Node.ELEMENT_NODE &&
              node === editorRef.current
            ) {
              const children = Array.from(node.childNodes);
              // If offset > 0, the element before the cursor might be a mention
              if (offset > 0) {
                const prevChild = children[offset - 1] as HTMLElement;
                if (prevChild?.dataset?.mentionId) {
                  e.preventDefault();
                  prevChild.remove();
                  syncEditorToValue();
                  return;
                }
              }
            }

            // Check if cursor is right after a mention element (cursor in parent, checking children)
            if (node.nodeType === Node.ELEMENT_NODE) {
              const el = node as HTMLElement;
              const children = Array.from(el.childNodes);
              for (let i = 0; i < children.length; i++) {
                const child = children[i] as HTMLElement;
                if (child.dataset?.mentionId) {
                  // Check if cursor is right after this mention
                  const nextSibling = child.nextSibling;
                  if (
                    nextSibling === range.startContainer ||
                    (nextSibling?.nodeType === Node.TEXT_NODE &&
                      range.startContainer === nextSibling &&
                      range.startOffset === 0)
                  ) {
                    e.preventDefault();
                    child.remove();
                    syncEditorToValue();
                    return;
                  }
                }
              }
            }
          }
        }
      }
    },
    [
      showSuggestions,
      suggestions,
      selectedIndex,
      insertMention,
      syncEditorToValue,
    ]
  );

  // Sync value to editor when value changes externally
  useEffect(() => {
    if (!editorRef.current) return;

    // Build expected HTML from segments
    const buildHTML = () => {
      return segments
        .map((seg, i) => {
          if (seg.type === "text") {
            // Escape HTML and preserve newlines
            return seg.content
              .replace(/&/g, "&amp;")
              .replace(/</g, "&lt;")
              .replace(/>/g, "&gt;")
              .replace(/\n/g, "<br>");
          } else {
            return `<span class="bg-primary/20 text-primary font-medium px-1 rounded inline-block" contenteditable="false" data-mention-id="${seg.userId}" data-mention-name="${seg.displayName}">@${seg.displayName}</span>`;
          }
        })
        .join("");
    };

    const expectedHTML = buildHTML();
    const currentHTML = editorRef.current.innerHTML;

    // Only update if different (prevents cursor jumping)
    if (
      currentHTML !== expectedHTML &&
      !editorRef.current.contains(document.activeElement)
    ) {
      editorRef.current.innerHTML = expectedHTML || "";
    }
  }, [segments]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target as Node) &&
        editorRef.current &&
        !editorRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle paste - strip formatting
  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text/plain");
    document.execCommand("insertText", false, text);
  }, []);

  return (
    <div className="relative">
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        onCompositionStart={() => {
          isComposingRef.current = true;
        }}
        onCompositionEnd={() => {
          isComposingRef.current = false;
          handleInput();
        }}
        data-placeholder={placeholder}
        className={cn(
          "min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
          "empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground empty:before:pointer-events-none",
          className
        )}
        style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}
      />

      {showSuggestions && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 w-64 bg-popover border rounded-md shadow-lg overflow-hidden"
          style={{ top: suggestionPosition.top, left: suggestionPosition.left }}
        >
          {isSearching && suggestions.length === 0 ? (
            <div className="px-3 py-2 text-sm text-muted-foreground">
              Searching...
            </div>
          ) : suggestions.length === 0 ? (
            <div className="px-3 py-2 text-sm text-muted-foreground">
              No users found
            </div>
          ) : (
            <ul className="py-1">
              {suggestions.map((user, index) => (
                <li
                  key={user.id}
                  className={cn(
                    "px-3 py-2 cursor-pointer text-sm",
                    index === selectedIndex
                      ? "bg-accent text-accent-foreground"
                      : "hover:bg-muted"
                  )}
                  onMouseDown={(e) => {
                    e.preventDefault(); // Prevent editor from losing focus
                    insertMention(user);
                  }}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  <div className="font-medium">
                    {user.name || "Unnamed User"}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {user.email}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Renders comment text with highlighted mentions
 * Mentions are stored as @[Display Name](userId)
 */
export function renderCommentWithMentions(text: string): React.ReactNode {
  // Match @[name](id) pattern
  const mentionRegex = /@\[([^\]]+)\]\(([^)]+)\)/g;

  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;

  while ((match = mentionRegex.exec(text)) !== null) {
    // Add text before the mention
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    // Add the highlighted mention
    const displayName = match[1];
    parts.push(
      <span
        key={match.index}
        className="bg-primary/20 text-primary font-medium px-1 rounded"
      >
        @{displayName}
      </span>
    );

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length > 0 ? parts : text;
}
