"use client";

import DataCard from "@/components/adminui/DataCard";
import { FileText, Building, ExternalLink, Tag, Briefcase } from "lucide-react";

interface ExampleInfoTabProps {
  id: string;
  title: string;
  businessName: string;
  slug: string;
  industries: { id: string; name: string; slug: string }[];
  functions: { id: string; name: string; slug: string }[];
}

export default function ExampleInfoTab({
  id,
  title,
  businessName,
  slug,
  industries,
  functions,
}: ExampleInfoTabProps) {
  const previewUrl = `/examples/${slug}`;

  return (
    <DataCard
      items={[
        {
          label: "Example ID",
          value: id,
          icon: <FileText className="h-4 w-4" />,
        },
        {
          label: "Title",
          value: title,
          icon: <FileText className="h-4 w-4" />,
        },
        {
          label: "Business Name",
          value: businessName || (
            <span className="text-muted-foreground">Not set</span>
          ),
          icon: <Building className="h-4 w-4" />,
        },
        {
          label: "Slug",
          value: slug,
          icon: <Tag className="h-4 w-4" />,
        },
        {
          label: "Industries",
          value:
            industries.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {industries.map((industry) => (
                  <span
                    key={industry.id}
                    className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10"
                  >
                    {industry.name}
                  </span>
                ))}
              </div>
            ) : (
              <span className="text-muted-foreground">None</span>
            ),
          icon: <Briefcase className="h-4 w-4" />,
        },
        {
          label: "Functions",
          value:
            functions.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {functions.map((func) => (
                  <span
                    key={func.id}
                    className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-700/10"
                  >
                    {func.name}
                  </span>
                ))}
              </div>
            ) : (
              <span className="text-muted-foreground">None</span>
            ),
          icon: <Briefcase className="h-4 w-4" />,
        },
        {
          label: "Public Preview Link",
          value: (
            <a
              href={previewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-primary hover:underline"
            >
              View Example Preview
              <ExternalLink className="h-3 w-3" />
            </a>
          ),
          icon: <ExternalLink className="h-4 w-4" />,
        },
      ]}
    />
  );
}
