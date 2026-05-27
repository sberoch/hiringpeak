"use client";

import dayjs from "dayjs";
import {
  Briefcase,
  CalendarCheck,
  Download,
  Edit,
  FileSpreadsheet,
  MoreHorizontal,
  Plus,
  Trash,
  UserPlus,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { PageHeading } from "@workspace/ui/components/page-heading";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import { downloadFile } from "@/lib/download";
import { stringToColor, vacancyDisplayLabel } from "@/lib/utils";
import { PermissionCode } from "@workspace/shared/enums";
import type { Vacancy } from "@workspace/shared/types/vacancy";
import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import { WorkflowInfoDialog } from "@workspace/ui/components/workflow-info-dialog";
import {
  downloadVacancyReportPdf,
  downloadVacancyReportXlsx,
} from "@/lib/api/vacancy";
import { PermissionGuard } from "../../auth/permission-guard";
import { DeleteVacancyDialog } from "../delete-vacancy-dialog";
import { AddCandidatesDialog } from "./add-candidates-dialog";
import { CloseVacancyDialog } from "./close-vacancy-dialog";

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
  const [isAddCandidatesDialogOpen, setIsAddCandidatesDialogOpen] =
    useState(false);
  const [isCloseDialogOpen, setIsCloseDialogOpen] = useState(false);
  const [isWorkflowInfoDialogOpen, setIsWorkflowInfoDialogOpen] =
    useState(false);
  const downloadReportMutation = useMutation({
    mutationFn: () => downloadVacancyReportPdf(vacancy.id.toString()),
    onSuccess: (file) => {
      downloadFile(file);
    },
    onError: () => {
      toast.error("No se pudo descargar el reporte PDF.");
    },
  });
  const downloadReportXlsxMutation = useMutation({
    mutationFn: () => downloadVacancyReportXlsx(vacancy.id.toString()),
    onSuccess: (file) => {
      downloadFile(file);
    },
    onError: () => {
      toast.error("No se pudo descargar el reporte Excel.");
    },
  });

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
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="brand-ghost"
            className="bg-white h-10 px-4 text-sm font-medium"
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
                {vacancy.closedAt && (
                  <span className="text-xs text-muted-brand font-normal">
                    Cerrada {dayjs(vacancy.closedAt).format("DD/MM/YY")}
                  </span>
                )}
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
            variant="brand"
            onClick={handleNewCandidateClick}
          >
            <UserPlus className="h-4 w-4 mr-1.5" />
            Nuevo postulante
          </Button>
          <PermissionGuard permissions={[PermissionCode.VACANCY_MANAGE]}>
            <Button
              size="sm"
              variant="brand-ghost"
              className="bg-white"
              onClick={() => setIsCloseDialogOpen(true)}
            >
              <CalendarCheck className="h-4 w-4 mr-1.5" />
              {vacancy.closedAt ? "Editar cierre" : "Cerrar vacante"}
            </Button>
          </PermissionGuard>
          <Button
            size="sm"
            variant="brand-ghost"
            className="bg-white"
            onClick={() => router.push(`/vacancies/${vacancy.id}/edit`)}
          >
            <Edit className="h-4 w-4 mr-1.5" />
            Editar
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="sm"
                variant="brand-ghost"
                className="bg-white px-2.5"
                aria-label="Más acciones"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="rounded-xl border-brand-border bg-surface"
            >
              <DropdownMenuLabel className="text-slate-brand">
                Acciones
              </DropdownMenuLabel>
              <DropdownMenuItem
                className="cursor-pointer text-ink"
                onClick={() => setIsAddCandidatesDialogOpen(true)}
              >
                <Plus className="h-4 w-4" />
                Agregar existentes
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer text-ink"
                disabled={downloadReportMutation.isPending}
                onClick={() => downloadReportMutation.mutate()}
              >
                <Download className="h-4 w-4" />
                {downloadReportMutation.isPending
                  ? "Generando PDF..."
                  : "Descargar PDF"}
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer text-ink"
                disabled={downloadReportXlsxMutation.isPending}
                onClick={() => downloadReportXlsxMutation.mutate()}
              >
                <FileSpreadsheet className="h-4 w-4" />
                {downloadReportXlsxMutation.isPending
                  ? "Generando Excel..."
                  : "Descargar Excel"}
              </DropdownMenuItem>
              <PermissionGuard permissions={[PermissionCode.VACANCY_MANAGE]}>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
                  onClick={() => setIsDeleteDialogOpen(true)}
                >
                  <Trash className="h-4 w-4" />
                  Eliminar
                </DropdownMenuItem>
              </PermissionGuard>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <DeleteVacancyDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        vacancy={vacancy}
      />
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
      {isCloseDialogOpen && (
        <CloseVacancyDialog
          isOpen={isCloseDialogOpen}
          onClose={() => {
            setIsCloseDialogOpen(false);
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
    </>
  );
};
