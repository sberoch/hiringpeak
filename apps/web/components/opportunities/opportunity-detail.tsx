"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  Check,
  CircleDollarSign,
  Handshake,
  Pencil,
  ThumbsDown,
  Trash2,
  Trophy,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";

import {
  deleteOpportunity,
  getOpportunity,
  OPPORTUNITY_API_KEY,
  updateOpportunity,
  updateOpportunityCloseDate,
} from "@/lib/api/opportunity";
import { formatMoney } from "@/lib/utils";
import type {
  Opportunity,
  OpportunityStage,
  UpdateOpportunityPayload,
} from "@workspace/shared/types/opportunity";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@workspace/ui/components/alert-dialog";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { LoadingSpinner } from "@workspace/ui/components/loading-spinner";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover";
import { cn } from "@workspace/ui/lib/utils";

import {
  apiErrorMessage,
  formatDay,
  parseMoneyInput,
  useCommercialAccess,
  useCommercialUsers,
  useOpportunityStages,
} from "./opportunity-ui";
import { OpportunityVacanciesCard } from "./opportunity-vacancies";
import { useStageChange } from "./stage-change";

export function OpportunityDetail({ id }: { id: string }) {
  const { canManage } = useCommercialAccess();
  const {
    data: opportunity,
    isLoading,
    isError,
  } = useQuery({
    queryKey: [OPPORTUNITY_API_KEY, id],
    queryFn: () => getOpportunity(id),
  });
  const { data: stages = [] } = useOpportunityStages();
  const { requestMove, dialog } = useStageChange();
  const [deleteOpen, setDeleteOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex justify-center py-24">
        <LoadingSpinner />
      </div>
    );
  }
  if (isError || !opportunity) {
    return (
      <div className="mx-auto mt-24 max-w-md rounded-2xl border border-brand-border bg-surface p-8 text-center">
        <p className="text-lg font-bold text-ink">Oportunidad no encontrada</p>
        <Link
          href="/opportunities"
          className="mt-3 inline-block text-sm font-semibold text-electric"
        >
          Volver a oportunidades
        </Link>
      </div>
    );
  }

  return (
    <div className="min-w-0 space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <Button
            asChild
            variant="brand-ghost"
            className="h-10 bg-white px-4 text-sm font-medium"
          >
            <Link href="/opportunities">
              <ArrowLeft className="h-4 w-4" />
              Volver
            </Link>
          </Button>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-electric text-white shadow-[0_2px_8px_-2px_rgba(0,102,255,0.4)]">
            <Handshake className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <TitleEditor opportunity={opportunity} canManage={canManage} />
            <div className="mt-0.5 flex flex-wrap items-center gap-2 text-sm">
              <Link
                href={`/companies/${opportunity.company.id}`}
                className="inline-flex items-center gap-1.5 font-medium text-slate-brand hover:text-electric"
              >
                <Building2 className="h-3.5 w-3.5" />
                {opportunity.company.name}
              </Link>
              <span className="text-muted-brand">
                · Oportunidad #{opportunity.id}
              </span>
            </div>
          </div>
        </div>
        {canManage && (
          <Button
            size="sm"
            variant="brand-ghost"
            className="bg-white text-red-600 hover:text-red-700"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 className="h-4 w-4" />
            Eliminar
          </Button>
        )}
      </div>

      <StagePath
        opportunity={opportunity}
        stages={stages}
        canManage={canManage}
        onMove={(stage) => requestMove(opportunity, stage)}
      />

      {opportunity.stage.isLost && (
        <div className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4">
          <ThumbsDown className="mt-0.5 h-5 w-5 text-slate-500" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-ink">
              Perdida por{" "}
              <span className="rounded-md bg-white px-1.5 py-0.5 ring-1 ring-slate-200">
                {opportunity.lostReason?.name ?? "—"}
              </span>
            </p>
            {canManage && (
              <p className="mt-2 text-xs text-muted-brand">
                Si la reabrís (clic en cualquier etapa), el motivo y la fecha de
                cierre se borran.
              </p>
            )}
          </div>
        </div>
      )}

      <FactsCard opportunity={opportunity} canManage={canManage} />

      <OpportunityVacanciesCard
        opportunity={opportunity}
        canManage={canManage}
      />

      {dialog}
      <DeleteOpportunityDialog
        opportunity={opportunity}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
      />
    </div>
  );
}

