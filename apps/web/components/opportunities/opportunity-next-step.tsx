"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, Check, Plus } from "lucide-react";
import { useSession } from "next-auth/react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { usePermissions } from "@/contexts/permission-context";
import { OPPORTUNITY_API_KEY } from "@/lib/api/opportunity";
import { completeTask, createTask, TASK_API_KEY } from "@/lib/api/tasks";
import { PermissionCode } from "@workspace/shared/enums";
import type {
  Opportunity,
  OpportunityNextStep,
} from "@workspace/shared/types/opportunity";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { cn } from "@workspace/ui/lib/utils";

import {
  dueTone,
  formatDue,
  todayIsoDay,
} from "@/components/tasks/task-due-dates";
import { TasksInContextCard } from "../tasks/tasks-in-context-card";
import { apiErrorMessage } from "@/lib/api/api-error";
import { useCommercialAccess } from "@/components/opportunities/commercial-access";

/** Red "Sin próximo paso": an open Opportunity with no open Task attached. */
export function NoNextStepBadge({ className }: { className?: string }) {
  return (
    <span
      title="Oportunidad abierta sin ninguna tarea abierta: nadie se comprometió a hacer nada."
      className={cn(
        "inline-flex items-center gap-1 rounded-md bg-red-50 px-1.5 py-0.5 text-[11px] font-semibold text-red-700 ring-1 ring-red-100",
        className,
      )}
    >
      <AlertCircle className="h-3 w-3" />
      Sin próximo paso
    </span>
  );
}

function dueOf(step: OpportunityNextStep, today: string) {
  const task = { dueDate: step.dueDate, completed: false };
  return { label: formatDue(task, today), tone: dueTone(task, today) };
}

/**
 * "Próximo paso" cell of the Opportunities list: the next step's title with
 * its due label below (red when overdue), "Motivo: …" for a lost Opportunity,
 * or the red badge for No Next Step.
 */
export function NextStepCell({ opportunity }: { opportunity: Opportunity }) {
  const today = useMemo(() => todayIsoDay(), []);
  if (opportunity.stage.isLost) {
    return (
      <span className="block truncate text-slate-brand">
        Motivo:{" "}
        <span className="font-medium text-ink">
          {opportunity.lostReason?.name ?? "—"}
        </span>
      </span>
    );
  }
  if (opportunity.noNextStep)
    return <NoNextStepBadge className="px-2 text-xs" />;
  const step = opportunity.nextStep;
  if (!step) return <span className="text-muted-brand">—</span>;
  const due = dueOf(step, today);
  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <span className="truncate text-ink" title={step.title}>
        {step.title}
      </span>
      <span className={cn("text-xs font-semibold", due.tone)}>{due.label}</span>
    </div>
  );
}

function useMyUserId(): number | null {
  const session = useSession();
  return session.status === "authenticated" && session.data?.userId
    ? parseInt(session.data.userId, 10)
    : null;
}

/** Opportunity data and its Tasks change together: refresh both. */
function useInvalidateNextStep() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: [OPPORTUNITY_API_KEY] });
    queryClient.invalidateQueries({ queryKey: [TASK_API_KEY] });
  };
}

/**
 * The Opportunity page's next-step card, with the list of all its Tasks
 * below. Won and lost Opportunities show only the Tasks.
 */
export function OpportunityNextStepSection({
  opportunity,
}: {
  opportunity: Opportunity;
}) {
  const context = useMemo(
    () => ({
      type: "opportunity" as const,
      id: opportunity.id,
      label: opportunity.title,
    }),
    [opportunity.id, opportunity.title],
  );
  const closed = opportunity.stage.isWon || opportunity.stage.isLost;
  return (
    <div className="space-y-4">
      {!closed && <NextStepCard opportunity={opportunity} />}
      <TasksInContextCard context={context} variant="compact" />
    </div>
  );
}

