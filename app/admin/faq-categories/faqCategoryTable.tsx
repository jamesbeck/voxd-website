"use client";

import DataTable from "@/components/adminui/Table";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import saGetFaqCategoryTableData from "@/actions/saGetFaqCategoryTableData";

const FaqCategoryTable = () => {
  return (
    <DataTable
      getData={saGetFaqCategoryTableData}
      defaultSort={{
        name: "name",
        direction: "asc",
      }}
      columns={[
        {
          label: "Name",
          name: "name",
          sort: true,
        },
        {
          label: "FAQ Count",
          name: "faqCount",
          sort: true,
        },
        {
          label: "Created",
          name: "createdAt",
          sort: true,
          format: (row: any) => new Date(row.createdAt).toLocaleDateString(),
        },
      ]}
      actions={(row: any) => {
        return (
          <Button className="cursor-pointer" asChild>
            <Link href={`/admin/faq-categories/${row.id}`}>Edit</Link>
          </Button>
        );
      }}
    />
  );
};

export default FaqCategoryTable;
