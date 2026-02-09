export interface CompanyInfo {
  name: string; // Full legal company name, e.g., "Voxd AI LTD"
  shortName: string; // Short name used in clause text, e.g., "Voxd"
  number: string; // Company registration number, e.g., "16911937"
  address: string; // Single-line comma-separated address
  legalEmail: string; // Email for legal notices
}

export const VOXD_COMPANY_INFO: CompanyInfo = {
  name: "Voxd AI LTD",
  shortName: "Voxd",
  number: "16911937",
  address: "Wharf Cottage, Daneway, Sapperton, Gloucestershire, GL7 6LN",
  legalEmail: "james.beck@voxd.ai",
};
