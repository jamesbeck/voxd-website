"use client";

import { Example } from "@/types/types";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import Container from "@/components/websiteui/container";

interface CaseStudiesClientProps {
  examples: Example[];
  industries: {
    id: string;
    name: string;
    slug: string;
    exampleCount: string;
  }[];
  functions: {
    id: string;
    name: string;
    slug: string;
    functionCount: string;
  }[];
}

export default function CaseStudiesClient({
  examples,
  industries,
  functions,
}: CaseStudiesClientProps) {
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);
  const [selectedFunctions, setSelectedFunctions] = useState<string[]>([]);

  const toggleIndustry = (slug: string) => {
    setSelectedIndustries((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug],
    );
  };

  const toggleFunction = (slug: string) => {
    setSelectedFunctions((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug],
    );
  };

  const filteredExamples = examples.filter((example) => {
    const matchesIndustry =
      selectedIndustries.length === 0 ||
      example.industries?.some((ind) => selectedIndustries.includes(ind.slug));

    const matchesFunction =
      selectedFunctions.length === 0 ||
      example.functions?.some((func) => selectedFunctions.includes(func.slug));

    return matchesIndustry && matchesFunction;
  });

  return (
    <>
      <Container colour="blue">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <h1 className="text-4xl md:text-5xl font-bold text-white">
            Case Studies
          </h1>
          <p className="text-xl text-white/90 leading-relaxed">
            Discover how businesses across industries are leveraging Voxd to
            transform their customer communications
          </p>
        </div>
      </Container>

      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Filters */}
        <div className="mb-8 space-y-6">
          {/* Industry Filters */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700">
                Industries
              </h3>
              {selectedIndustries.length > 0 && (
                <button
                  onClick={() => setSelectedIndustries([])}
                  className="text-xs text-primary hover:text-primary/80 font-medium"
                >
                  Clear all
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {industries.map((industry) => (
                <button
                  key={industry.id}
                  onClick={() => toggleIndustry(industry.slug)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    selectedIndustries.includes(industry.slug)
                      ? "bg-primary text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {industry.name} ({industry.exampleCount})
                </button>
              ))}
            </div>
          </div>

          {/* Function Filters */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700">Functions</h3>
              {selectedFunctions.length > 0 && (
                <button
                  onClick={() => setSelectedFunctions([])}
                  className="text-xs text-primary hover:text-primary/80 font-medium"
                >
                  Clear all
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {functions.map((func) => (
                <button
                  key={func.id}
                  onClick={() => toggleFunction(func.slug)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    selectedFunctions.includes(func.slug)
                      ? "bg-primary text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {func.name} ({func.functionCount})
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-6 text-gray-600">
          Showing {filteredExamples.length} of {examples.length} case studies
        </div>

        {/* Case Studies Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredExamples.map((example) => (
            <Link
              key={example.id}
              href={`/case-studies/${example.slug}`}
              className="group bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden"
            >
              {/* Hero Image */}
              <div className="relative w-full h-48 bg-gray-200">
                {example.heroImageFileExtension ? (
                  <Image
                    src={`https://${process.env.NEXT_PUBLIC_WASABI_ENDPOINT}/voxd/exampleImages/${example.id}.${example.heroImageFileExtension}`}
                    alt={example.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    No Image
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-6">
                {/* Logo and Business Name */}
                <div className="flex items-center gap-3 mb-3">
                  {example.logoFileExtension ? (
                    <div className="relative w-12 h-12 flex-shrink-0">
                      <Image
                        src={`https://${process.env.NEXT_PUBLIC_WASABI_ENDPOINT}/voxd/exampleLogos/${example.id}.${example.logoFileExtension}`}
                        alt={`${example.businessName} logo`}
                        fill
                        className="object-contain"
                      />
                    </div>
                  ) : (
                    <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center text-gray-400 text-xs flex-shrink-0">
                      Logo
                    </div>
                  )}
                  <h3 className="text-lg font-semibold text-gray-900">
                    {example.businessName}
                  </h3>
                </div>

                {/* Title */}
                <h4 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-primary transition-colors">
                  {example.title}
                </h4>

                {/* Short Description */}
                <p className="text-gray-600 mb-4 line-clamp-3">
                  {example.short}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-2">
                  {example.industries?.slice(0, 2).map((industry) => (
                    <span
                      key={industry.id}
                      className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                    >
                      {industry.name}
                    </span>
                  ))}
                  {example.functions?.slice(0, 2).map((func) => (
                    <span
                      key={func.id}
                      className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                    >
                      {func.name}
                    </span>
                  ))}
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* No Results */}
        {filteredExamples.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">
              No case studies found matching your criteria
            </p>
          </div>
        )}

        {/* Privacy Disclaimer */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-500 text-center italic max-w-3xl mx-auto">
            Please note: While these case studies are based on real projects,
            business names, branding, and other identifying information have
            been modified to protect client privacy.
          </p>
        </div>
      </div>
    </>
  );
}
