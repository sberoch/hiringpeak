"use client";

import { useQuery } from "@tanstack/react-query";
import { ListChecks } from "lucide-react";

import { getAllTasks, TASK_API_KEY } from "@/lib/api/tasks";
import { Card } from "@workspace/ui/components/card";
import { PageHeading } from "@workspace/ui/components/page-heading";

import { NewTaskForm } from "./new-task-form";

function formatDueDate(dueDate: string | null | undefined) {
  if (!dueDate) return "Sin fecha";
  const [y, m, d] = dueDate.split("-");
  return `${d}/${m}/${y}`;
}

export function TasksPage() {
  const { data, isLoading } = useQuery({
    queryKey: [TASK_API_KEY, { order: "createdAt:desc", limit: 100 }],
    queryFn: () => getAllTasks({ order: "createdAt:desc", limit: 100 }),
    staleTime: 0,
  });

  const tasks = data?.items ?? [];

  return (
    <>
      <div className="mb-6">
        <PageHeading
          icon={ListChecks}
          title="Tareas"
          description="Captura y revisa el trabajo pendiente del equipo."
        />
      </div>

      <Card className="mb-6 rounded-2xl border border-brand-border bg-surface p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <h2 className="text-lg font-bold tracking-tight text-ink">
          Nueva tarea
        </h2>
        <p className="text-sm text-slate-brand mt-0.5 mb-4 leading-relaxed">
          Agrega un pendiente con un responsable y un vencimiento opcional.
        </p>
        <NewTaskForm />
      </Card>

      <Card className="rounded-2xl border border-brand-border bg-surface p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <h2 className="text-lg font-bold tracking-tight text-ink mb-4">
          Listado
        </h2>

        {isLoading ? (
          <p className="text-sm text-slate-brand">Cargando tareas...</p>
        ) : tasks.length === 0 ? (
          <p className="text-sm text-slate-brand">
            Todavía no hay tareas en esta organización.
          </p>
        ) : (
          <ul className="divide-y divide-brand-border">
            {tasks.map((task) => {
              const owner = task.assignedToUser?.name ?? "—";
              return (
                <li
                  key={task.id}
                  className="flex items-center justify-between py-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">
                      {task.title}
                    </p>
                    <p className="text-xs text-slate-brand mt-0.5">
                      Responsable: {owner}
                    </p>
                  </div>
                  <div className="ml-4 shrink-0 text-right text-xs text-slate-brand">
                    {formatDueDate(task.dueDate)}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </>
  );
}
