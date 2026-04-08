"use client";

import { useState } from "react";

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
import { Textarea } from "@workspace/ui/components/textarea";

interface RejectionReasonDialogProps {
  candidateName: string;
  initialValue?: string | null;
  isOpen: boolean;
  isPending: boolean;
  statusName: string;
  onCancel: () => void;
  onConfirm: (rejectionReason: string) => void;
}

export function RejectionReasonDialog({
  candidateName,
  initialValue,
  isOpen,
  isPending,
  statusName,
  onCancel,
  onConfirm,
}: RejectionReasonDialogProps) {
  const [rejectionReason, setRejectionReason] = useState(initialValue ?? "");

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onCancel();
    }
  };

  const handleConfirm = () => {
    onConfirm(rejectionReason);
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
            estado{" "}
            <span className="font-semibold text-ink">{statusName}</span>. Podés
            guardar el motivo ahora o dejarlo vacío.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2 py-2">
          <Label
            htmlFor="rejection-reason"
            className="text-sm font-semibold text-ink"
          >
            Motivo
          </Label>
          <Textarea
            id="rejection-reason"
            value={rejectionReason}
            onChange={(event) => setRejectionReason(event.target.value)}
            placeholder="Agregar motivo de rechazo"
            rows={5}
            className="rounded-xl border-brand-border bg-canvas text-ink placeholder:text-muted-brand transition-all duration-200 focus:border-electric focus:shadow-[0_0_0_4px_rgba(0,102,255,0.08)]"
          />
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
            disabled={isPending}
            className="inline-flex items-center justify-center rounded-md bg-electric px-4 py-2 text-sm font-semibold text-white transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-electric-light hover:shadow-[0_8px_24px_-6px_rgba(0,102,255,0.4)] disabled:opacity-50 disabled:pointer-events-none"
          >
            {isPending ? "Guardando..." : "Guardar"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
