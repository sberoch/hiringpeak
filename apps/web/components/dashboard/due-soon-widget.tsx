"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Building2,
  CalendarClock,
  GitBranch,
  User,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";

import { getMyDueSoonTasks, TASK_API_KEY } from "@/lib/api/tasks";
import { cn } from "@workspace/ui/lib/utils";
import type { TaskWithRelations } from "@workspace/shared/types/task";

function todayIsoDay() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function formatDueDate(dueDate: string | null | undefined) {
  if (!dueDate) return "Sin fecha";
  const [y, m, d] = dueDate.split("-");
  return `${d}/${m}/${y}`;
}

function attachmentChip(task: TaskWithRelations):
  | { icon: LucideIcon; label: string }
  | null {
  if (task.candidateId != null) {
    return {
      icon: User,
      label: task.candidate?.name ?? `Postulante #${task.candidateId}`,
    };
  }
  if (task.vacancyId != null) {
    return {
      icon: GitBranch,
      label: task.vacancy?.title ?? `Vacante #${task.vacancyId}`,
    };
  }
  if (task.companyId != null) {
    return {
      icon: Building2,
      label: task.company?.name ?? `Empresa #${task.companyId}`,
    };
  }
  return null;
}

export function DueSoonWidget() {
  const today = todayIsoDay();
  const { data, isLoading } = useQuery({
    queryKey: [TASK_API_KEY, "due-soon"],
    queryFn: getMyDueSoonTasks,
    staleTime: 0,
  });
  const tasks = data ?? [];

  return (
    <div className="rounded-2xl border border-brand-border bg-surface overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-brand-border">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-electric/10 text-electric">
            <CalendarClock className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold tracking-tight text-ink">
              Mis tareas próximas y vencidas
            </h3>
            <p className="text-xs text-slate-brand">
              Tus pendientes con fecha en los próximos 7 días.
            </p>
          </div>
        </div>
        <Link
          href="/tasks"
          className="text-xs font-semibold text-electric hover:underline"
        >
          Ver todas
        </Link>
      </div>

      <div className="px-5 py-4">
        {isLoading ? (
          <p className="text-sm text-slate-brand">Cargando…</p>
        ) : tasks.length === 0 ? (
          <p className="text-sm text-slate-brand">
            No tenés tareas próximas. ¡Buen trabajo!
          </p>
        ) : (
          <ul className="divide-y divide-brand-border">
            {tasks.map((task) => {
              const overdue = !!task.dueDate && task.dueDate < today;
              const chip = attachmentChip(task);
              const Icon = chip?.icon;
              return (
                <li key={task.id} className="flex items-center gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">
                      {task.title}
                    </p>
                    {chip && Icon ? (
                      <div className="mt-0.5">
                        <span className="inline-flex max-w-[260px] items-center gap-1 rounded-md bg-electric/[0.06] px-1.5 py-0.5 text-[11px] font-medium text-electric">
                          <Icon className="h-3 w-3 shrink-0" />
                          <span className="truncate">{chip.label}</span>
                        </span>
                      </div>
                    ) : null}
                  </div>
                  <div
                    className={cn(
                      "ml-2 shrink-0 text-right text-xs font-semibold",
                      overdue ? "text-red-600" : "text-slate-brand",
                    )}
                  >
                    {overdue
                      ? `Vencida · ${formatDueDate(task.dueDate)}`
                      : formatDueDate(task.dueDate)}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
