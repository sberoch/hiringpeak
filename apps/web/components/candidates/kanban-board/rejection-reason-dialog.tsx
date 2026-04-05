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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar motivo de rechazo</DialogTitle>
          <DialogDescription>
            Vas a mover a {candidateName} al estado {statusName}. Podés guardar
            el motivo ahora o dejarlo vacío.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <Label htmlFor="rejection-reason">Motivo</Label>
          <Textarea
            id="rejection-reason"
            value={rejectionReason}
            onChange={(event) => setRejectionReason(event.target.value)}
            placeholder="Agregar motivo de rechazo"
            rows={5}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel} disabled={isPending}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={isPending}>
            {isPending ? "Guardando..." : "Guardar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
