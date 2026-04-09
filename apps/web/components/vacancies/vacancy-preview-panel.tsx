"use client";

import { useState } from "react";
import Link from "next/link";
import dayjs from "dayjs";
import {
  ArrowRight,
  Calendar,
  CalendarCheck,
  Clock,
  Copy,
  DollarSign,
  Download,
  Edit,
  FileText,
  Filter,
  Trash,
  User,
  UserCheck,
  Users,
} from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import { downloadFile } from "@/lib/download";
import { downloadVacancyReportPdf } from "@/lib/api/vacancy";

import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@workspace/ui/components/avatar";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { CatalogBadge } from "@/components/ui/catalog-badge";
import { getInitials, stringToColor, translateGender } from "@/lib/utils";
import { PermissionCode } from "@workspace/shared/enums";
import type { Vacancy } from "@workspace/shared/types/vacancy";
import { PermissionGuard } from "../auth/permission-guard";
import { DeleteVacancyDialog } from "./delete-vacancy-dialog";
import { EditVacancySheet } from "./edit-vacancy-sheet";
import { DuplicateVacancySheet } from "./duplicate-vacancy-sheet";

interface VacancyPreviewPanelProps {
  vacancy: Vacancy | null;
  isLoading?: boolean;
}

export function VacancyPreviewPanel({
  vacancy,
  isLoading,
}: VacancyPreviewPanelProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);
  const [isDuplicateSheetOpen, setIsDuplicateSheetOpen] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const downloadReportMutation = useMutation({
    mutationFn: () =>
      downloadVacancyReportPdf((vacancy?.id ?? "").toString()),
    onSuccess: (file) => {
      downloadFile(file);
    },
    onError: () => {
      toast.error("No se pudo descargar el reporte PDF.");
    },
  });

  if (isLoading) {
    return (
      <div className="h-full rounded-2xl border border-brand-border bg-surface p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <PreviewSkeleton />
      </div>
    );
  }

  if (!vacancy) {
    return (
      <div className="flex flex-col items-center justify-center h-full rounded-2xl border border-brand-border bg-surface p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)] py-20 space-y-3">
        <img
          src="/images/search.png"
          alt=""
          className="w-28 h-28 opacity-15 select-none pointer-events-none"
          draggable={false}
        />
        <p className="text-muted-brand font-medium text-sm">
          Selecciona una vacante para ver su detalle.
        </p>
      </div>
    );
  }

  const statusColor = stringToColor(vacancy.status.name);
  const daysDiff = dayjs().diff(dayjs(vacancy.createdAt), "day");
  const candidateCount = vacancy.candidates.length;

  // Group candidates by status
  const candidatesByStatus: Record<string, typeof vacancy.candidates> = {};
  vacancy.candidates.forEach((cv) => {
    const statusName = cv.status?.name ?? "Sin estado";
    if (!candidatesByStatus[statusName]) {
      candidatesByStatus[statusName] = [];
    }
    candidatesByStatus[statusName].push(cv);
  });

  const descriptionTruncated =
    vacancy.description &&
    vacancy.description.length > 200 &&
    !showFullDescription;

  const f = vacancy.filters;
  const hasFilters =
    !!f?.seniorities?.length ||
    !!f?.areas?.length ||
    !!f?.industries?.length ||
    f?.minStars != null ||
    f?.minAge != null ||
    f?.maxAge != null ||
    (!!f?.gender && f.gender !== "none") ||
    !!f?.countries?.length ||
    !!f?.provinces?.length ||
    !!f?.languages?.length;

  const filterBadgeCn =
    "text-xs bg-electric/5 text-electric border-electric/20 rounded-lg";

  return (
    <div className="h-full overflow-y-auto rounded-2xl border border-brand-border bg-surface p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <div className="space-y-5">
        {/* Header + actions row */}
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-xl font-bold tracking-tight text-ink">
                {vacancy.title}
              </h2>
              <Badge
                className="text-xs font-semibold rounded-lg border-0 text-white shrink-0"
                style={{ backgroundColor: statusColor }}
              >
                {vacancy.status.name}
              </Badge>
            </div>
            <p className="text-sm text-slate-brand mt-1">
              {vacancy.company.name}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
            <Button
              size="sm"
              variant="brand-ghost"
              onClick={() => setIsEditSheetOpen(true)}
            >
              <Edit className="h-3.5 w-3.5 mr-1.5" />
              Editar
            </Button>
            <Button
              size="sm"
              variant="brand-ghost"
              onClick={() => setIsDuplicateSheetOpen(true)}
            >
              <Copy className="h-3.5 w-3.5 mr-1.5" />
              Duplicar
            </Button>
            <Button
              size="sm"
              variant="brand-ghost"
              onClick={() => downloadReportMutation.mutate()}
              disabled={downloadReportMutation.isPending}
            >
              <Download className="h-3.5 w-3.5 mr-1.5" />
              {downloadReportMutation.isPending
                ? "Generando PDF..."
                : "Descargar reporte"}
            </Button>
            <PermissionGuard permissions={[PermissionCode.VACANCY_MANAGE]}>
              <Button
                size="sm"
                variant="brand-ghost"
                className="text-red-600 hover:bg-red-50 hover:border-red-200"
                onClick={() => setIsDeleteDialogOpen(true)}
              >
                <Trash className="h-3.5 w-3.5 mr-1.5" />
                Eliminar
              </Button>
            </PermissionGuard>
          </div>
        </div>

        {/* Ver detalle */}
        <Link
          href={`/vacancies/${vacancy.id}`}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-electric hover:text-electric-light transition-colors"
        >
          Ver detalle completo
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>

        {/* Summary metadata */}
        <div className="rounded-xl border border-brand-border bg-canvas/50 p-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <Clock className="h-3.5 w-3.5 text-muted-brand" />
              <span className="text-muted-brand">Días abierta</span>
              <span className="text-ink font-medium ml-auto">{daysDiff}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5 text-muted-brand" />
              <span className="text-muted-brand">Creación</span>
              <span className="text-ink font-medium ml-auto">
                {dayjs(vacancy.createdAt).format("DD/MM/YY")}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <User className="h-3.5 w-3.5 text-muted-brand" />
              <span className="text-muted-brand">Creado por</span>
              <span className="text-ink font-medium ml-auto truncate max-w-[120px]">
                {vacancy.createdBy?.name ?? "-"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <UserCheck className="h-3.5 w-3.5 text-muted-brand" />
              <span className="text-muted-brand">Asignado a</span>
              <span className="text-ink font-medium ml-auto truncate max-w-[120px]">
                {vacancy.assignedTo?.name ?? "-"}
              </span>
            </div>
            {vacancy.salary && (
              <div className="flex items-center gap-2">
                <DollarSign className="h-3.5 w-3.5 text-muted-brand" />
                <span className="text-muted-brand">Compensación</span>
                <span className="text-ink font-medium ml-auto truncate max-w-[120px]">
                  {vacancy.salary}
                </span>
              </div>
            )}
            {vacancy.closedAt && (
              <div className="flex items-center gap-2">
                <CalendarCheck className="h-3.5 w-3.5 text-muted-brand" />
                <span className="text-muted-brand">Cerrada</span>
                <span className="text-ink font-medium ml-auto">
                  {dayjs(vacancy.closedAt).format("DD/MM/YY")}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Description */}
        {vacancy.description && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <FileText className="h-3.5 w-3.5 text-electric" />
              <h3 className="text-sm font-semibold text-ink">Descripción</h3>
            </div>
            <p className="text-sm text-slate-brand leading-relaxed whitespace-pre-wrap">
              {descriptionTruncated
                ? vacancy.description.slice(0, 200) + "..."
                : vacancy.description}
            </p>
            {vacancy.description.length > 200 && (
              <button
                type="button"
                onClick={() => setShowFullDescription(!showFullDescription)}
                className="text-xs font-medium text-electric hover:text-electric-light mt-1 transition-colors"
              >
                {showFullDescription ? "Ver menos" : "Ver más"}
              </button>
            )}
          </div>
        )}

        {/* Search filters / requirements */}
        {hasFilters && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Filter className="h-3.5 w-3.5 text-electric" />
              <h3 className="text-sm font-semibold text-ink">Perfil buscado</h3>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {f.seniorities?.map((s) => (
                <CatalogBadge key={s.id} label={s.name} type="seniority" />
              ))}
              {f.areas?.map((a) => (
                <CatalogBadge key={a.id} label={a.name} type="area" />
              ))}
              {f.industries?.map((i) => (
                <CatalogBadge key={i.id} label={i.name} type="industry" />
              ))}
              {f.minStars != null && (
                <Badge variant="outline" className={filterBadgeCn}>
                  {"⭐".repeat(f.minStars)}
                </Badge>
              )}
              {(f.minAge != null || f.maxAge != null) && (
                <Badge variant="outline" className={filterBadgeCn}>
                  {f.minAge ?? ""}
                  {f.minAge != null && f.maxAge != null ? "-" : ""}
                  {f.maxAge ?? ""} años
                </Badge>
              )}
              {f.gender && f.gender !== "none" && (
                <Badge variant="outline" className={filterBadgeCn}>
                  {translateGender(f.gender)}
                </Badge>
              )}
              {f.countries?.map((c, i) => (
                <Badge key={i} variant="outline" className={filterBadgeCn}>
                  {c}
                </Badge>
              ))}
              {f.languages?.map((l, i) => (
                <Badge key={i} variant="outline" className={filterBadgeCn}>
                  {l}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Candidates overview */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Users className="h-3.5 w-3.5 text-electric" />
              <h3 className="text-sm font-semibold text-ink">
                Candidatos
                <span className="text-muted-brand font-normal ml-1.5">
                  ({candidateCount})
                </span>
              </h3>
            </div>
            {candidateCount > 0 && (
              <Link
                href={`/vacancies/${vacancy.id}`}
                className="flex items-center gap-1 text-xs font-medium text-electric hover:text-electric-light transition-colors"
              >
                Ver en tablero
                <ArrowRight className="h-3 w-3" />
              </Link>
            )}
          </div>

          {candidateCount === 0 ? (
            <p className="text-sm text-muted-brand italic">
              No hay candidatos en esta vacante.
            </p>
          ) : (
            <div className="space-y-3">
              {/* Status breakdown */}
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(candidatesByStatus).map(
                  ([status, candidates]) => {
                    const color = stringToColor(status);
                    return (
                      <Badge
                        key={status}
                        variant="secondary"
                        className="text-xs rounded-lg font-semibold"
                        style={{ backgroundColor: color }}
                      >
                        {candidates.length}{" "}
                        {status.startsWith("Entrevista")
                          ? `E. ${status.split(" ")[1]}`
                          : status}
                      </Badge>
                    );
                  },
                )}
              </div>

              {/* Recent candidates list */}
              <div className="space-y-1">
                {vacancy.candidates.slice(0, 5).map((cv) => (
                  <div
                    key={cv.id}
                    className="flex items-center gap-2.5 py-1.5 px-2 rounded-lg hover:bg-canvas/80 transition-colors"
                  >
                    <Avatar className="size-7">
                      {cv.candidate.image && (
                        <AvatarImage
                          src={cv.candidate.image}
                          alt={cv.candidate.name}
                        />
                      )}
                      <AvatarFallback className="bg-brand-border-light text-[10px] font-semibold text-slate-brand">
                        {getInitials(cv.candidate.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-ink truncate leading-tight">
                        {cv.candidate.name}
                      </p>
                    </div>
                    <Badge
                      variant="secondary"
                      className="text-[10px] rounded-md font-medium shrink-0"
                      style={{
                        backgroundColor: stringToColor(cv.status?.name ?? ""),
                      }}
                    >
                      {cv.status?.name ?? "-"}
                    </Badge>
                  </div>
                ))}
                {candidateCount > 5 && (
                  <Link
                    href={`/vacancies/${vacancy.id}`}
                    className="block text-center text-xs font-medium text-electric hover:text-electric-light py-2 transition-colors"
                  >
                    Ver {candidateCount - 5} más
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Dialogs */}
      {isDeleteDialogOpen && (
        <DeleteVacancyDialog
          isOpen={isDeleteDialogOpen}
          onClose={() => setIsDeleteDialogOpen(false)}
          vacancy={vacancy}
        />
      )}
      {isEditSheetOpen && (
        <EditVacancySheet
          isOpen={isEditSheetOpen}
          onClose={() => setIsEditSheetOpen(false)}
          vacancy={vacancy}
        />
      )}
      <DuplicateVacancySheet
        isOpen={isDuplicateSheetOpen}
        onClose={() => setIsDuplicateSheetOpen(false)}
        vacancy={vacancy}
      />
    </div>
  );
}

function PreviewSkeleton() {
  return (
    <div className="space-y-5">
      <div>
        <Skeleton className="h-6 w-2/3 bg-brand-border-light rounded-md" />
        <Skeleton className="h-4 w-1/3 bg-brand-border-light rounded-md mt-2" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-8 w-20 bg-brand-border-light rounded-xl" />
        <Skeleton className="h-8 w-20 bg-brand-border-light rounded-xl" />
      </div>
      <Skeleton className="h-24 w-full bg-brand-border-light rounded-xl" />
      <Skeleton className="h-16 w-full bg-brand-border-light rounded-xl" />
      <Skeleton className="h-32 w-full bg-brand-border-light rounded-xl" />
    </div>
  );
}
