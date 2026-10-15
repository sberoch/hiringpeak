"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import { todayIsoDay } from "@/components/tasks/_shared";
import {
  changeOpportunityStage,
  OPPORTUNITY_API_KEY,
} from "@/lib/api/opportunity";
import type {
  ChangeOpportunityStagePayload,
  Opportunity,
  OpportunityStage,
} from "@workspace/shared/types/opportunity";
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
import { cn } from "@workspace/ui/lib/utils";

import { apiErrorMessage, useLostReasons } from "./opportunity-ui";

type PendingClose = {
  opportunity: Pick<Opportunity, "id" | "title">;
  stage: OpportunityStage;
};

/**
 * Moves an Opportunity between stages. Open stages move straight away; won
 * and lost always go through a dialog that asks for the Close Date (today by
 * default, backdatable) and, for lost, the required Lost Reason.
 */
export function useStageChange() {
  const queryClient = useQueryClient();
  const [pending, setPending] = useState<PendingClose | null>(null);

  const mutation = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
      payload: ChangeOpportunityStagePayload;
      stage: OpportunityStage;
    }) => changeOpportunityStage(id, payload),
    onSuccess: (updated, { stage }) => {
      queryClient.invalidateQueries({ queryKey: [OPPORTUNITY_API_KEY] });
      if (stage.isWon) toast.success(`«${updated.title}» ganada`);
      else if (stage.isLost) toast(`«${updated.title}» marcada como perdida`);
      else toast.success(`«${updated.title}» → ${stage.name}`);
      setPending(null);
    },
    onError: (err) =>
      toast.error(apiErrorMessage(err, "No se pudo cambiar la etapa.")),
  });

  function requestMove(
    opportunity: Pick<Opportunity, "id" | "title" | "stageId">,
    stage: OpportunityStage,
  ) {
    if (opportunity.stageId === stage.id) return;
    if (stage.isWon || stage.isLost) {
      setPending({ opportunity, stage });
      return;
    }
    mutation.mutate({
      id: opportunity.id,
      payload: { stageId: stage.id },
      stage,
    });
  }

  const dialog = (
    <CloseOpportunityDialog
      pending={pending}
      saving={mutation.isPending}
      onOpenChange={(open) => !open && setPending(null)}
      onConfirm={(closeDate, lostReasonId) => {
        if (!pending) return;
        mutation.mutate({
          id: pending.opportunity.id,
          payload: {
            stageId: pending.stage.id,
            closeDate,
            lostReasonId,
          },
          stage: pending.stage,
        });
      }}
    />
  );

  return { requestMove, dialog, isMoving: mutation.isPending };
}

function CloseOpportunityDialog({
  pending,
  saving,
  onOpenChange,
  onConfirm,
}: {
  pending: PendingClose | null;
  saving: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (closeDate: string, lostReasonId: number | null) => void;
}) {
  return (
    <Dialog open={!!pending} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {pending && (
          <CloseOpportunityForm
            key={`${pending.opportunity.id}-${pending.stage.id}`}
            pending={pending}
            saving={saving}
            onCancel={() => onOpenChange(false)}
            onConfirm={onConfirm}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function CloseOpportunityForm({
  pending,
  saving,
  onCancel,
  onConfirm,
}: {
  pending: PendingClose;
  saving: boolean;
  onCancel: () => void;
  onConfirm: (closeDate: string, lostReasonId: number | null) => void;
}) {
  const { data: lostReasons = [] } = useLostReasons();
  const [closeDate, setCloseDate] = useState(todayIsoDay());
  const [reasonId, setReasonId] = useState<number | null>(null);
  const isLost = pending.stage.isLost;
  const canConfirm = !!closeDate && (!isLost || reasonId != null) && !saving;

  return (
    <>
      <DialogHeader>
        <DialogTitle>
          {isLost ? "Marcar como perdida" : "Marcar como ganada"}
        </DialogTitle>
        <DialogDescription>
          «{pending.opportunity.title}».{" "}
          {isLost
            ? "Elegí por qué se perdió; es obligatorio."
            : "Confirmá cuándo se ganó."}
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-4">
        {isLost && (
          <div className="space-y-2">
            <Label>Motivo de pérdida</Label>
            <div className="flex flex-wrap gap-1.5">
              {lostReasons.map((reason) => (
                <button
                  key={reason.id}
                  type="button"
                  onClick={() => setReasonId(reason.id)}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-sm font-medium ring-1 transition-all",
                    reasonId === reason.id
                      ? "bg-electric text-white ring-electric"
                      : "bg-surface text-ink ring-brand-border hover:ring-electric/40",
                  )}
                >
                  {reason.name}
                </button>
              ))}
            </div>
          </div>
        )}
        <div className="space-y-2">
          <Label htmlFor="opportunity-close-date">Fecha de cierre</Label>
          <Input
            id="opportunity-close-date"
            type="date"
            value={closeDate}
            onChange={(e) => setCloseDate(e.target.value)}
            className="w-[180px]"
          />
          <p className="text-xs text-muted-brand">
            Por defecto hoy. Si se cerró antes, elegí la fecha real.
          </p>
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button
          disabled={!canConfirm}
          className={cn(
            "text-white",
            isLost
              ? "bg-electric hover:bg-electric-light"
              : "bg-emerald-600 hover:bg-emerald-700",
          )}
          onClick={() => onConfirm(closeDate, isLost ? reasonId : null)}
        >
          {isLost ? "Marcar perdida" : "Marcar ganada"}
        </Button>
      </DialogFooter>
    </>
  );
}