function useOpportunityUpdate(opportunity: Opportunity) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateOpportunityPayload) =>
      updateOpportunity(opportunity.id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [OPPORTUNITY_API_KEY] });
      toast.success("Oportunidad actualizada");
    },
    onError: (err) =>
      toast.error(
        apiErrorMessage(err, "No se pudo actualizar la oportunidad."),
      ),
  });
}

function TitleEditor({
  opportunity,
  canManage,
}: {
  opportunity: Opportunity;
  canManage: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(opportunity.title);
  const mutation = useOpportunityUpdate(opportunity);
  const heading = (
    <h1 className="text-2xl font-bold tracking-tight text-ink">
      {opportunity.title}
    </h1>
  );
  if (!canManage) return heading;

  const save = () => {
    if (!title.trim()) return;
    mutation.mutate(
      { title: title.trim() },
      { onSuccess: () => setOpen(false) },
    );
  };

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        if (next) setTitle(opportunity.title);
        setOpen(next);
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          className="group flex items-center gap-2 text-left"
        >
          {heading}
          <Pencil className="h-4 w-4 text-muted-brand opacity-0 group-hover:opacity-100" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-96 space-y-3">
        <p className="text-sm font-semibold text-ink">Título</p>
        <Input
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && save()}
        />
        <div className="flex justify-end">
          <Button
            size="sm"
            variant="brand"
            disabled={!title.trim() || mutation.isPending}
            onClick={save}
          >
            Guardar
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function StagePath({
  opportunity,
  stages,
  canManage,
  onMove,
}: {
  opportunity: Opportunity;
  stages: OpportunityStage[];
  canManage: boolean;
  onMove: (stage: OpportunityStage) => void;
}) {
  const open = stages.filter((s) => !s.isWon && !s.isLost);
  const won = stages.find((s) => s.isWon);
  const lost = stages.find((s) => s.isLost);
  const current = opportunity.stage;
  const currentIndex = open.findIndex((s) => s.id === current.id);

  return (
    <div className="rounded-2xl border border-brand-border bg-surface p-3">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex min-w-0 flex-1">
          {open.map((stage, i) => {
            const state = current.isWon
              ? "done"
              : current.isLost
                ? "muted"
                : i < currentIndex
                  ? "done"
                  : i === currentIndex
                    ? "current"
                    : "todo";
            const clickable = canManage && stage.id !== current.id;
            return (
              <button
                key={stage.id}
                type="button"
                disabled={!clickable}
                onClick={() => onMove(stage)}
                title={clickable ? `Mover a ${stage.name}` : undefined}
                style={{
                  clipPath:
                    i === 0
                      ? "polygon(0 0, calc(100% - 14px) 0, 100% 50%, calc(100% - 14px) 100%, 0 100%)"
                      : "polygon(0 0, calc(100% - 14px) 0, 100% 50%, calc(100% - 14px) 100%, 0 100%, 14px 50%)",
                }}
                className={cn(
                  "-ml-1 flex h-10 min-w-0 flex-1 items-center justify-center gap-1.5 truncate px-6 text-xs font-semibold transition-colors first:ml-0 first:rounded-l-xl",
                  state === "current" && "bg-electric text-white",
                  state === "done" && "bg-electric/15 text-electric",
                  state === "todo" && "bg-brand-border-light text-slate-brand",
                  state === "muted" && "bg-slate-100 text-slate-400",
                  clickable &&
                    "cursor-pointer hover:bg-electric/25 hover:text-electric",
                  !canManage && "cursor-default",
                )}
              >
                {state === "done" && <Check className="h-3.5 w-3.5 shrink-0" />}
                <span className="truncate">{stage.name}</span>
              </button>
            );
          })}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {won &&
            (current.isWon ? (
              <span className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-emerald-500 px-4 text-sm font-semibold text-white">
                <Trophy className="h-4 w-4" />
                {won.name}
              </span>
            ) : canManage ? (
              <Button
                className="h-10 rounded-xl bg-emerald-600 font-semibold text-white hover:bg-emerald-700"
                onClick={() => onMove(won)}
              >
                <Trophy className="h-4 w-4" />
                Marcar ganada
              </Button>
            ) : null)}
          {lost &&
            (current.isLost ? (
              <span className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-slate-500 px-4 text-sm font-semibold text-white">
                <ThumbsDown className="h-4 w-4" />
                {lost.name}
              </span>
            ) : canManage ? (
              <Button
                variant="brand-ghost"
                className="h-10 bg-white font-semibold text-slate-brand"
                onClick={() => onMove(lost)}
              >
                <ThumbsDown className="h-4 w-4" />
                Marcar perdida
              </Button>
            ) : null)}
        </div>
      </div>
      {canManage && (
        <p className="mt-2 px-1 text-xs text-muted-brand">
          {current.isWon || current.isLost
            ? "Clic en una etapa para reabrirla."
            : "Hacé clic en una etapa para mover la oportunidad."}
        </p>
      )}
    </div>
  );
}

function FactRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2.5 text-sm">
      <span className="text-slate-brand">{label}</span>
      <span className="min-w-0 text-right">{children}</span>
    </div>
  );
}

