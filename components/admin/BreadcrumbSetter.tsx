"use client";

import { useEffect } from "react";
import { useBreadcrumbs, Breadcrumb } from "./BreadcrumbProvider";

interface BreadcrumbSetterProps {
  breadcrumbs: Breadcrumb[];
}

export default function BreadcrumbSetter({
  breadcrumbs,
}: BreadcrumbSetterProps) {
  const { setBreadcrumbs } = useBreadcrumbs();
  useEffect(() => {
    setBreadcrumbs(breadcrumbs);
    // Optionally clear on unmount:
    // return () => setBreadcrumbs([]);
  }, [breadcrumbs, setBreadcrumbs]);
  return null;
}
