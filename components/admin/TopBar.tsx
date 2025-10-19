"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { useBreadcrumbs } from "@/components/admin/BreadcrumbProvider";
import { Breadcrumbs } from "@/components/admin/Breadcrumbs";

export default function TopBar() {
  const { breadcrumbs } = useBreadcrumbs();
  return (
    <div className="p-2 border-b-1 border-lightgrey flex items-center gap-4 bg-primary text-white">
      <div className="border-r-1 border-white pr-[9px]">
        <SidebarTrigger />
      </div>
      <Breadcrumbs breadcrumbs={breadcrumbs} />
    </div>
  );
}
