"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Search,
  ChevronDown,
  ChevronUp,
  X,
  FolderOpen,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { PublicFaq, FaqCategory } from "@/lib/getPublicFaqs";
import { MarkdownContent } from "@/components/MarkdownContent";

interface FaqClientProps {
  faqs: PublicFaq[];
  categories: FaqCategory[];
}

export default function FaqClient({ faqs, categories }: FaqClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Filter FAQs based on search and category
  const filteredFaqs = useMemo(() => {
    return faqs.filter((faq) => {
      // Category filter
      if (selectedCategory && faq.categoryId !== selectedCategory) {
        return false;
      }

      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesQuestion = faq.question.toLowerCase().includes(query);
        const matchesAnswer = faq.answer.toLowerCase().includes(query);
        if (!matchesQuestion && !matchesAnswer) {
          return false;
        }
      }

      return true;
    });
  }, [faqs, searchQuery, selectedCategory]);

  // Group FAQs by category
  const groupedFaqs = useMemo(() => {
    const groups: Record<string, { categoryName: string; faqs: PublicFaq[] }> =
      {};

    filteredFaqs.forEach((faq) => {
      const key = faq.categoryId || "uncategorized";
      if (!groups[key]) {
        groups[key] = {
          categoryName: faq.categoryName || "General",
          faqs: [],
        };
      }
      groups[key].faqs.push(faq);
    });

    return Object.entries(groups).sort((a, b) =>
      a[1].categoryName.localeCompare(b[1].categoryName),
    );
  }, [filteredFaqs]);

  const handleToggle = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategory(null);
  };

  const hasActiveFilters = searchQuery.trim() || selectedCategory;

  return (
    <div className="space-y-8">
      {/* Search and Filter Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search questions and answers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 text-base border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Category Pills */}
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory(null)}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium transition-all",
                !selectedCategory
                  ? "bg-primary text-white shadow-md"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200",
              )}
            >
              All ({faqs.length})
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() =>
                  setSelectedCategory(
                    selectedCategory === category.id ? null : category.id,
                  )
                }
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium transition-all",
                  selectedCategory === category.id
                    ? "bg-primary text-white shadow-md"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200",
                )}
              >
                {category.name} ({category.count})
              </button>
            ))}
          </div>
        )}

        {/* Active Filters Summary */}
        {hasActiveFilters && (
          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              Showing{" "}
              <span className="font-semibold text-gray-700">
                {filteredFaqs.length}
              </span>{" "}
              of {faqs.length} questions
            </p>
            <button
              onClick={clearFilters}
              className="text-sm text-primary hover:text-primary/80 font-medium flex items-center gap-1"
            >
              <X className="h-4 w-4" />
              Clear filters
            </button>
          </div>
        )}
      </div>

      {/* FAQ List */}
      {filteredFaqs.length === 0 ? (
        <div className="text-center py-16">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
            <Search className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No questions found
          </h3>
          <p className="text-gray-500 max-w-md mx-auto">
            We couldn't find any questions matching your search. Try different
            keywords or{" "}
            <button
              onClick={clearFilters}
              className="text-primary hover:underline"
            >
              clear your filters
            </button>
            .
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {groupedFaqs.map(
            ([categoryId, { categoryName, faqs: categoryFaqs }]) => (
              <div key={categoryId} className="space-y-3">
                {/* Category Header */}
                {categories.length > 0 && (
                  <div className="flex items-center gap-2 px-1">
                    <FolderOpen className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold text-gray-900">
                      {categoryName}
                    </h3>
                    <span className="text-sm text-gray-400">
                      ({categoryFaqs.length})
                    </span>
                  </div>
                )}

                {/* FAQ Items */}
                <div className="space-y-3">
                  {categoryFaqs.map((faq) => (
                    <FaqItem
                      key={faq.id}
                      faq={faq}
                      isExpanded={expandedId === faq.id}
                      onToggle={() => handleToggle(faq.id)}
                      searchQuery={searchQuery}
                    />
                  ))}
                </div>
              </div>
            ),
          )}
        </div>
      )}
    </div>
  );
}

interface FaqItemProps {
  faq: PublicFaq;
  isExpanded: boolean;
  onToggle: () => void;
  searchQuery: string;
}

function FaqItem({ faq, isExpanded, onToggle, searchQuery }: FaqItemProps) {
  // Highlight matching text
  const highlightText = (text: string) => {
    if (!searchQuery.trim()) return text;

    const regex = new RegExp(
      `(${searchQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`,
      "gi",
    );
    const parts = text.split(regex);

    return parts.map((part, i) =>
      regex.test(part) ? (
        <mark key={i} className="bg-yellow-200 text-yellow-900 rounded px-0.5">
          {part}
        </mark>
      ) : (
        part
      ),
    );
  };

  return (
    <div
      className={cn(
        "bg-white rounded-xl border transition-all duration-200",
        isExpanded
          ? "border-primary/30 shadow-md ring-1 ring-primary/10"
          : "border-gray-200 hover:border-gray-300 hover:shadow-sm",
      )}
    >
      <button
        onClick={onToggle}
        className="w-full flex items-start justify-between gap-4 p-5 text-left"
      >
        <span className="text-base font-medium text-gray-900 leading-relaxed">
          {highlightText(faq.question)}
        </span>
        <span
          className={cn(
            "flex-shrink-0 mt-0.5 p-1 rounded-full transition-colors",
            isExpanded ? "bg-primary text-white" : "bg-gray-100 text-gray-500",
          )}
        >
          {isExpanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </span>
      </button>

      <div
        className={cn(
          "overflow-hidden transition-all duration-200",
          isExpanded ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0",
        )}
      >
        <div className="px-5 pb-5 pt-0">
          <div className="border-t border-gray-100 pt-4">
            <MarkdownContent content={faq.answer} />
            <div className="mt-4 pt-4 border-t border-gray-100">
              <Link
                href={`/faq/${faq.slug}`}
                className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary/80 font-medium transition-colors"
              >
                View Answer Page
                <ExternalLink className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
