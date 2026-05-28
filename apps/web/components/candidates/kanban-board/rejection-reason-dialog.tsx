"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { Button } from "@workspace/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import { Label } from "@workspace/ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { Textarea } from "@workspace/ui/components/textarea";
import {
  REJECTION_REASON_API_KEY,
  getRejectionReasons,
} from "@/lib/api/rejection-reason";

interface RejectionReasonDialogProps {
  candidateName: string;
  initialReasonId?: number | null;
  initialNote?: string | null;
  isOpen: boolean;
  isPending: boolean;
  statusName: string;
  onCancel: () => void;
  onConfirm: (rejectionReasonId: number, rejectionNote: string | null) => void;
}

export function RejectionReasonDialog({
  candidateName,
  initialReasonId,
  initialNote,
  isOpen,
  isPending,
  statusName,
  onCancel,
  onConfirm,
}: RejectionReasonDialogProps) {
  const [reasonId, setReasonId] = useState(
    initialReasonId != null ? initialReasonId.toString() : "",
  );
  const [note, setNote] = useState(initialNote ?? "");

  const { data, isLoading } = useQuery({
    queryKey: [
      REJECTION_REASON_API_KEY,
      { order: "sort:asc", limit: 1e9, page: 1 },
    ],
    queryFn: () =>
      getRejectionReasons({ order: "sort:asc", limit: 1e9, page: 1 }),
  });

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onCancel();
    }
  };

  const handleConfirm = () => {
    if (!reasonId) return;
    const normalized = note.trim();
    onConfirm(Number(reasonId), normalized ? normalized : null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[420px] rounded-2xl border-brand-border bg-surface">
        <DialogHeader>
          <DialogTitle className="text-ink">
            Registrar motivo de rechazo
          </DialogTitle>
          <DialogDescription className="text-slate-brand">
            Vas a mover a{" "}
            <span className="font-semibold text-ink">{candidateName}</span> al
            estado <span className="font-semibold text-ink">{statusName}</span>.
            Seleccioná el motivo del rechazo.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-2">
            <Label
              htmlFor="rejection-reason"
              className="text-sm font-semibold text-ink"
            >
              Motivo <span className="text-red-500">*</span>
            </Label>
            <Select value={reasonId} onValueChange={setReasonId}>
              <SelectTrigger
                id="rejection-reason"
                className="rounded-xl border-brand-border bg-canvas text-ink"
              >
                <SelectValue
                  placeholder={isLoading ? "Cargando..." : "Seleccionar motivo"}
                />
              </SelectTrigger>
              <SelectContent>
                {data?.items.map((reason) => (
                  <SelectItem key={reason.id} value={reason.id.toString()}>
                    {reason.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label
              htmlFor="rejection-note"
              className="text-sm font-semibold text-ink"
            >
              Comentario (opcional)
            </Label>
            <Textarea
              id="rejection-note"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Agregar un detalle del rechazo"
              rows={4}
              className="rounded-xl border-brand-border bg-canvas text-ink placeholder:text-muted-brand transition-all duration-200 focus:border-electric focus:shadow-[0_0_0_4px_rgba(0,102,255,0.08)]"
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isPending}
            className="rounded-md border-brand-border text-ink hover:bg-brand-border-light"
          >
            Cancelar
          </Button>
          <button
            onClick={handleConfirm}
            disabled={isPending || !reasonId}
            className="inline-flex items-center justify-center rounded-md bg-electric px-4 py-2 text-sm font-semibold text-white transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-electric-light hover:shadow-[0_8px_24px_-6px_rgba(0,102,255,0.4)] disabled:opacity-50 disabled:pointer-events-none"
          >
            {isPending ? "Guardando..." : "Guardar"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
