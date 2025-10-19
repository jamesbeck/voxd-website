import React from "react";
import { Breadcrumb } from "./BreadcrumbProvider";
import Link from "next/link";

export function Breadcrumbs({ breadcrumbs }: { breadcrumbs: Breadcrumb[] }) {
  if (!breadcrumbs || breadcrumbs.length === 0) return null;
  return (
    <nav
      className="inline-flex items-center  text-sm text-white"
      aria-label="Breadcrumb"
    >
      {breadcrumbs.map((crumb, idx) => (
        <span key={idx} className="flex items-center">
          {crumb.href ? (
            <Link href={crumb.href} className="hover:underline text-white">
              {crumb.label}
            </Link>
          ) : (
            <span>{crumb.label}</span>
          )}
          {idx < breadcrumbs.length - 1 && <span className="mx-2">/</span>}
        </span>
      ))}
    </nav>
  );
}
