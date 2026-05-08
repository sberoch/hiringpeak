"use client";

import Link from "next/link";
import { ChevronDown, ChevronRight, RotateCcw } from "lucide-react";
import { Fragment, useState } from "react";

import { Button } from "@workspace/ui/components/button";
import { Skeleton } from "@workspace/ui/components/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table";
import {
  AUDIT_ENTITY_LABELS,
  AUDIT_EVENT_LABELS,
  type AuditEntityRef,
  type AuditLogItem,
} from "@workspace/shared/types/audit-log";

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

const ENTITY_ROUTES: Record<string, (id: number) => string> = {
  vacancy: (id) => `/vacancies/${id}`,
  candidate: (id) => `/candidates/${id}`,
  company: (id) => `/companies/${id}`,
};

interface AuditLogTableProps {
  items: AuditLogItem[];
  totalItems: number;
  pageIndex: number;
  pageSize: number;
  pageCount: number;
  loading: boolean;
  hasFilters: boolean;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onActorClick: (actorUserId: number) => void;
  onEventClick: (eventType: string) => void;
  onClearFilters: () => void;
}

export function AuditLogTable({
  items,
  totalItems,
  pageIndex,
  pageSize,
  pageCount,
  loading,
  hasFilters,
  onPageChange,
  onPageSizeChange,
  onActorClick,
  onEventClick,
  onClearFilters,
}: AuditLogTableProps) {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  return (
    <div>
      <div className="rounded-2xl border border-brand-border bg-surface overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[8px] pl-4" />
              <TableHead className="px-4 font-semibold text-slate-brand">Fecha</TableHead>
              <TableHead className="px-4 font-semibold text-slate-brand">Usuario</TableHead>
              <TableHead className="px-4 font-semibold text-slate-brand">Acción</TableHead>
              <TableHead className="px-4 font-semibold text-slate-brand">Detalle</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={`skeleton-${i}`} className="animate-pulse">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <TableCell key={`skel-${i}-${j}`}>
                      <Skeleton className="h-4 w-full bg-brand-border-light rounded-md" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center">
                  <div className="flex flex-col items-center justify-center min-h-[280px] space-y-4 py-8">
                    <p className="text-muted-brand font-medium text-base">
                      {hasFilters
                        ? "Ningún resultado para estos filtros."
                        : "Aún no hay actividad registrada."}
                    </p>
                    {hasFilters && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={onClearFilters}
                        className="rounded-xl border-brand-border text-slate-brand hover:text-ink hover:border-electric hover:bg-electric/5"
                      >
                        <RotateCcw className="h-4 w-4 mr-1" />
                        Limpiar filtros
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => {
                const expanded = expandedId === item.id;
                return (
                  <Fragment key={item.id}>
                    <TableRow
                      className="cursor-pointer hover:bg-brand-border-light/40"
                      onClick={() =>
                        setExpandedId((cur) => (cur === item.id ? null : item.id))
                      }
                    >
                      <TableCell className="w-[8px] text-muted-brand pr-0">
                        {expanded ? (
                          <ChevronDown className="h-3.5 w-3.5" />
                        ) : (
                          <ChevronRight className="h-3.5 w-3.5" />
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-slate-brand whitespace-nowrap">
                        {new Date(item.createdAt).toLocaleString("es-AR", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })}
                      </TableCell>
                      <TableCell className="text-sm font-medium text-ink">
                        <button
                          type="button"
                          className="hover:text-electric hover:underline transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            onActorClick(item.actorUserId);
                          }}
                        >
                          {item.actorName ?? item.actorEmail ?? `#${item.actorUserId}`}
                        </button>
                      </TableCell>
                      <TableCell>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEventClick(item.eventType);
                          }}
                          className={`inline-flex items-center rounded-lg px-2.5 py-0.5 text-xs font-semibold transition-opacity hover:opacity-80 ${badgeClass(item.eventType)}`}
                        >
                          {AUDIT_EVENT_LABELS[item.eventType] ?? item.eventType}
                        </button>
                      </TableCell>
                      <TableCell className="text-sm text-ink max-w-md">
                        <DetailCell item={item} />
                      </TableCell>
                    </TableRow>
                    {expanded && (
                      <TableRow className="bg-brand-border-light/30 hover:bg-brand-border-light/30">
                        <TableCell colSpan={5} className="py-4">
                          <ExpandedDetails item={item} />
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mt-6 px-1 gap-3">
        <div className="flex items-center gap-3 text-sm text-slate-brand">
          <span>
            Mostrando{" "}
            <span className="px-2 py-0.5 bg-brand-border-light rounded-md font-semibold text-ink">
              {items.length}
            </span>{" "}
            de{" "}
            <span className="px-2 py-0.5 bg-brand-border-light rounded-md font-semibold text-ink">
              {totalItems}
            </span>{" "}
            registros
          </span>
          <label className="flex items-center gap-2">
            <span>Por página:</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="rounded-md border border-brand-border bg-surface px-2 py-1 text-sm text-ink focus:border-electric focus:outline-none"
            >
              {PAGE_SIZE_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            size="sm"
            disabled={pageIndex <= 0}
            onClick={() => onPageChange(pageIndex)}
            className="px-4 py-2 bg-surface hover:bg-canvas border-brand-border rounded-md shadow-none disabled:opacity-50"
          >
            Anterior
          </Button>
          <span className="text-sm text-slate-brand">
            Página {pageIndex + 1} de {Math.max(pageCount, 1)}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={pageIndex + 1 >= pageCount}
            onClick={() => onPageChange(pageIndex + 2)}
            className="px-4 py-2 bg-surface hover:bg-canvas border-brand-border rounded-md shadow-none disabled:opacity-50"
          >
            Siguiente
          </Button>
        </div>
      </div>
    </div>
  );
}

function DetailCell({ item }: { item: AuditLogItem }) {
  const primary = item.metadata?.context?.primary;
  const related = item.metadata?.context?.related ?? [];
  const isDeleted =
    item.eventType.startsWith("delete_") ||
    item.eventType.startsWith("remove_");

  if (!primary && related.length === 0) {
    return <span className="text-muted-brand">—</span>;
  }

  const segments: Array<{ ref: AuditEntityRef; deleted: boolean; linkable: boolean }> = [];
  if (primary) {
    segments.push({ ref: primary, deleted: isDeleted, linkable: true });
  }
  for (const r of related) {
    segments.push({ ref: r, deleted: false, linkable: !primary });
  }

  return (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      {segments.map((s, i) => (
        <Fragment key={`${s.ref.type}-${i}`}>
          {i > 0 && <span className="text-muted-brand">→</span>}
          <EntityLink
            entityType={s.ref.type}
            entityId={s.linkable && primary ? item.entityId : null}
            label={s.ref.label}
            deleted={s.deleted}
          />
        </Fragment>
      ))}
    </span>
  );
}

function EntityLink({
  entityType,
  entityId,
  label,
  deleted,
}: {
  entityType: string;
  entityId: number | null;
  label: string;
  deleted: boolean;
}) {
  const truncated = label.length > 80 ? `${label.slice(0, 80)}…` : label;
  const route =
    !deleted && entityId != null && ENTITY_ROUTES[entityType]
      ? ENTITY_ROUTES[entityType]!(entityId)
      : null;

  if (route) {
    return (
      <Link
        href={route}
        onClick={(e) => e.stopPropagation()}
        className="text-electric hover:underline"
      >
        {truncated}
      </Link>
    );
  }
  return (
    <span className={deleted ? "text-muted-brand italic" : "text-ink"}>
      {truncated}
      {deleted && <span className="ml-1 text-xs text-muted-brand">(eliminado)</span>}
    </span>
  );
}

function ExpandedDetails({ item }: { item: AuditLogItem }) {
  const rows: Array<[string, string | undefined]> = [
    ["Fecha completa", new Date(item.createdAt).toLocaleString("es-AR")],
    [
      "Tipo de entidad",
      AUDIT_ENTITY_LABELS[item.entityType] ?? item.entityType,
    ],
    ["ID interno", item.entityId != null ? String(item.entityId) : undefined],
    ["Email del usuario", item.actorEmail],
    ["IP", item.metadata?.client?.ip],
    ["Navegador", item.metadata?.client?.userAgent],
  ];
  return (
    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-xs">
      {rows.map(([label, value]) => (
        <div key={label} className="flex gap-2">
          <dt className="text-muted-brand min-w-[120px]">{label}</dt>
          <dd className="text-ink font-mono break-all">{value ?? "—"}</dd>
        </div>
      ))}
    </dl>
  );
}

function badgeClass(eventType: string): string {
  if (eventType.startsWith("create_")) return "bg-emerald-50 text-emerald-700";
  if (eventType.startsWith("update_")) return "bg-electric/5 text-electric";
  if (eventType.startsWith("delete_") || eventType.startsWith("remove_"))
    return "bg-red-50 text-red-600";
  if (eventType.startsWith("blacklist_")) return "bg-amber-50 text-amber-700";
  return "bg-brand-border-light text-slate-brand";
}
