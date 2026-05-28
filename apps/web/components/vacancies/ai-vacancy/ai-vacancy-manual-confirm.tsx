"use client";

import { ClipboardCheck } from "lucide-react";

import { Button } from "@workspace/ui/components/button";
import { Label } from "@workspace/ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import type { Company } from "@workspace/shared/types/company";
import type { AiVacancyDraft } from "@workspace/shared/types/vacancy-ai";
import type { User } from "@workspace/shared/types/user";
import type { VacancyStatus } from "@workspace/shared/types/vacancy-status";
import { AiVacancySection, fieldClassName } from "./ai-vacancy-section";

interface AiVacancyManualConfirmSectionProps {
  draft: AiVacancyDraft;
  companies: Company[];
  users: User[];
  statuses: VacancyStatus[];
  statusId: string;
  assignedTo: string;
  selectedCount: number;
  isReadyToCreate: boolean;
  isCreating: boolean;
  onDraftUpdate: (updater: (current: AiVacancyDraft) => AiVacancyDraft) => void;
  onStatusChange: (value: string) => void;
  onAssignedToChange: (value: string) => void;
  onCreate: () => void;
}

export function AiVacancyManualConfirmSection({
  draft,
  companies,
  users,
  statuses,
  statusId,
  assignedTo,
  selectedCount,
  isReadyToCreate,
  isCreating,
  onDraftUpdate,
  onStatusChange,
  onAssignedToChange,
  onCreate,
}: AiVacancyManualConfirmSectionProps) {
  return (
    <AiVacancySection icon={ClipboardCheck} title="Confirmación manual">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Empresa</Label>
          <Select
            value={draft.companyId?.toString() ?? ""}
            onValueChange={(value) =>
              onDraftUpdate((current) => ({
                ...current,
                companyId: Number(value),
              }))
            }
          >
            <SelectTrigger className={fieldClassName}>
              <SelectValue placeholder="Selecciona una empresa" />
            </SelectTrigger>
            <SelectContent>
              {companies.map((company) => (
                <SelectItem key={company.id} value={company.id.toString()}>
                  {company.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Estado</Label>
            <Select value={statusId} onValueChange={onStatusChange}>
              <SelectTrigger className={fieldClassName}>
                <SelectValue placeholder="Selecciona un estado" />
              </SelectTrigger>
              <SelectContent>
                {statuses.map((status) => (
                  <SelectItem key={status.id} value={status.id.toString()}>
                    {status.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Asignado a</Label>
            <Select value={assignedTo} onValueChange={onAssignedToChange}>
              <SelectTrigger className={fieldClassName}>
                <SelectValue placeholder="Selecciona un responsable" />
              </SelectTrigger>
              <SelectContent>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id.toString()}>
                    {user.name ?? user.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="rounded-xl border border-brand-border bg-canvas/60 p-3 text-sm text-slate-brand">
          El borrador puede salir incompleto. Antes de guardar, confirma empresa, estado,
          responsable y al menos un candidato seleccionado.
        </div>

        <Button
          type="button"
          className="w-full rounded-md bg-electric font-semibold text-white hover:bg-electric-light"
          disabled={!isReadyToCreate || isCreating}
          onClick={onCreate}
        >
          {isCreating
            ? "Creando vacante..."
            : `Crear vacante con ${selectedCount} candidato${selectedCount === 1 ? "" : "s"}`}
        </Button>
      </div>
    </AiVacancySection>
  );
}
