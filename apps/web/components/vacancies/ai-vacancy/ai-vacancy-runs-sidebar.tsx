"use client";

import dayjs from "dayjs";
import { FileText, History } from "lucide-react";

import { cn } from "@workspace/ui/lib/utils";
import type { AiVacancyRunSummary } from "@workspace/shared/types/vacancy-ai";

function sourceTypeLabel(sourceType: AiVacancyRunSummary["sourceType"]) {
  switch (sourceType) {
    case "documents":
      return "Documentos";
    case "mixed":
      return "Mixto";
    default:
      return "Texto";
  }
}

interface AiVacancyRunsSidebarProps {
  runs: AiVacancyRunSummary[];
  activeToken: string | null;
  isLoading: boolean;
  onSelectRun: (run: AiVacancyRunSummary) => void;
}

export function AiVacancyRunsSidebar({
  runs,
  activeToken,
  isLoading,
  onSelectRun,
}: AiVacancyRunsSidebarProps) {
  return (
    <aside className="flex h-full min-h-0 w-full flex-col border-r border-brand-border bg-canvas lg:w-64 lg:shrink-0">
      <div className="border-b border-brand-border px-4 py-4">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-electric" />
          <h3 className="text-sm font-semibold text-ink">Historial</h3>
        </div>
        <p className="mt-1 text-xs text-muted-brand">
          Generaciones recientes de esta cuenta.
        </p>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        {isLoading ? (
          <p className="px-2 text-sm text-muted-brand">Cargando historial...</p>
        ) : runs.length === 0 ? (
          <p className="px-2 text-sm text-muted-brand">
            Las generaciones previas aparecerán aquí.
          </p>
        ) : (
          <ul className="space-y-2">
            {runs.map((run) => {
              const title =
                run.draft?.title?.trim() ||
                run.userPrompt?.trim() ||
                run.prompt.trim() ||
                "Sin título";
              const isActive = run.publicToken === activeToken;

              return (
                <li key={run.publicToken}>
                  <button
                    type="button"
                    onClick={() => onSelectRun(run)}
                    className={cn(
                      "w-full rounded-xl border px-3 py-2.5 text-left transition-colors",
                      isActive
                        ? "border-electric bg-electric/5"
                        : "border-brand-border bg-surface hover:border-electric/40",
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="line-clamp-2 text-sm font-medium text-ink">
                        {title}
                      </p>
                      <span className="shrink-0 rounded-full bg-brand-border-light px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-brand">
                        {sourceTypeLabel(run.sourceType)}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-muted-brand">
                      {dayjs(run.createdAt).format("DD MMM YYYY, HH:mm")}
                    </p>
                    {run.documents.length > 0 ? (
                      <p className="mt-1 flex items-center gap-1 text-xs text-slate-brand">
                        <FileText className="h-3 w-3" />
                        {run.documents.length} archivo
                        {run.documents.length === 1 ? "" : "s"}
                      </p>
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </aside>
  );
}
