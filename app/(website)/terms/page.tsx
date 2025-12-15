import H1 from "@/components/adminui/H1";
import Container from "@/components/websiteui/container";
import H2 from "@/components/websiteui/h2";
import termsData from "@/terms/2025-12-15.json";

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

interface Definition {
  key: string;
  definedTerm: string;
  description: string;
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
    <section className="mb-10">
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

export default function Terms() {
  const { meta, definitions, sections } = termsData as {
    meta: {
      documentType: string;
      companyName: string;
      version: string;
      status: string;
      jurisdiction: string;
      lastUpdated: string;
    };
    definitions: {
      version: string;
      terms: Definition[];
    };
    sections: Section[];
  };

  const sortedSections = [...sections].sort((a, b) => a.order - b.order);

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

      {/* Definitions */}
      <section className="mb-10">
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
      {sortedSections.map((section, index) => (
        <SectionRenderer
          key={section.id}
          section={section}
          sectionNumber={index + 1}
        />
      ))}
    </Container>
  );
}
