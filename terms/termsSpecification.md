# Terms and Conditions JSON Format Specification

## Overview

This document describes the JSON format used for terms and conditions documents and their associated schedules. The format is designed to be hierarchical, structured, and machine-readable while maintaining human readability.

## File Naming Convention

Terms files should be named using the format: `YYYY-MM-DD.json` (e.g., `2025-12-15.json`)

## Root Structure

The root JSON object contains two main sections:

```json
{
  "meta": {
    /* Metadata object */
  },
  "definitions": {
    /* Definitions object */
  },
  "sections": [
    /* Array of section objects */
  ]
}
```

## Meta Object

The `meta` object contains document metadata:

```json
{
  "meta": {
    "documentType": "terms_and_conditions",
    "companyName": "Voxd AI LTD",
    "version": "1.0.0",
    "status": "draft" | "active" | "archived",
    "jurisdiction": "England and Wales",
    "lastUpdated": "YYYY-MM-DD",
    "schedules": [
      {
        "scheduleNumber": 1,
        "title": "Data Processing Addendum (UK GDPR)",
        "file": "schedules/schedule-1-dpa.json"
      }
    ]
  }
}
```

### Meta Fields

- **documentType**: Type of document (e.g., "terms_and_conditions")
- **companyName**: Legal name of the company
- **version**: Semantic version number (major.minor.patch)
- **status**: Current status of the document
- **jurisdiction**: Legal jurisdiction
- **lastUpdated**: ISO date (YYYY-MM-DD) of last update
- **schedules**: Array of schedule references (see Schedules section below)

## Definitions Object

The `definitions` object contains all defined terms used throughout the document:

```json
{
  "definitions": {
    "version": "1.1.0",
    "terms": [
      {
        "key": "Company",
        "definedTerm": "Voxd AI LTD",
        "description": "Voxd AI LTD, a company incorporated in England and Wales..."
      },
      {
        "key": "Client",
        "definedTerm": "Client",
        "description": "Any business, company, partnership..."
      }
    ]
  }
}
```

### Definition Fields

- **version**: Version number for the definitions set
- **terms**: Array of term definition objects
  - **key**: Unique identifier for the term (used for references)
  - **definedTerm**: The actual term as it appears in the document
  - **description**: Full definition text

## Sections Array

The `sections` array contains the main content of the terms, organized hierarchically:

```json
{
  "sections": [
    {
      "id": "unique_section_id",
      "title": "Section Title",
      "clauses": [
        {
          "id": "unique.clause.id",
          "title": "Clause Title",
          "text": "Main clause text...",
          "children": [
            {
              "id": "unique.clause.id.sub",
              "title": "Sub-clause Title",
              "text": "Sub-clause text...",
              "children": []
            }
          ]
        }
      ]
    }
  ]
}
```

### Section Fields

- **id**: Unique identifier (snake_case recommended)
- **title**: Section heading
- **clauses**: Array of clause objects

### Clause Fields

- **id**: Unique dot-notation identifier (e.g., "pcs.entire_agreement")
- **title**: Clause heading
- **text**: Main clause content
- **children**: Array of nested sub-clauses (recursive structure)

### ID Naming Convention

Use dot notation for clause IDs to indicate hierarchy:

- Top level: `section_prefix.clause_name`
- Sub-clauses: `section_prefix.clause_name.sub_clause`
- Further nesting: `section_prefix.clause_name.sub_clause.detail`

Example hierarchy:

```
pcs.excluded_materials
pcs.excluded_materials.sales
pcs.excluded_materials.written
pcs.excluded_materials.estimates
```

## Schedules

Schedules are separate JSON files that follow a similar structure but are referenced from the main document.

### Adding a Schedule

1. **Create the schedule file** in the `terms/schedules/` directory following the naming convention: `schedule-{number}-{identifier}.json` (e.g., `schedule-1-dpa.json`)

2. **Add a reference in the main document's meta section**:

```json
{
  "meta": {
    ...
    "schedules": [
      {
        "scheduleNumber": 1,
        "title": "Data Processing Addendum (UK GDPR)",
        "file": "schedules/schedule-1-dpa.json"
      }
    ]
  }
}
```

3. **Reference the schedule in documentation** using the format: `#file:schedule-1-dpa.json`

### Schedule File Structure

Schedule files follow this structure:

```json
{
  "meta": {
    "documentType": "schedule",
    "scheduleNumber": 1,
    "title": "Data Processing Addendum (UK GDPR)",
    "parentDocument": "2025-12-15.json",
    "companyName": "Voxd AI LTD",
    "version": "1.0.0",
    "status": "draft",
    "jurisdiction": "England and Wales",
    "lastUpdated": "2025-12-15"
  },
  "sections": [
    {
      "id": "dpa_definitions",
      "title": "Definitions",
      "clauses": [
        /* Same clause structure as main document */
      ]
    }
  ]
}
```

