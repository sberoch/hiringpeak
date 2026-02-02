"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import dayjs from "dayjs";
import { Edit, Plus, Trash, UserPlus } from "lucide-react";

import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { Card } from "@workspace/ui/components/card";
import { WorkflowInfoDialog } from "@workspace/ui/components/workflow-info-dialog";
import { DeleteVacancyDialog } from "../delete-vacancy-dialog";
import { EditVacancySheet } from "../edit-vacancy-sheet";
import { AddCandidatesDialog } from "./add-candidates-dialog";
import { VacancyDetailHeaderFilters } from "./vacancy-detail-header-filters";
import { stringToColor, vacancyDisplayLabel } from "@/lib/utils";
import type { Vacancy } from "@workspace/shared/types/vacancy";
import { UserRoleEnum } from "@workspace/shared/types/user";
import { RBACAuthzGuard } from "../../auth/rbac-authz-guard";

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
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            ← Volver
          </Button>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold mr-2">
              {vacancyDisplayLabel(vacancy)}
            </h1>
            <Badge
              variant="secondary"
              className="mt-1"
              style={{ backgroundColor: color }}
            >
              {vacancy.status.name}
            </Badge>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <Card className="p-4 col-span-1 lg:col-span-3">
          <div className="mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              🔍 Filtros de la búsqueda
            </h3>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 text-sm">
            <div>
              <div className="text-gray-500">Fecha de creación</div>
              <div>{dayjs(vacancy.createdAt).toDate().toLocaleDateString()}</div>
            </div>
            <div>
              <div className="text-gray-500">Última actualización</div>
              <div>{dayjs(vacancy.updatedAt).toDate().toLocaleDateString()}</div>
            </div>
            <div>
              <div className="text-gray-500">Empresas</div>
              <div>{vacancy.company.name}</div>
            </div>
            <div>
              <div className="text-gray-500">Creado por</div>
              <div>{vacancy.createdBy.name}</div>
            </div>
            <div>
              <div className="text-gray-500">Asignado a</div>
              <div>{vacancy.assignedTo.name}</div>
            </div>
          </div>
          <VacancyDetailHeaderFilters vacancy={vacancy} />
        </Card>

        <Card className="p-4 col-span-1 lg:col-span-1">
          <div className="flex flex-col gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
              onClick={() => setIsEditSheetOpen(true)}
            >
              <Edit className="h-4 w-4" />
              Editar vacante
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
              onClick={() => setIsAddCandidatesDialogOpen(true)}
            >
              <Plus className="h-4 w-4" />
              Agregar postulantes existentes
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
              onClick={handleNewCandidateClick}
            >
              <UserPlus className="h-4 w-4" />
              Nuevo postulante
            </Button>
            <RBACAuthzGuard visibleTo={[UserRoleEnum.ADMIN]}>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2 text-red-600"
                onClick={() => setIsDeleteDialogOpen(true)}
              >
                <Trash className="h-4 w-4" />
                Eliminar vacante
              </Button>
            </RBACAuthzGuard>
          </div>
        </Card>

        <Card className="p-4 col-span-1 lg:col-span-4 order-first lg:order-none">
          <div className="mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              📝 Descripción
            </h3>
          </div>
          {vacancy.description ? (
            <div className="whitespace-pre-wrap text-sm">
              {vacancy.description}
            </div>
          ) : (
            <div className="text-gray-500 text-sm italic">
              No hay descripción disponible
            </div>
          )}
        </Card>
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
