"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import type {
  CreateInteractionPayload,
  Interaction,
} from "@workspace/shared/types/interaction";

import { apiErrorMessage } from "@/lib/api/api-error";
import { todayIsoDay } from "@/components/tasks/task-due-dates";
import { COMPANIES_API_KEY } from "@/lib/api/company";
import { CONTACT_API_KEY } from "@/lib/api/contact";
import {
  createInteraction,
  deleteInteraction,
  INTERACTION_API_KEY,
} from "@/lib/api/interaction";
import { OPPORTUNITY_API_KEY } from "@/lib/api/opportunity";
import { formatInteractionDay } from "@/components/interactions/interaction-format";

function useInvalidateInteractions() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: [INTERACTION_API_KEY] });
    void queryClient.invalidateQueries({ queryKey: [CONTACT_API_KEY] });
    void queryClient.invalidateQueries({ queryKey: [OPPORTUNITY_API_KEY] });
    void queryClient.invalidateQueries({ queryKey: [COMPANIES_API_KEY] });
  };
}

export function useCreateInteraction(onDone?: (created: Interaction) => void) {
  const invalidate = useInvalidateInteractions();
  return useMutation({
    mutationFn: (payload: CreateInteractionPayload) =>
      createInteraction(payload),
    onSuccess: (created) => {
      invalidate();
      toast.success("Interacción registrada", {
        description: [
          created.date < todayIsoDay()
            ? `Fechada el ${formatInteractionDay(created.date)}`
            : null,
          created.company?.name ?? "Sin empresa",
        ]
          .filter(Boolean)
          .join(" · "),
      });
      onDone?.(created);
    },
    onError: (err) =>
      toast.error(apiErrorMessage(err, "No se pudo registrar la interacción.")),
  });
}

export function useDeleteInteraction() {
  const invalidate = useInvalidateInteractions();
  return useMutation({
    mutationFn: (id: number) => deleteInteraction(id),
    onSuccess: () => {
      invalidate();
      toast.success("Interacción eliminada");
    },
    onError: (err) =>
      toast.error(apiErrorMessage(err, "No se pudo eliminar la interacción.")),
  });
}

// ── Reading ──
