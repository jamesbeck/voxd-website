import H1 from "@/components/adminui/H1";
import Container from "@/components/websiteui/container";
import H2 from "@/components/websiteui/h2";
import termsData from "@/terms/2025-12-15.json";
import Link from "next/link";
import { notFound } from "next/navigation";
import fs from "fs";
import path from "path";

interface Clause {
  id: string;
  title: string;
  text?: string;
  order?: number;
  children?: Clause[];
}

interface Section {
  id: string;
  title: string;
  order: number;
  clauses: Clause[];
}

interface ScheduleMeta {
  scheduleNumber: number;
  title: string;
  file: string;
}

interface ScheduleData {
  meta: {
    documentType: string;
    scheduleNumber: number;
    title: string;
    parentDocument: string;
    companyName: string;
    version: string;
    status: string;
    jurisdiction: string;
    lastUpdated: string;
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
    <div className={`${depth > 0 ? "ml-6" : ""} mb-4`}>
      {numbering && <span className="font-semibold mr-2">{numbering}</span>}
      {clause.title && depth > 0 && (
        <span className="font-semibold">{clause.title}: </span>
      )}
      {clause.text && (
        <span className="text-gray-700 leading-relaxed">{clause.text}</span>
      )}
      {hasNestedClauses && (
        <div className="mt-3">
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

function SectionRenderer({
  section,
  sectionNumber,
}: {
  section: Section;
  sectionNumber: number;
}) {
  return (
    <section id={`section-${section.id}`} className="mb-10 scroll-mt-24">
      <H2 className="mb-4">
        {sectionNumber}. {section.title}
      </H2>
      {section.clauses.length > 0 ? (
        <div className="space-y-4">
          {section.clauses.map((clause, index) => (
            <ClauseRenderer
              key={clause.id}
              clause={clause}
              depth={0}
              numbering={`${sectionNumber}.${index + 1} `}
            />
          ))}
        </div>
      ) : (
        <p className="text-gray-500 italic">This section is pending content.</p>
      )}
    </section>
  );
}

function TableOfContents({ sections }: { sections: Section[] }) {
  return (
    <nav className="bg-gray-50 p-6 rounded-lg mb-10">
      <h3 className="font-bold text-lg mb-4">Contents</h3>
      <ul className="space-y-2 text-sm">
        {sections.map((section) => (
          <li key={section.id}>
            <a
              href={`#section-${section.id}`}
              className="text-gray-700 hover:text-primary hover:underline"
            >
              {section.order}. {section.title}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

// Generate static params for all schedules
export async function generateStaticParams() {
  const schedules = (termsData.meta as { schedules?: ScheduleMeta[] })
    .schedules;
  if (!schedules) return [];

  return schedules.map((schedule) => ({
    scheduleNumber: schedule.scheduleNumber.toString(),
  }));
}

export default async function SchedulePage({
  params,
}: {
  params: Promise<{ scheduleNumber: string }>;
}) {
  const { scheduleNumber } = await params;
  const scheduleNum = parseInt(scheduleNumber, 10);

  // Find the schedule reference in main terms
  const schedules = (termsData.meta as { schedules?: ScheduleMeta[] })
    .schedules;
  const scheduleRef = schedules?.find((s) => s.scheduleNumber === scheduleNum);

  if (!scheduleRef) {
    notFound();
  }

  // Load the schedule data
  const schedulePath = path.join(process.cwd(), "terms", scheduleRef.file);

  let scheduleData: ScheduleData;
  try {
    const fileContent = fs.readFileSync(schedulePath, "utf-8");
    scheduleData = JSON.parse(fileContent);
  } catch {
    notFound();
  }

  const sortedSections = [...scheduleData.sections].sort(
    (a, b) => a.order - b.order
  );

  return (
    <Container>
      {/* Back link */}
      <div className="mb-6">
        <Link
          href="/terms"
          className="text-primary hover:underline text-sm flex items-center gap-1"
        >
          ← Back to Terms of Service
        </Link>
      </div>

      <H1 className="text-center mb-8">
        Schedule {scheduleNum}: {scheduleData.meta.title}
      </H1>

      {/* Meta Information */}
      <div className="bg-gray-50 p-6 rounded-lg mb-10">
        <p className="text-sm text-gray-600">
          <strong>Part of:</strong>{" "}
          <Link href="/terms" className="text-primary hover:underline">
            Voxd Terms of Service
          </Link>
        </p>
        <p className="text-sm text-gray-600">
          <strong>Company:</strong> {scheduleData.meta.companyName}
        </p>
        <p className="text-sm text-gray-600">
          <strong>Version:</strong> {scheduleData.meta.version}
        </p>
        <p className="text-sm text-gray-600">
          <strong>Last Updated:</strong>{" "}
          {new Date(scheduleData.meta.lastUpdated).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </p>
        {scheduleData.meta.status === "draft" && (
          <p className="text-sm text-amber-600 mt-2 font-semibold">
            ⚠️ This document is currently in draft status.
          </p>
        )}
      </div>

      {/* Table of Contents */}
      <TableOfContents sections={sortedSections} />

      {/* Sections */}
      {sortedSections.map((section) => (
        <SectionRenderer
          key={section.id}
          section={section}
          sectionNumber={section.order}
        />
      ))}

      {/* Back to Terms */}
      <div className="mt-10 pt-6 border-t border-gray-200">
        <Link
          href="/terms"
          className="text-primary hover:underline flex items-center gap-1"
        >
          ← Back to Terms of Service
        </Link>
      </div>
    </Container>
  );
}
