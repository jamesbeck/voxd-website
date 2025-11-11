"use client";

import { useEffect } from "react";
import { useBreadcrumbs, Breadcrumb } from "./BreadcrumbProvider";

interface BreadcrumbSetterProps {
  breadcrumbs: (Breadcrumb | null)[];
}

export default function BreadcrumbSetter({
  breadcrumbs,
}: BreadcrumbSetterProps) {
  const { setBreadcrumbs } = useBreadcrumbs();
  useEffect(() => {
    const filteredBreadcrumbs = breadcrumbs.filter(Boolean) as Breadcrumb[];
    setBreadcrumbs(filteredBreadcrumbs);
    // Optionally clear on unmount:
    // return () => setBreadcrumbs([]);
  }, [breadcrumbs, setBreadcrumbs]);
  return null;
}