### Schedule Meta Fields

- **documentType**: Should be "schedule"
- **scheduleNumber**: Integer schedule number
- **title**: Full title of the schedule
- **parentDocument**: Filename of the parent terms document
- All other fields same as main document meta

## Best Practices

### Content Organization

1. **Logical Grouping**: Group related clauses into sections
2. **Consistent Depth**: Try to maintain consistent nesting levels
3. **Clear IDs**: Use descriptive, hierarchical IDs
4. **Atomic Clauses**: Each clause should cover one concept

### ID Conventions

- Use lowercase with underscores for section IDs
- Use dot notation for clause IDs
- Keep IDs descriptive but concise
- Prefix clause IDs with section abbreviation

Examples:

- Section: `pre_contractual_statements`
- Clause: `pcs.entire_agreement`
- Sub-clause: `pcs.excluded_materials.sales`

### Text Formatting

- Use plain text (no Markdown) in clause text
- Keep sentences clear and self-contained
- Use proper punctuation and grammar
- Avoid line breaks within text fields

### Versioning

- Increment patch version (x.x.1) for typo fixes
- Increment minor version (x.1.x) for clause additions
- Increment major version (1.x.x) for structural changes
- Update both document and definitions versions independently

## Example Usage

### Complete Minimal Document

```json
{
  "meta": {
    "documentType": "terms_and_conditions",
    "companyName": "Voxd AI LTD",
    "version": "1.0.0",
    "status": "draft",
    "jurisdiction": "England and Wales",
    "lastUpdated": "2025-12-15",
    "schedules": []
  },
  "definitions": {
    "version": "1.0.0",
    "terms": [
      {
        "key": "Company",
        "definedTerm": "Voxd AI LTD",
        "description": "Voxd AI LTD, a company incorporated in England and Wales."
      }
    ]
  },
  "sections": [
    {
      "id": "general",
      "title": "General Terms",
      "clauses": [
        {
          "id": "general.agreement",
          "title": "Agreement",
          "text": "These terms constitute the entire agreement.",
          "children": []
        }
      ]
    }
  ]
}
```

### Adding a New Section

To add a new section, append to the sections array:

```json
{
  "id": "new_section",
  "title": "New Section Title",
  "clauses": [
    {
      "id": "new_section.first_clause",
      "title": "First Clause",
      "text": "Clause content here.",
      "children": []
    }
  ]
}
```

### Creating Nested Sub-clauses

```json
{
  "id": "parent.clause",
  "title": "Parent Clause",
  "text": "Parent clause text with multiple sub-items:",
  "children": [
    {
      "id": "parent.clause.sub1",
      "title": "First Sub-item",
      "text": "First sub-item text.",
      "children": []
    },
    {
      "id": "parent.clause.sub2",
      "title": "Second Sub-item",
      "text": "Second sub-item text.",
      "children": [
        {
          "id": "parent.clause.sub2.detail",
          "title": "Detail",
          "text": "Further nested detail.",
          "children": []
        }
      ]
    }
  ]
}
```

## Validation Rules

### Required Fields

**Meta object:**

- documentType
- companyName
- version
- status
- jurisdiction
- lastUpdated

**Section object:**

- id
- title
- clauses (array, can be empty)

**Clause object:**

- id
- title
- text
- children (array, can be empty)

**Definition term:**

- key
- definedTerm
- description

### Constraints

- All IDs must be unique within their scope
- Schedule numbers must be unique and sequential
- Version strings must follow semver format
- Date strings must follow ISO 8601 (YYYY-MM-DD)
- Children arrays must always be present (even if empty)

## Integration Notes

When integrating with application code:

1. **Loading**: Parse JSON and validate structure
2. **Rendering**: Recursively render sections and clauses
3. **References**: Resolve definition references by key
4. **Schedules**: Load schedule files as separate documents
5. **Versioning**: Compare version strings for updates
6. **Search**: Index text fields for full-text search
7. **Navigation**: Use IDs for deep linking and anchors

## File Reference Format

When referencing schedule files in documentation or code, use the format:

```
#file:schedule-{number}-{identifier}.json
```

Examples:

- `#file:schedule-1-dpa.json` - Data Processing Addendum
- `#file:schedule-2-sla.json` - Service Level Agreement
- `#file:schedule-3-fees.json` - Fee Schedule

This format allows for:

- Easy identification of schedule files
- Consistent cross-referencing
- Automated link generation
- Clear association with parent documents
