"use client";

import DataTable from "@/components/adminui/Table";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import saGetFaqTableData from "@/actions/saGetFaqTableData";
import { Badge } from "@/components/ui/badge";

const FaqTable = ({ isSuperAdmin }: { isSuperAdmin?: boolean }) => {
  return (
    <DataTable
      getData={saGetFaqTableData}
      defaultSort={{
        name: "createdAt",
        direction: "desc",
      }}
      columns={[
        {
          label: "Category",
          name: "categoryName",
          sort: true,
          format: (row: any) => (
            <Badge variant="outline">
              {row.categoryName || "Uncategorized"}
            </Badge>
          ),
        },
        {
          label: "Question",
          name: "question",
          sort: true,
          format: (row: any) => (
            <span className="line-clamp-2 max-w-md">{row.question}</span>
          ),
        },
        {
          label: "Answer",
          name: "answer",
          sort: false,
          format: (row: any) => (
            <span className="line-clamp-2 max-w-md">{row.answer}</span>
          ),
        },
        {
          label: "Partners Only",
          name: "partnersOnly",
          sort: true,
          format: (row: any) =>
            row.partnersOnly ? (
              <Badge variant="secondary">Partners Only</Badge>
            ) : (
              <Badge variant="outline">Public</Badge>
            ),
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
            <Link href={`/admin/faq/${row.id}`}>
              {isSuperAdmin ? "Edit" : "View"}
            </Link>
          </Button>
        );
      }}
    />
  );
};

export default FaqTable;