function EditableValue({
  canManage,
  children,
}: {
  canManage: boolean;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "group inline-flex items-center gap-1.5 rounded-lg px-1.5 py-0.5 font-medium text-ink",
        canManage && "cursor-pointer hover:bg-brand-border-light",
      )}
    >
      {children}
      {canManage && (
        <Pencil className="h-3 w-3 text-muted-brand opacity-0 group-hover:opacity-100" />
      )}
    </span>
  );
}

function FactsCard({
  opportunity,
  canManage,
}: {
  opportunity: Opportunity;
  canManage: boolean;
}) {
  const closed = opportunity.stage.isWon || opportunity.stage.isLost;
  return (
    <section className="max-w-xl rounded-2xl border border-brand-border bg-surface px-4 py-2">
      <div className="divide-y divide-brand-border">
        <FactRow label="Responsable">
          <OwnerPopover opportunity={opportunity} canManage={canManage}>
            <button type="button" disabled={!canManage}>
              <EditableValue canManage={canManage}>
                {opportunity.owner.name}
              </EditableValue>
            </button>
          </OwnerPopover>
        </FactRow>
        <FactRow label="Fee estimado">
          <FeePopover opportunity={opportunity} canManage={canManage}>
            <button type="button" disabled={!canManage}>
              <EditableValue canManage={canManage}>
                <CircleDollarSign className="h-3.5 w-3.5 text-muted-brand" />
                <span
                  className={cn(
                    "tabular-nums",
                    opportunity.estimatedFee == null &&
                      "font-normal italic text-muted-brand",
                  )}
                >
                  {opportunity.estimatedFee != null
                    ? formatMoney(opportunity.estimatedFee)
                    : "Sin estimar"}
                </span>
              </EditableValue>
            </button>
          </FeePopover>
        </FactRow>
        <FactRow label="Empresa">
          <Link
            href={`/companies/${opportunity.company.id}`}
            className="inline-flex items-center gap-1.5 font-medium text-ink hover:text-electric"
          >
            {opportunity.company.name}
          </Link>
        </FactRow>
        {closed && opportunity.closeDate && (
          <FactRow label="Fecha de cierre">
            <CloseDatePopover opportunity={opportunity} canManage={canManage}>
              <button type="button" disabled={!canManage}>
                <EditableValue canManage={canManage}>
                  <CalendarDays className="h-3.5 w-3.5 text-muted-brand" />
                  {formatDay(opportunity.closeDate)}
                </EditableValue>
              </button>
            </CloseDatePopover>
          </FactRow>
        )}
        <FactRow label="Creada">
          <span className="text-slate-brand">
            {formatDay(opportunity.createdAt.slice(0, 10))}
          </span>
        </FactRow>
      </div>
    </section>
  );
}

