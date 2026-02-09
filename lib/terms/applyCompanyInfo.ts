import { CompanyInfo } from "./companyInfo";

/**
 * Recursively replaces {{company.*}} placeholders in all string fields
 * with actual company values.
 *
 * Supports placeholders:
 * - {{company.name}} - Full legal company name
 * - {{company.shortName}} - Short name used in text
 * - {{company.number}} - Company registration number
 * - {{company.address}} - Registered address
 * - {{company.legalEmail}} - Legal notices email
 */
export function applyCompanyInfo<T>(data: T, company: CompanyInfo): T {
  if (data === null || data === undefined) {
    return data;
  }

  if (typeof data === "string") {
    return data
      .replace(/\{\{company\.name\}\}/g, company.name)
      .replace(/\{\{company\.shortName\}\}/g, company.shortName)
      .replace(/\{\{company\.number\}\}/g, company.number)
      .replace(/\{\{company\.address\}\}/g, company.address)
      .replace(/\{\{company\.legalEmail\}\}/g, company.legalEmail) as T;
  }

  if (Array.isArray(data)) {
    return data.map((item) => applyCompanyInfo(item, company)) as T;
  }

  if (typeof data === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data)) {
      result[key] = applyCompanyInfo(value, company);
    }
    return result as T;
  }

  return data;
}
