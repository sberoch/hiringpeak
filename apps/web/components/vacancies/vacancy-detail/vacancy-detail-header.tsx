"use client";

import dayjs from "dayjs";
import {
  Briefcase,
  Edit,
  FileText,
  Plus,
  Search,
  Trash,
  UserPlus,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { PageHeading } from "@workspace/ui/components/page-heading";
import { useState } from "react";

import { stringToColor, vacancyDisplayLabel } from "@/lib/utils";
import { PermissionCode } from "@workspace/shared/enums";
import type { Vacancy } from "@workspace/shared/types/vacancy";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { WorkflowInfoDialog } from "@workspace/ui/components/workflow-info-dialog";
import { PermissionGuard } from "../../auth/permission-guard";
import { DeleteVacancyDialog } from "../delete-vacancy-dialog";
import { EditVacancySheet } from "../edit-vacancy-sheet";
import { AddCandidatesDialog } from "./add-candidates-dialog";
import { VacancyDetailHeaderFilters } from "./vacancy-detail-header-filters";

interface VacancyDetailHeaderProps {
  vacancy: Vacancy;
  onDialogClose: () => void;
}

export const VacancyDetailHeader = ({
  vacancy,
  onDialogClose,
}: VacancyDetailHeaderProps) => {
  const router = useRouter();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);
  const [isAddCandidatesDialogOpen, setIsAddCandidatesDialogOpen] =
    useState(false);
  const [isWorkflowInfoDialogOpen, setIsWorkflowInfoDialogOpen] =
    useState(false);

  const color = stringToColor(vacancy.status.name);

  const handleNewCandidateClick = () => {
    const storageKey = "pratt-hide-new-candidate-info";
    const shouldShowDialog = !localStorage.getItem(storageKey);

    if (shouldShowDialog) {
      setIsWorkflowInfoDialogOpen(true);
    } else {
      navigateToNewCandidate();
    }
  };

  const navigateToNewCandidate = () => {
    const queryParams = new URLSearchParams({
      vacancyId: vacancy.id.toString(),
      returnTo: `/vacancies/${vacancy.id}`,
    });
    router.push(`/candidates/new?${queryParams.toString()}`);
  };

  return (
    <div className="space-y-6">
      {/* Page heading */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="brand-ghost"
            className="h-10 px-4 text-sm font-medium"
            onClick={() => router.back()}
          >
            ← Volver
          </Button>
          <PageHeading
            icon={Briefcase}
            title={
              <span className="flex items-center gap-2.5">
                {vacancyDisplayLabel(vacancy)}
                <Badge
                  className="text-xs font-semibold rounded-lg border-0 text-white"
                  style={{ backgroundColor: color }}
                >
                  {vacancy.status.name}
                </Badge>
              </span>
            }
            description={
              <>
                {vacancy.company.name} &middot; Asignado a{" "}
                {vacancy.assignedTo.name}
              </>
            }
          />
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            size="sm"
            variant="brand-ghost"
            onClick={() => setIsEditSheetOpen(true)}
          >
            <Edit className="h-4 w-4 mr-1.5" />
            Editar
          </Button>
          <Button
            size="sm"
            variant="brand-ghost"
            onClick={() => setIsAddCandidatesDialogOpen(true)}
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Agregar existentes
          </Button>
          <Button
            size="sm"
            variant="brand"
            onClick={handleNewCandidateClick}
          >
            <UserPlus className="h-4 w-4 mr-1.5" />
            Nuevo postulante
          </Button>
          <PermissionGuard permissions={[PermissionCode.VACANCY_MANAGE]}>
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl border-brand-border text-red-600 hover:bg-red-50 hover:border-red-200 transition-all ease-[cubic-bezier(0.16,1,0.3,1)]"
              onClick={() => setIsDeleteDialogOpen(true)}
            >
              <Trash className="h-4 w-4 mr-1.5" />
              Eliminar
            </Button>
          </PermissionGuard>
        </div>
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Description card */}
        <div className="rounded-2xl border border-brand-border bg-surface p-6 col-span-1 lg:col-span-2 order-first">
          <div className="flex items-center gap-2 mb-4">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-electric/10 text-electric">
              <FileText className="h-3.5 w-3.5" />
            </div>
            <h3 className="text-sm font-semibold text-ink">
              Descripción
            </h3>
          </div>
          {vacancy.description ? (
            <div className="whitespace-pre-wrap text-sm text-slate-brand leading-relaxed">
              {vacancy.description}
            </div>
          ) : (
            <div className="text-muted-brand text-sm italic">
              No hay descripción disponible
            </div>
          )}
        </div>

        {/* Metadata card */}
        <div className="rounded-2xl border border-brand-border bg-surface p-6 col-span-1">
          <div className="flex items-center gap-2 mb-4">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-electric/10 text-electric">
              <Search className="h-3.5 w-3.5" />
            </div>
            <h3 className="text-sm font-semibold text-ink">
              Detalles
            </h3>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-brand">Creación</span>
              <span className="text-ink font-medium">
                {dayjs(vacancy.createdAt).toDate().toLocaleDateString()}
              </span>
            </div>
            <div className="h-px bg-brand-border-light" />
            <div className="flex justify-between">
              <span className="text-muted-brand">Actualización</span>
              <span className="text-ink font-medium">
                {dayjs(vacancy.updatedAt).toDate().toLocaleDateString()}
              </span>
            </div>
            <div className="h-px bg-brand-border-light" />
            <div className="flex justify-between">
              <span className="text-muted-brand">Empresa</span>
              <span className="text-ink font-medium">
                {vacancy.company.name}
              </span>
            </div>
            <div className="h-px bg-brand-border-light" />
            <div className="flex justify-between">
              <span className="text-muted-brand">Creado por</span>
              <span className="text-ink font-medium">
                {vacancy.createdBy.name}
              </span>
            </div>
            <div className="h-px bg-brand-border-light" />
            <div className="flex justify-between">
              <span className="text-muted-brand">Asignado a</span>
              <span className="text-ink font-medium">
                {vacancy.assignedTo.name}
              </span>
            </div>
          </div>
        </div>

        {/* Filters card */}
        <VacancyDetailHeaderFilters vacancy={vacancy} />
      </div>

      <DeleteVacancyDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        vacancy={vacancy}
      />
      {isEditSheetOpen && (
        <EditVacancySheet
          isOpen={isEditSheetOpen}
          onClose={() => setIsEditSheetOpen(false)}
          vacancy={vacancy}
        />
      )}
      {isAddCandidatesDialogOpen && (
        <AddCandidatesDialog
          isOpen={isAddCandidatesDialogOpen}
          onClose={() => {
            setIsAddCandidatesDialogOpen(false);
            onDialogClose();
          }}
          vacancy={vacancy}
        />
      )}
      <WorkflowInfoDialog
        isOpen={isWorkflowInfoDialogOpen}
        onClose={() => setIsWorkflowInfoDialogOpen(false)}
        onConfirm={() => {
          setIsWorkflowInfoDialogOpen(false);
          navigateToNewCandidate();
        }}
        title="Crear nuevo postulante"
        description="Se abrirá el formulario para crear un nuevo postulante. Una vez creado, será automáticamente agregado a esta vacante y regresará a esta página."
        showDontShowAgain={true}
        storageKey="pratt-hide-new-candidate-info"
      />
    </div>
  );
};
