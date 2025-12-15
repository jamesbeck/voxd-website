import H1 from "@/components/adminui/H1";
import Container from "@/components/websiteui/container";
import H2 from "@/components/websiteui/h2";
import termsData from "@/terms/2025-12-15.json";
import Link from "next/link";

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
  clauses: Clause[];
}

interface Definition {
  key: string;
  definedTerm: string;
  description: string;
}

interface Schedule {
  scheduleNumber: number;
  title: string;
  file: string;
}

// Helper function to resolve dynamic references like {{section:id}} and {{schedule:number}}
function resolveReferences(
  text: string,
  sections: Section[],
  schedules: Schedule[]
): React.ReactNode {
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;

  // Match {{section:id}} or {{schedule:number}}
  const regex = /\{\{(section|schedule):([^}]+)\}\}/g;
  let match;

  while ((match = regex.exec(text)) !== null) {
    // Add text before the match
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    const [, type, id] = match;

    if (type === "section") {
      const sectionIndex = sections.findIndex((s) => s.id === id);
      if (sectionIndex !== -1) {
        parts.push(
          <a
            key={`section-${id}-${match.index}`}
            href={`#section-${sections[sectionIndex].id}`}
            className="text-primary hover:underline font-medium"
          >
            Section {sectionIndex + 1}
          </a>
        );
      } else {
        parts.push(`Section [${id}]`);
      }
    } else if (type === "schedule") {
      const scheduleNum = parseInt(id, 10);
      const schedule = schedules.find((s) => s.scheduleNumber === scheduleNum);
      if (schedule) {
        parts.push(
          <Link
            key={`schedule-${id}-${match.index}`}
            href={`/terms/schedule/${scheduleNum}`}
            className="text-primary hover:underline font-medium"
          >
            Schedule {scheduleNum}
          </Link>
        );
      } else {
        parts.push(`Schedule ${id}`);
      }
    }

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length > 0 ? parts : text;
}

function ClauseRenderer({
  clause,
  depth = 0,
  numbering = "",
  sections,
  schedules,
}: {
  clause: Clause;
  depth?: number;
  numbering?: string;
  sections: Section[];
  schedules: Schedule[];
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
        <span className="text-gray-700 leading-relaxed">
          {resolveReferences(clause.text, sections, schedules)}
        </span>
      )}
      {hasNestedClauses && (
        <div className="mt-3">
          {nestedClauses.map((child, index) => (
            <ClauseRenderer
              key={child.id}
              clause={child}
              depth={depth + 1}
              numbering={`${numbering}${index + 1}.`}
              sections={sections}
              schedules={schedules}
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
  sections,
  schedules,
}: {
  section: Section;
  sectionNumber: number;
  sections: Section[];
  schedules: Schedule[];
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
              sections={sections}
              schedules={schedules}
            />
          ))}
        </div>
      ) : (
        <p className="text-gray-500 italic">This section is pending content.</p>
      )}
    </section>
  );
}

function TableOfContents({
  sections,
  schedules,
}: {
  sections: Section[];
  schedules: Schedule[];
}) {
  return (
    <nav className="bg-gray-50 p-6 rounded-lg mb-10">
      <h3 className="font-bold text-lg mb-4">Table of Contents</h3>
      <ul className="space-y-2 text-sm">
        <li>
          <a
            href="#definitions"
            className="text-gray-700 hover:text-primary hover:underline"
          >
            Definitions
          </a>
        </li>
        {sections.map((section, index) => (
          <li key={section.id}>
            <a
              href={`#section-${section.id}`}
              className="text-gray-700 hover:text-primary hover:underline"
            >
              {index + 1}. {section.title}
            </a>
          </li>
        ))}
        {schedules.length > 0 && (
          <>
            <li className="pt-4 font-semibold text-gray-900">Schedules</li>
            {schedules.map((schedule) => (
              <li key={schedule.scheduleNumber} className="ml-4">
                <Link
                  href={`/terms/schedule/${schedule.scheduleNumber}`}
                  className="text-gray-700 hover:text-primary hover:underline"
                >
                  Schedule {schedule.scheduleNumber}: {schedule.title}
                </Link>
              </li>
            ))}
          </>
        )}
      </ul>
    </nav>
  );
}

export default function Terms() {
  const { meta, definitions, sections } = termsData as {
    meta: {
      documentType: string;
      companyName: string;
      version: string;
      status: string;
      jurisdiction: string;
      lastUpdated: string;
      schedules?: Schedule[];
    };
    definitions: {
      version: string;
      terms: Definition[];
    };
    sections: Section[];
  };

  const schedules = meta.schedules || [];

  return (
    <Container>
      <H1 className="text-center mb-8">Voxd Terms of Service</H1>

      {/* Meta Information */}
      <div className="bg-gray-50 p-6 rounded-lg mb-10">
        <p className="text-sm text-gray-600">
          <strong>Company:</strong> {meta.companyName}
        </p>
        <p className="text-sm text-gray-600">
          <strong>Version:</strong> {meta.version}
        </p>
        <p className="text-sm text-gray-600">
          <strong>Jurisdiction:</strong> {meta.jurisdiction}
        </p>
        <p className="text-sm text-gray-600">
          <strong>Last Updated:</strong>{" "}
          {new Date(meta.lastUpdated).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </p>
        {meta.status === "draft" && (
          <p className="text-sm text-amber-600 mt-2 font-semibold">
            ⚠️ This document is currently in draft status.
          </p>
        )}
      </div>

      {/* Table of Contents */}
      <TableOfContents sections={sections} schedules={schedules} />

      {/* Definitions */}
      <section id="definitions" className="mb-10 scroll-mt-24">
        <H2 className="mb-4">Definitions</H2>
        <dl className="space-y-4">
          {definitions.terms.map((term) => (
            <div key={term.key} className="border-b border-gray-100 pb-4">
              <dt className="font-semibold text-gray-900 mb-1">
                &quot;{term.definedTerm}&quot;
              </dt>
              <dd className="text-gray-700 ml-4">{term.description}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Sections */}
      {sections.map((section, index) => (
        <SectionRenderer
          key={section.id}
          section={section}
          sectionNumber={index + 1}
          sections={sections}
          schedules={schedules}
        />
      ))}

      {/* Schedules Reference */}
      {schedules.length > 0 && (
        <section className="mt-16 pt-10 border-t border-gray-200">
          <H2 className="mb-6">Schedules</H2>
          <div className="space-y-4">
            {schedules.map((schedule) => (
              <div
                key={schedule.scheduleNumber}
                className="bg-gray-50 p-4 rounded-lg"
              >
                <Link
                  href={`/terms/schedule/${schedule.scheduleNumber}`}
                  className="text-lg font-semibold text-primary hover:underline"
                >
                  Schedule {schedule.scheduleNumber}: {schedule.title}
                </Link>
                <p className="text-sm text-gray-600 mt-1">
                  Click to view the full schedule
                </p>
              </div>
            ))}
          </div>
        </section>
      )}
    </Container>
  );
}
