"use client";

import { useState } from "react";
import { FileText, Shield, Clock } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import termsDataRaw from "@/terms/currentTerms.json";
import dpaDataRaw from "@/terms/schedules/schedule-1-dpa.json";
import slaDataRaw from "@/terms/schedules/schedule-2-sla.json";
import { applyCompanyInfo } from "@/lib/terms/applyCompanyInfo";
import { CompanyInfo, VOXD_COMPANY_INFO } from "@/lib/terms/companyInfo";

interface Clause {
  id: string;
  title: string;
  text?: string;
  children?: Clause[];
}

interface Section {
  id: string;
  title: string;
  clauses: Clause[];
}

interface TermsData {
  meta: {
    companyName: string;
    version: string;
    lastUpdated: string;
  };
  definitions?: {
    terms: { key: string; definedTerm: string; description: string }[];
  };
  sections: Section[];
}

function ClauseRenderer({
  clause,
  depth = 0,
  numbering = "",
}: {
  clause: Clause;
  depth?: number;
  numbering?: string;
}) {
  const nestedClauses = clause.children || [];
  const hasNestedClauses = nestedClauses.length > 0;

  return (
    <div className={`${depth > 0 ? "ml-4" : ""} mb-3`}>
      {numbering && (
        <span className="font-semibold text-gray-700 mr-2 text-sm">
          {numbering}
        </span>
      )}
      {clause.title && depth > 0 && (
        <span className="font-semibold text-gray-700 text-sm">
          {clause.title}:{" "}
        </span>
      )}
      {clause.text && (
        <span className="text-gray-600 text-sm leading-relaxed">
          {clause.text}
        </span>
      )}
      {hasNestedClauses && (
        <div className="mt-2">
          {nestedClauses.map((child, index) => (
            <ClauseRenderer
              key={child.id}
              clause={child}
              depth={depth + 1}
              numbering={`${numbering}${index + 1}.`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function TermsContent({ data }: { data: TermsData }) {
  return (
    <div className="space-y-6">
      {/* Definitions (only for main terms) */}
      {data.definitions && (
        <div>
          <h3 className="font-semibold text-gray-900 mb-3">Definitions</h3>
          <dl className="space-y-2">
            {data.definitions.terms.map((term) => (
              <div key={term.key} className="text-sm">
                <dt className="font-medium text-gray-700 inline">
                  &quot;{term.definedTerm}&quot;
                </dt>
                <dd className="text-gray-600 inline"> — {term.description}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      {/* Sections */}
      {data.sections.map((section, sectionIndex) => (
        <div key={section.id}>
          <h3 className="font-semibold text-gray-900 mb-3">
            {sectionIndex + 1}. {section.title}
          </h3>
          {section.clauses.map((clause, clauseIndex) => (
            <ClauseRenderer
              key={clause.id}
              clause={clause}
              depth={0}
              numbering={`${sectionIndex + 1}.${clauseIndex + 1} `}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

interface ProposalTermsSectionProps {
  brandColor: string;
  partner: {
    name: string;
    legalName: string | null;
    companyNumber: string | null;
    registeredAddress: string | null;
    legalEmail: string | null;
  };
}

export default function ProposalTermsSection({
  brandColor,
  partner,
}: ProposalTermsSectionProps) {
  const [activeTab, setActiveTab] = useState("terms");

  // Build company info from partner data, falling back to Voxd defaults
  const companyInfo: CompanyInfo = {
    name: partner.legalName || VOXD_COMPANY_INFO.name,
    shortName: partner.name || VOXD_COMPANY_INFO.shortName,
    number: partner.companyNumber || VOXD_COMPANY_INFO.number,
    address: partner.registeredAddress || VOXD_COMPANY_INFO.address,
    legalEmail: partner.legalEmail || VOXD_COMPANY_INFO.legalEmail,
  };

  // Apply company info to templates
  const termsData = applyCompanyInfo(termsDataRaw, companyInfo) as TermsData;
  const dpaData = applyCompanyInfo(dpaDataRaw, companyInfo) as TermsData;
  const slaData = applyCompanyInfo(slaDataRaw, companyInfo) as TermsData;

  return (
    <section
      id="terms"
      className="bg-white rounded-xl shadow-sm p-6 space-y-6 scroll-mt-8"
    >
      <div className="flex items-start gap-3">
        <div
          className="p-2 rounded-lg"
          style={{ backgroundColor: `${brandColor}15` }}
        >
          <FileText className="h-6 w-6" style={{ color: brandColor }} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            Terms & Conditions
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            Please review our terms before proceeding
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="terms" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Terms</span>
          </TabsTrigger>
          <TabsTrigger value="dpa" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">DPA</span>
          </TabsTrigger>
          <TabsTrigger value="sla" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span className="hidden sm:inline">SLA</span>
          </TabsTrigger>
        </TabsList>

        <div className="mt-4 border rounded-lg">
          <div className="h-[400px] overflow-y-auto p-4">
            <TabsContent value="terms" className="mt-0">
              <div className="mb-4 pb-4 border-b">
                <p className="text-xs text-gray-500">
                  Version {termsData.meta.version} • Last updated{" "}
                  {new Date(termsData.meta.lastUpdated).toLocaleDateString(
                    "en-GB",
                    {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    },
                  )}
                </p>
              </div>
              <TermsContent data={termsData} />
            </TabsContent>

            <TabsContent value="dpa" className="mt-0">
              <div className="mb-4 pb-4 border-b">
                <h3 className="font-semibold text-gray-900">
                  Schedule 1: Data Processing Addendum (UK GDPR)
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Version {dpaData.meta.version} • Last updated{" "}
                  {new Date(dpaData.meta.lastUpdated).toLocaleDateString(
                    "en-GB",
                    {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    },
                  )}
                </p>
              </div>
              <TermsContent data={dpaData} />
            </TabsContent>

            <TabsContent value="sla" className="mt-0">
              <div className="mb-4 pb-4 border-b">
                <h3 className="font-semibold text-gray-900">
                  Schedule 2: Service Level Agreement
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Version {slaData.meta.version} • Last updated{" "}
                  {new Date(slaData.meta.lastUpdated).toLocaleDateString(
                    "en-GB",
                    {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    },
                  )}
                </p>
              </div>
              <TermsContent data={slaData} />
            </TabsContent>
          </div>
        </div>
      </Tabs>

      <p className="text-xs text-gray-500 text-center">
        By proceeding, you agree to these terms and conditions.
      </p>
    </section>
  );
}
