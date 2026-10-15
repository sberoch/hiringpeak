"use client";

import { useQuery } from "@tanstack/react-query";
import { BookUser, Lock, Plus, Search, SlidersHorizontal } from "lucide-react";
import { useState } from "react";

import { Button } from "@workspace/ui/components/button";
import { DataTable } from "@workspace/ui/components/data-table";
import { Input } from "@workspace/ui/components/input";
import { PageHeading } from "@workspace/ui/components/page-heading";
import { hasCommercialAccess } from "@workspace/shared/lib/commercial-access";
import { canManageContacts } from "@workspace/shared/lib/contact-access";

import { usePermissions } from "@/contexts/permission-context";
import { useContactFilters } from "@/hooks/use-contact-filters";
import { CONTACT_API_KEY, getContacts } from "@/lib/api/contact";
import { ContactCaptureSheet } from "./contact-capture-sheet";
import {
  ActiveFilterChips,
  ContactFilterPanel,
  useActiveFilterCount,
} from "./contact-filter-panel";
import { columns } from "./contact-table-columns";

/** Shown instead of a commercial-only page to users without commercial access. */
export function NoCommercialAccess() {
  return (
    <div className="mx-auto mt-24 flex max-w-md flex-col items-center text-center">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-brand-border-light">
        <Lock className="h-5 w-5 text-muted-brand" />
      </div>
      <p className="text-sm font-medium text-ink">Sin acceso comercial</p>
      <p className="mt-0.5 text-xs text-muted-brand">
        Esta sección es parte del área comercial.
      </p>
    </div>
  );
}

/** Contactos: the Organization's commercial network (commercial access only). */
export function ContactsPage() {
  const { permissionCodes, isLoading } = usePermissions();
  if (isLoading) return null;
  if (!hasCommercialAccess(permissionCodes)) return <NoCommercialAccess />;
  return <ContactsList canManage={canManageContacts(permissionCodes)} />;
}

function ContactsList({ canManage }: { canManage: boolean }) {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [captureOpen, setCaptureOpen] = useState(false);
  const { filters, params, setFilters, onPaginationChange, onSortingChange } =
    useContactFilters({ initialValues: { limit: 50, order: "name:asc" } });

  const { data, isLoading } = useQuery({
    queryKey: [CONTACT_API_KEY, params],
    queryFn: () => getContacts(params),
  });
  const activeFilterCount = useActiveFilterCount(filters);

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <PageHeading
          icon={BookUser}
          title="Contactos"
          description="Tu red comercial: las personas detrás de los negocios."
        />
        {canManage && (
          <Button
            onClick={() => setCaptureOpen(true)}
            className="rounded-md bg-electric font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-electric-light hover:shadow-[0_8px_24px_-6px_rgba(0,102,255,0.3)]"
          >
            <Plus className="h-4 w-4" />
            Nuevo contacto
          </Button>
        )}
      </div>

      <div className="mb-4 flex items-center gap-3">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-brand" />
          <Input
            type="search"
            placeholder="Buscar por nombre, email o empresa…"
            className="rounded-xl border-brand-border bg-surface pl-9 placeholder:text-muted-brand focus:border-electric focus:ring-electric/10"
            value={filters.search ?? ""}
            onChange={(event) =>
              setFilters({ ...filters, search: event.target.value, page: 1 })
            }
          />
        </div>
        <Button
          variant="outline"
          onClick={() => setFiltersOpen(true)}
          className="relative gap-2 rounded-xl border-brand-border text-slate-brand transition-all hover:border-electric hover:bg-electric/5 hover:text-ink"
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filtros
          {activeFilterCount > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-electric px-1.5 text-[11px] font-bold text-white">
              {activeFilterCount}
            </span>
          )}
        </Button>
      </div>

      {activeFilterCount > 0 && (
        <div className="mb-4">
          <ActiveFilterChips filters={filters} onFiltersChange={setFilters} />
        </div>
      )}

      <ContactFilterPanel
        open={filtersOpen}
        onOpenChange={setFiltersOpen}
        filters={filters}
        onFiltersChange={setFilters}
      />

      <div className="mb-12">
        <DataTable
          columns={columns}
          data={data?.items ?? []}
          pagination={{
            totalItems: data?.meta.totalItems || 1,
            pageCount: data?.meta.totalPages || 1,
            pageIndex: (filters.page || 1) - 1,
            pageSize: filters.limit || 50,
            onPaginationChange,
          }}
          sorting={{ order: filters.order, onSortingChange }}
          loading={isLoading && !data}
        />
      </div>

      {canManage && (
        <ContactCaptureSheet open={captureOpen} onOpenChange={setCaptureOpen} />
      )}
    </>
  );
}