function OwnerPopover({
  opportunity,
  canManage,
  children,
}: {
  opportunity: Opportunity;
  canManage: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const { data: commercialUsers = [] } = useCommercialUsers();
  const mutation = useOpportunityUpdate(opportunity);
  if (!canManage) return <>{children}</>;
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent align="end" className="w-64 p-1.5">
        <p className="px-2 pb-1.5 pt-1 text-[11px] font-semibold uppercase tracking-wide text-muted-brand">
          Responsable (solo con acceso comercial)
        </p>
        {commercialUsers.map((user) => (
          <button
            key={user.id}
            type="button"
            onClick={() => {
              setOpen(false);
              if (user.id !== opportunity.ownerId) {
                mutation.mutate({ ownerId: user.id });
              }
            }}
            className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm hover:bg-brand-border-light"
          >
            <span className="flex-1 truncate text-ink">{user.name}</span>
            {user.id === opportunity.ownerId && (
              <Check className="h-4 w-4 text-electric" />
            )}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}

function FeePopover({
  opportunity,
  canManage,
  children,
}: {
  opportunity: Opportunity;
  canManage: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const mutation = useOpportunityUpdate(opportunity);
  if (!canManage) return <>{children}</>;

  const save = () => {
    const fee = parseMoneyInput(amount);
    if (fee != null && (!Number.isFinite(fee) || fee < 0)) {
      toast.error("Ingresá un monto válido");
      return;
    }
    mutation.mutate({ estimatedFee: fee }, { onSuccess: () => setOpen(false) });
  };

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        if (next) {
          setAmount(
            opportunity.estimatedFee != null
              ? opportunity.estimatedFee.toLocaleString("es-AR")
              : "",
          );
        }
        setOpen(next);
      }}
    >
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent align="end" className="w-72 space-y-3">
        <div>
          <p className="text-sm font-semibold text-ink">Fee estimado</p>
          <p className="text-xs text-slate-brand">
            Lo que se espera facturar si se gana. Un monto a mano.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-brand">$</span>
          <Input
            autoFocus
            inputMode="numeric"
            placeholder="Sin estimar"
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^\d.,]/g, ""))}
            onKeyDown={(e) => e.key === "Enter" && save()}
            className="h-9 tabular-nums"
          />
        </div>
        <div className="flex items-center justify-between">
          <button
            type="button"
            className="text-xs font-medium text-slate-brand hover:text-red-600"
            onClick={() => setAmount("")}
          >
            Dejar sin estimar
          </button>
          <Button
            size="sm"
            variant="brand"
            disabled={mutation.isPending}
            onClick={save}
          >
            Guardar
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function CloseDatePopover({
  opportunity,
  canManage,
  children,
}: {
  opportunity: Opportunity;
  canManage: boolean;
  children: ReactNode;
}) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [closeDate, setCloseDate] = useState(opportunity.closeDate ?? "");
  const mutation = useMutation({
    mutationFn: (date: string) =>
      updateOpportunityCloseDate(opportunity.id, date),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [OPPORTUNITY_API_KEY] });
      toast.success("Fecha de cierre actualizada");
      setOpen(false);
    },
    onError: (err) =>
      toast.error(
        apiErrorMessage(err, "No se pudo actualizar la fecha de cierre."),
      ),
  });
  if (!canManage) return <>{children}</>;

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        if (next) setCloseDate(opportunity.closeDate ?? "");
        setOpen(next);
      }}
    >
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent align="end" className="w-72 space-y-3">
        <div>
          <p className="text-sm font-semibold text-ink">Fecha de cierre</p>
          <p className="text-xs text-slate-brand">
            Cuándo se {opportunity.stage.isWon ? "ganó" : "perdió"} de verdad.
          </p>
        </div>
        <Input
          type="date"
          value={closeDate}
          onChange={(e) => setCloseDate(e.target.value)}
        />
        <div className="flex justify-end">
          <Button
            size="sm"
            variant="brand"
            disabled={!closeDate || mutation.isPending}
            onClick={() => mutation.mutate(closeDate)}
          >
            Guardar
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function DeleteOpportunityDialog({
  opportunity,
  open,
  onOpenChange,
}: {
  opportunity: Opportunity;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: () => deleteOpportunity(opportunity.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [OPPORTUNITY_API_KEY] });
      toast.success(`«${opportunity.title}» eliminada`);
      router.push("/opportunities");
    },
    onError: (err) =>
      toast.error(apiErrorMessage(err, "No se pudo eliminar la oportunidad.")),
  });

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Eliminar «{opportunity.title}»?</AlertDialogTitle>
          <AlertDialogDescription>
            Se borra la oportunidad. La empresa {opportunity.company.name} no se
            modifica.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            className="bg-red-600 text-white hover:bg-red-700"
            disabled={mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            <Trash2 className="h-4 w-4" />
            Eliminar oportunidad
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
