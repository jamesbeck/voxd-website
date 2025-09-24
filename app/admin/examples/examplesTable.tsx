"use client";

import DataTable from "@/components/adminui/table";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Example } from "@/types/types";
import { IndustryTable, FunctionTable } from "@/types/dbTableTypes";

const ExamplesTable = ({ examples }: { examples: Example[] }) => {
  return (
    <DataTable
      data={examples}
      defaultSort={[
        {
          id: "title",
          desc: false,
        },
      ]}
      columns={[
        {
          label: "Title",
          name: "title",
          sort: true,
          format: (value) => value || "",
        },
        // {
        //   label: "Slug",
        //   name: "slug",
        //   sort: true,
        //   format: (value) => value || "",
        // },
        {
          label: "Industries",
          name: "industries",
          sort: true,
          format: (value) => (
            <ul>
              {value.map((industry: IndustryTable) => (
                <li key={industry.id}>{industry.name}</li>
              ))}
            </ul>
          ),
        },
        {
          label: "Functions",
          name: "functions",
          sort: true,
          format: (value) => (
            <ul>
              {value.map((func: FunctionTable) => (
                <li key={func.id}>{func.name}</li>
              ))}
            </ul>
          ),
        },
      ]}
      actions={(row: any) => {
        return (
          <div className="flex gap-2">
            <Button className="cursor-pointer" asChild>
              <Link href={`/admin/examples/${row.id}`}>View</Link>
            </Button>
            <Button className="cursor-pointer" asChild>
              <Link href={`/admin/examples/${row.id}/generate-chat`}>
                Generate Chat
              </Link>
            </Button>
          </div>
        );
      }}
    />
  );
};

export default ExamplesTable;