function NextStepCard({ opportunity }: { opportunity: Opportunity }) {
  const [adding, setAdding] = useState(false);
  const { canRead } = useCommercialAccess();
  const { hasPermission } = usePermissions();
  // CRM_READ is enough: the next step is a Task, owned by whoever creates it.
  const canAddTask = canRead && hasPermission(PermissionCode.TASK_MANAGE);

  const step = opportunity.nextStep;
  if (!step) {
    return (
      <section className="rounded-2xl border-2 border-red-200 bg-red-50/60 p-4">
        <div className="flex items-start gap-2">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
          <div>
            <p className="text-sm font-bold text-red-700">Sin próximo paso</p>
            <p className="mt-0.5 text-xs text-red-900/80">
              Nadie se comprometió a hacer nada con esta oportunidad. ¿Qué
              sigue?
            </p>
          </div>
        </div>
        {canAddTask &&
          (adding ? (
            <NextStepForm
              opportunity={opportunity}
              className="mt-3"
              onDone={() => setAdding(false)}
            />
          ) : (
            <Button
              size="sm"
              className="mt-3 w-full bg-red-600 text-white hover:bg-red-700"
              onClick={() => setAdding(true)}
            >
              <Plus className="h-4 w-4" />
              Definir próximo paso
            </Button>
          ))}
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-electric/25 bg-electric/[0.04] p-4">
      <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-electric">
        Próximo paso
      </p>
      <NextStepTask step={step} />
    </section>
  );
}

function NextStepTask({ step }: { step: OpportunityNextStep }) {
  const today = useMemo(() => todayIsoDay(), []);
  const myId = useMyUserId();
  const { hasPermission } = usePermissions();
  const canComplete =
    step.assignedTo === myId || hasPermission(PermissionCode.TASK_MANAGE_ALL);
  const invalidate = useInvalidateNextStep();
  const complete = useMutation({
    mutationFn: () => completeTask(step.id),
    onSuccess: () => {
      invalidate();
      toast.success("Tarea completada");
    },
    onError: (err) =>
      toast.error(apiErrorMessage(err, "No se pudo completar la tarea.")),
  });
  const due = dueOf(step, today);

  return (
    <div className="flex items-start gap-2.5">
      <button
        type="button"
        disabled={!canComplete || complete.isPending}
        onClick={() => complete.mutate()}
        title={canComplete ? "Marcar hecha" : "Solo su responsable la completa"}
        className={cn(
          "mt-0.5 flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-md border border-brand-border bg-surface text-transparent transition-colors hover:border-electric hover:text-electric",
          !canComplete && "cursor-not-allowed opacity-60",
        )}
      >
        <Check className="h-3 w-3" />
      </button>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-ink">{step.title}</p>
        <div className="mt-1 flex items-center gap-2">
          <span
            className={cn("whitespace-nowrap text-xs font-semibold", due.tone)}
          >
            {due.label}
          </span>
          <span className="text-xs text-slate-brand">· {step.owner.name}</span>
        </div>
      </div>
    </div>
  );
}

/** Inline task form: a Task attached to the Opportunity, owned by its creator. */
function NextStepForm({
  opportunity,
  className,
  onDone,
}: {
  opportunity: Opportunity;
  className?: string;
  onDone: () => void;
}) {
  const myId = useMyUserId();
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const invalidate = useInvalidateNextStep();
  const create = useMutation({
    mutationFn: () =>
      createTask({
        title: title.trim(),
        dueDate: dueDate || null,
        assignedTo: myId!,
        opportunityIds: [opportunity.id],
      }),
    onSuccess: () => {
      invalidate();
      toast.success("Próximo paso definido");
      onDone();
    },
    onError: (err) =>
      toast.error(apiErrorMessage(err, "No se pudo crear la tarea.")),
  });

  const submit = () => {
    if (!title.trim()) {
      toast.error("Poné un título a la tarea");
      return;
    }
    if (myId == null || create.isPending) return;
    create.mutate();
  };

  return (
    <div className={cn("space-y-2", className)}>
      <Input
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && submit()}
        placeholder="Ej. Llamar a Valeria para cerrar el fee"
        className="h-9 bg-surface text-sm"
      />
      <div className="flex flex-wrap items-center gap-2">
        <Input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className="h-8 w-[150px] bg-surface text-xs"
          title="Vence (opcional)"
        />
        <span className="text-xs text-slate-brand">Para vos</span>
        <div className="ml-auto flex gap-2">
          <Button size="sm" variant="ghost" onClick={onDone}>
            Cancelar
          </Button>
          <Button
            size="sm"
            variant="brand"
            disabled={create.isPending}
            onClick={submit}
          >
            Crear tarea
          </Button>
        </div>
      </div>
    </div>
  );
}
