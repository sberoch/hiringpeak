"use client";

import dayjs from "dayjs";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  closeVacancy,
  reopenVacancy,
  VACANCY_API_KEY,
} from "@/lib/api/vacancy";
import {
  getAllVacancyStatuses,
  VACANCY_STATUS_API_KEY,
} from "@/lib/api/vacancy-status";
import type { Vacancy } from "@workspace/shared/types/vacancy";
import { Button } from "@workspace/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";

interface CloseVacancyDialogProps {
  isOpen: boolean;
  onClose: () => void;
  vacancy: Vacancy;
}

export function CloseVacancyDialog({
  isOpen,
  onClose,
  vacancy,
}: CloseVacancyDialogProps) {
  const queryClient = useQueryClient();
  const isClosed = !!vacancy.closedAt;

  const { data: statusData } = useQuery({
    queryKey: [VACANCY_STATUS_API_KEY, { limit: 1000, page: 1 }],
    queryFn: () => getAllVacancyStatuses({ limit: 1000, page: 1 }),
    enabled: isOpen,
  });
  const finalStatuses = (statusData?.items ?? []).filter((s) => s.isFinal);

  const [statusId, setStatusId] = useState<number | undefined>(undefined);
  const [closedAt, setClosedAt] = useState("");

  useEffect(() => {
    if (!isOpen) return;
    setClosedAt(
      isClosed
        ? dayjs(vacancy.closedAt).format("YYYY-MM-DD")
        : dayjs().format("YYYY-MM-DD"),
    );
    // Pre-select the current status when it is already final; otherwise leave the
    // pick to the user (defaulting to the first final status once they load).
    setStatusId(vacancy.status.isFinal ? vacancy.status.id : undefined);
  }, [isOpen, isClosed, vacancy.closedAt, vacancy.status.id, vacancy.status.isFinal]);

  useEffect(() => {
    if (statusId == null && finalStatuses.length > 0) {
      setStatusId(finalStatuses[0]!.id);
    }
  }, [finalStatuses, statusId]);

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: [VACANCY_API_KEY] });

  const closeMutation = useMutation({
    mutationFn: () =>
      closeVacancy(vacancy.id.toString(), {
        statusId: statusId as number,
        closedAt,
      }),
    onSuccess: () => {
      invalidate();
      toast.success(isClosed ? "Cierre actualizado" : "Vacante cerrada");
      onClose();
    },
    onError: () => toast.error("No se pudo cerrar la vacante"),
  });

  const reopenMutation = useMutation({
    mutationFn: () => reopenVacancy(vacancy.id.toString()),
    onSuccess: () => {
      invalidate();
      toast.success("Vacante reabierta");
      onClose();
    },
    onError: () => toast.error("No se pudo reabrir la vacante"),
  });

  const isPending = closeMutation.isPending || reopenMutation.isPending;
  const canSubmit = statusId != null && closedAt !== "" && !isPending;
  const noFinalStatuses = statusData != null && finalStatuses.length === 0;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="rounded-2xl border-brand-border bg-surface">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-ink">
            {isClosed ? "Editar cierre de vacante" : "Cerrar vacante"}
          </DialogTitle>
          <DialogDescription className="text-slate-brand">
            Elegí el estado final y la fecha en que la vacante se cerró
            realmente. Podés indicar una fecha pasada si la cargás con demora.
          </DialogDescription>
        </DialogHeader>

        {noFinalStatuses ? (
          <p className="py-4 text-sm text-slate-brand">
            No hay estados finales configurados. Creá un estado marcado como
            final para poder cerrar vacantes.
          </p>
        ) : (
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="close-status">Estado final</Label>
              <Select
                value={statusId != null ? String(statusId) : ""}
                onValueChange={(v) => setStatusId(Number(v))}
              >
                <SelectTrigger id="close-status">
                  <SelectValue placeholder="Seleccioná un estado" />
                </SelectTrigger>
                <SelectContent>
                  {finalStatuses.map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="close-date">Fecha de cierre</Label>
              <Input
                id="close-date"
                type="date"
                value={closedAt}
                onChange={(e) => setClosedAt(e.target.value)}
              />
            </div>
          </div>
        )}

        <DialogFooter className="flex items-center justify-between gap-2 sm:justify-between">
          {isClosed ? (
            <Button
              type="button"
              variant="ghost"
              onClick={() => reopenMutation.mutate()}
              disabled={isPending}
              className="text-ink hover:bg-brand-muted rounded-xl"
            >
              {reopenMutation.isPending ? "Reabriendo..." : "Reabrir vacante"}
            </Button>
          ) : (
            <span />
          )}
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isPending}
              className="rounded-xl border-brand-border text-ink"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={() => closeMutation.mutate()}
              disabled={!canSubmit || noFinalStatuses}
              className="bg-electric hover:bg-electric-light text-white rounded-xl px-5 font-semibold"
            >
              {closeMutation.isPending
                ? "Guardando..."
                : isClosed
                  ? "Guardar"
                  : "Cerrar vacante"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
