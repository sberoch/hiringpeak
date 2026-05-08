"use client";

import { useQuery } from "@tanstack/react-query";
import { ChevronDown, ChevronUp, Filter, RotateCcw } from "lucide-react";
import { useState } from "react";

import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import {
  AUDIT_ENTITY_LABELS,
  AUDIT_EVENT_LABELS,
} from "@workspace/shared/types/audit-log";

import { getAllUsers, USERS_API_KEY } from "@/lib/api/user";
import type { AuditLogFilters as AuditLogFiltersType } from "@/hooks/use-audit-log-filters";

const ANY_VALUE = "__any__";

interface AuditLogFiltersProps {
  filters: AuditLogFiltersType;
  onFiltersChange: (filters: AuditLogFiltersType) => void;
  resetFilters: () => void;
}

export function AuditLogFilters({
  filters,
  onFiltersChange,
  resetFilters,
}: AuditLogFiltersProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const { data: users } = useQuery({
    queryKey: [USERS_API_KEY, { page: 1, limit: 1e9 }],
    queryFn: () => getAllUsers({ page: 1, limit: 1e9 }),
  });

  const sortedEvents = Object.entries(AUDIT_EVENT_LABELS).sort(([, a], [, b]) =>
    a.localeCompare(b, "es")
  );
  const sortedEntities = Object.entries(AUDIT_ENTITY_LABELS).sort(
    ([, a], [, b]) => a.localeCompare(b, "es")
  );

  return (
    <div className="rounded-2xl border border-brand-border bg-surface px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-electric/10 text-electric">
            <Filter className="h-3.5 w-3.5" />
          </div>
          <h3 className="text-sm font-semibold text-ink">Filtros</h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCollapsed((c) => !c)}
        >
          {isCollapsed ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronUp className="h-4 w-4" />
          )}
        </Button>
      </div>
      {!isCollapsed && (
        <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-2 lg:gap-3">
          <div className="space-y-1">
            <Label htmlFor="audit-date-from" className="text-xs text-slate-brand">
              Desde
            </Label>
            <Input
              id="audit-date-from"
              type="date"
              value={filters.dateFrom ?? ""}
              onChange={(e) =>
                onFiltersChange({
                  ...filters,
                  dateFrom: e.target.value || undefined,
                  page: 1,
                })
              }
              className="rounded-xl border-brand-border bg-canvas focus:border-electric focus:ring-electric/10"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="audit-date-to" className="text-xs text-slate-brand">
              Hasta
            </Label>
            <Input
              id="audit-date-to"
              type="date"
              value={filters.dateTo ?? ""}
              onChange={(e) =>
                onFiltersChange({
                  ...filters,
                  dateTo: e.target.value || undefined,
                  page: 1,
                })
              }
              className="rounded-xl border-brand-border bg-canvas focus:border-electric focus:ring-electric/10"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-slate-brand">Usuario</Label>
            <Select
              value={filters.actorUserId ? String(filters.actorUserId) : ANY_VALUE}
              onValueChange={(v) =>
                onFiltersChange({
                  ...filters,
                  actorUserId: v === ANY_VALUE ? undefined : Number(v),
                  page: 1,
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Cualquier usuario" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ANY_VALUE}>Cualquier usuario</SelectItem>
                {users?.items.map((u) => (
                  <SelectItem key={u.id} value={String(u.id)}>
                    {u.name ?? u.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-slate-brand">Tipo de entidad</Label>
            <Select
              value={filters.entityType ?? ANY_VALUE}
              onValueChange={(v) =>
                onFiltersChange({
                  ...filters,
                  entityType: v === ANY_VALUE ? undefined : v,
                  page: 1,
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Cualquier entidad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ANY_VALUE}>Cualquier entidad</SelectItem>
                {sortedEntities.map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-slate-brand">Acción</Label>
            <Select
              value={filters.eventType ?? ANY_VALUE}
              onValueChange={(v) =>
                onFiltersChange({
                  ...filters,
                  eventType: v === ANY_VALUE ? undefined : v,
                  page: 1,
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Cualquier acción" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ANY_VALUE}>Cualquier acción</SelectItem>
                {sortedEvents.map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={resetFilters}
              className="flex items-center rounded-xl border-brand-border hover:border-electric/30 transition-all"
            >
              <RotateCcw className="h-4 w-4" />
              Limpiar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
