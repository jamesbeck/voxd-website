export const KNOWLEDGE_DOCUMENT_SOURCE_TYPES = ["manual", "url"] as const;

export type KnowledgeDocumentSourceType =
  (typeof KNOWLEDGE_DOCUMENT_SOURCE_TYPES)[number];

export const KNOWLEDGE_DOCUMENT_SOURCE_LABELS: Record<
  KnowledgeDocumentSourceType,
  string
> = {
  manual: "Manual Entry",
  url: "URL/Website",
};

export function isKnowledgeDocumentSourceType(
  value?: string | null,
): value is KnowledgeDocumentSourceType {
  return KNOWLEDGE_DOCUMENT_SOURCE_TYPES.includes(
    value as KnowledgeDocumentSourceType,
  );
}

export function normalizeKnowledgeDocumentSourceInput({
  sourceType,
  sourceUrl,
}: {
  sourceType?: string | null;
  sourceUrl?: string | null;
}) {
  const trimmedSourceType = sourceType?.trim() || "manual";

  if (!isKnowledgeDocumentSourceType(trimmedSourceType)) {
    return {
      success: false as const,
      error: "Invalid source type",
      fieldErrors: {
        sourceType: "Please choose Manual Entry or URL/Website",
      },
    };
  }

  if (trimmedSourceType === "manual") {
    return {
      success: true as const,
      data: {
        sourceType: "manual" as const,
        sourceUrl: null,
      },
    };
  }

  const trimmedSourceUrl = sourceUrl?.trim();

  if (!trimmedSourceUrl) {
    return {
      success: false as const,
      error: "Source URL is required for URL/Website documents",
      fieldErrors: {
        sourceUrl: "Source URL is required",
      },
    };
  }

  try {
    const parsedUrl = new URL(trimmedSourceUrl);

    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      return {
        success: false as const,
        error: "Source URL must use http or https",
        fieldErrors: {
          sourceUrl: "Enter a valid http or https URL",
        },
      };
    }

    return {
      success: true as const,
      data: {
        sourceType: "url" as const,
        sourceUrl: parsedUrl.toString(),
      },
    };
  } catch {
    return {
      success: false as const,
      error: "Source URL is invalid",
      fieldErrors: {
        sourceUrl: "Enter a valid URL",
      },
    };
  }
}

export function getKnowledgeDocumentSourceLabel(sourceType?: string | null) {
  if (!sourceType || !isKnowledgeDocumentSourceType(sourceType)) {
    return sourceType || "-";
  }

  return KNOWLEDGE_DOCUMENT_SOURCE_LABELS[sourceType];
}

export function knowledgeDocumentBlocksAreEditable(sourceType?: string | null) {
  return sourceType !== "url";
}
