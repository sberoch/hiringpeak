"use client";

import {
  ColumnDef,
  ColumnFiltersState,
  PaginationState,
  SortingState,
  Updater,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useState } from "react";

import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Skeleton } from "@workspace/ui/components/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  hidePagination?: boolean;
  loading?: boolean;
  pagination?: {
    pageCount: number;
    pageIndex: number;
    pageSize: number;
    totalItems: number;
    onPaginationChange: (updaterOrValue: Updater<PaginationState>) => void;
  };
  sorting?: {
    order?: string;
    onSortingChange: (updaterOrValue: Updater<SortingState>) => void;
  };
  search?: {
    value: string;
    onSearchChange: (value: string) => void;
  };
}

export function DataTable<TData, TValue>({
  columns,
  data,
  hidePagination,
  loading = false,
  pagination,
  sorting,
  search,
}: DataTableProps<TData, TValue>) {
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: sorting?.onSortingChange,
    manualSorting: true,
    manualFiltering: true,
    manualPagination: !!pagination,
    state: {
      sorting: sorting?.order
        ? [
          {
            id: sorting.order.split(":")[0],
            desc: sorting.order.split(":")[1] === "desc",
          },
        ]
        : [],
      columnFilters,
      ...(pagination && {
        pagination: {
          pageIndex: pagination.pageIndex,
          pageSize: pagination.pageSize,
        },
      }),
    },
    pageCount: pagination?.pageCount,
    onColumnFiltersChange: setColumnFilters,
    getPaginationRowModel: !pagination ? getPaginationRowModel() : undefined,
    onPaginationChange: pagination?.onPaginationChange,
  });

  return (
    <div>
      {search && (
        <div className="flex items-center py-6">
          <div className="relative max-w-sm">
            <Input
              placeholder="Buscar..."
              value={search.value}
              onChange={(event) => search.onSearchChange(event.target.value)}
              className="pl-10 pr-4 py-2 bg-white border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600"
            />
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
              <svg
                className="w-4 h-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>
        </div>
      )}
      <div className="rounded-xl border border-gray-200 shadow-sm bg-white dark:bg-gray-800 dark:border-gray-700 overflow-hidden">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
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
            {loading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={`skeleton-${index}`} className="animate-pulse">
                  {columns.map((_, colIndex) => (
                    <TableCell key={`skeleton-cell-${colIndex}`}>
                      <Skeleton className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded-md" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : table.getRowModel()?.rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-32 text-center"
                >
                  <div className="flex flex-col items-center justify-center space-y-3">
                    <svg
                      className="w-8 h-8 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    <p className="text-gray-500 dark:text-gray-400 font-medium">
                      No hay resultados.
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {!hidePagination && (
        <div className="flex items-center justify-between mt-8 px-2">
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
            <span>Mostrando</span>
            <span className="mx-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-md font-semibold text-gray-900 dark:text-gray-100">
              {data.length}
            </span>
            <span>de</span>
            <span className="mx-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-md font-semibold text-gray-900 dark:text-gray-100">
              {pagination?.totalItems}
            </span>
            <span>registros</span>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="px-4 py-2 bg-white hover:bg-gray-50 border-gray-300 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:hover:bg-gray-700 dark:border-gray-600"
            >
              <svg
                className="w-4 h-4 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Anterior
            </Button>
            <div className="flex items-center space-x-1 text-sm text-gray-600 dark:text-gray-400">
              <span>
                Página {(pagination?.pageIndex || 0) + 1} de{" "}
                {pagination?.pageCount || 1}
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="px-4 py-2 bg-white hover:bg-gray-50 border-gray-300 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:hover:bg-gray-700 dark:border-gray-600"
            >
              Siguiente
              <svg
                className="w-4 h-4 ml-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
