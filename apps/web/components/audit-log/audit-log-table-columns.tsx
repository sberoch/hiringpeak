"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";

import { Button } from "@workspace/ui/components/button";
import type { AuditLogItem } from "@workspace/shared/types/audit-log";

const EVENT_TYPE_LABELS: Record<string, string> = {
  create_user: "Usuario creado",
  update_user: "Usuario actualizado",
  delete_user: "Usuario eliminado",
  create_role: "Rol creado",
  update_role: "Rol actualizado",
  delete_role: "Rol eliminado",
  create_candidate: "Postulante creado",
  update_candidate: "Postulante actualizado",
  delete_candidate: "Postulante eliminado",
  blacklist_candidate: "Postulante en lista negra",
  create_vacancy: "Vacante creada",
  update_vacancy: "Vacante actualizada",
  delete_vacancy: "Vacante eliminada",
  create_vacancy_status: "Estado de vacante creado",
  update_vacancy_status: "Estado de vacante actualizado",
  delete_vacancy_status: "Estado de vacante eliminado",
  create_industry: "Industria creada",
  update_industry: "Industria actualizada",
  delete_industry: "Industria eliminada",
  create_company: "Empresa creada",
  update_company: "Empresa actualizada",
  delete_company: "Empresa eliminada",
  create_comment: "Comentario creado",
  update_comment: "Comentario actualizado",
  delete_comment: "Comentario eliminado",
  create_candidate_vacancy_status: "Estado postulante-vacante creado",
  update_candidate_vacancy_status: "Estado postulante-vacante actualizado",
  delete_candidate_vacancy_status: "Estado postulante-vacante eliminado",
  create_candidate_vacancy: "Postulante asignado a vacante",
  update_candidate_vacancy: "Postulante-vacante actualizado",
  delete_candidate_vacancy: "Postulante desasignado de vacante",
  create_candidate_source: "Origen de postulante creado",
  update_candidate_source: "Origen de postulante actualizado",
  delete_candidate_source: "Origen de postulante eliminado",
  create_candidate_file: "Archivo de postulante creado",
  update_candidate_file: "Archivo de postulante actualizado",
  delete_candidate_file: "Archivo de postulante eliminado",
  create_blacklist_entry: "Entrada en lista negra creada",
  update_blacklist_entry: "Entrada en lista negra actualizada",
  delete_blacklist_entry: "Entrada en lista negra eliminada",
  remove_candidate_from_blacklist: "Postulante quitado de lista negra",
  create_area: "Área creada",
  update_area: "Área actualizada",
  delete_area: "Área eliminada",
};

function getEventBadgeStyle(eventType: string) {
  if (eventType.startsWith("create_")) return "bg-emerald-50 text-emerald-700";
  if (eventType.startsWith("update_")) return "bg-electric/5 text-electric";
  if (eventType.startsWith("delete_") || eventType.startsWith("remove_")) return "bg-red-50 text-red-600";
  if (eventType.startsWith("blacklist_")) return "bg-amber-50 text-amber-700";
  return "bg-brand-border-light text-slate-brand";
}

export const columns: ColumnDef<AuditLogItem>[] = [
  {
    accessorKey: "createdAt",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="h-auto p-0 font-semibold text-slate-brand hover:text-ink hover:bg-transparent transition-colors"
      >
        Fecha
        <ArrowUpDown className="ml-2 h-3 w-3 opacity-60" />
      </Button>
    ),
    cell: ({ row }) => {
      const createdAt = row.getValue("createdAt") as string;
      return (
        <span className="text-sm text-slate-brand">
          {new Date(createdAt).toLocaleString(undefined, {
            dateStyle: "short",
            timeStyle: "short",
          })}
        </span>
      );
    },
  },
  {
    accessorKey: "actorName",
    header: () => <span className="pl-4 font-semibold text-slate-brand">Usuario</span>,
    cell: ({ row }) => (
      <span className="text-sm font-medium text-ink">
        {row.original.actorName ?? row.original.actorEmail ?? `#${row.original.actorUserId}`}
      </span>
    ),
  },
  {
    accessorKey: "eventType",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="h-auto p-0 font-semibold text-slate-brand hover:text-ink hover:bg-transparent transition-colors"
      >
        Acción
        <ArrowUpDown className="ml-2 h-3 w-3 opacity-60" />
      </Button>
    ),
    cell: ({ row }) => (
      <span
        className={`inline-flex items-center rounded-lg px-2.5 py-0.5 text-xs font-semibold ${getEventBadgeStyle(row.original.eventType)}`}
      >
        {EVENT_TYPE_LABELS[row.original.eventType] ?? row.original.eventType}
      </span>
    ),
  },
  {
    accessorKey: "entityType",
    header: () => <span className="pl-4 font-semibold text-slate-brand">Tipo de entidad</span>,
    cell: ({ row }) => (
      <span className="text-sm capitalize text-ink">{row.original.entityType}</span>
    ),
  },
  {
    accessorKey: "entityId",
    header: () => <span className="pl-4 font-semibold text-slate-brand">ID entidad</span>,
    cell: ({ row }) => (
      <span className="text-sm text-muted-brand font-mono">
        {row.original.entityId != null ? String(row.original.entityId) : "—"}
      </span>
    ),
  },
];
