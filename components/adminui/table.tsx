"use client";

import {
  Column,
  ColumnDef,
  SortingState,
  getSortedRowModel,
  flexRender,
  getCoreRowModel,
  useReactTable,
  // CellContext,
  // Row,
} from "@tanstack/react-table";
import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowDown, ArrowUp } from "lucide-react";
import Link from "next/link";

interface DataTableProps<TData> {
  columns: {
    label: string;
    name: string;
    sort?: boolean;
    format?: (value: any, row: TData) => string | React.ReactNode;
    linkTo?: (r: TData) => string;
  }[];
  actions?: (row: TData) => React.ReactNode;
  data: TData[];
  defaultSort?: SortingState;
}

export default function DataTable<TData>({
  columns: columnConfig,
  actions,
  data,
  defaultSort,
}: DataTableProps<TData>) {
  const [sorting, setSorting] = useState<SortingState>(defaultSort || []);

  const columns: ColumnDef<TData>[] = columnConfig.map((columnConfig) => {
    return {
      accessorKey: columnConfig.name,
      header: columnConfig.sort
        ? ({ column }: { column: Column<TData> }) => {
            const sort = column.getIsSorted();
            return (
              <div
                className="flex items-center cursor-pointer h-full"
                onClick={() =>
                  column.toggleSorting(column.getIsSorted() === "asc")
                }
              >
                {columnConfig.label}
                {sort === "desc" && <ArrowUp className="ml-2 h-4 w-4" />}
                {sort === "asc" && <ArrowDown className="ml-2 h-4 w-4" />}
              </div>
            );
          }
        : columnConfig.label,
      cell: ({ row }) => {
        let display: string | React.ReactNode;

        if (columnConfig.format) {
          display = columnConfig.format(
            row.getValue(columnConfig.name),
            row.original
          );
        } else display = row.getValue(columnConfig.name);

        if (!columnConfig.linkTo) return display;
        return <Link href={columnConfig.linkTo(row.original)}>{display}</Link>;
      },
    };
  });

  if (actions) {
    columns.push({
      id: "actions",
      cell: ({ row }) => {
        return actions(row.original);
      },
    });
  }

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting,
    },
  });

  return (
    <Table className="rounded-md bg-white overflow-hidden">
      <TableHeader className="bg-primary">
        {table.getHeaderGroups().map((headerGroup) => (
          <TableRow key={headerGroup.id}>
            {headerGroup.headers.map((header) => {
              return (
                <TableHead key={header.id} className="text-white">
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                </TableHead>
              );
            })}
          </TableRow>
        ))}
      </TableHeader>
      <TableBody>
        {table.getRowModel().rows?.length ? (
          table.getRowModel().rows.map((row) => (
            <TableRow
              key={row.id}
              data-state={row.getIsSelected() && "selected"}
            >
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell colSpan={columns.length} className="h-24 text-center">
              No results.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
