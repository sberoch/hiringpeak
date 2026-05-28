"use client";

import dayjs from "dayjs";
import { Sparkles } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { AiVacancyRunDocuments } from "@/components/vacancies/ai-vacancy/ai-vacancy-run-documents";
import { getVacancyAiSource, VACANCY_AI_API_KEY } from "@/lib/api/vacancy-ai";
import type { AiVacancyRunDetail } from "@workspace/shared/types/vacancy-ai";

interface VacancyAiSourcePanelProps {
  vacancyId: string;
}

export function VacancyAiSourcePanel({ vacancyId }: VacancyAiSourcePanelProps) {
  const { data, isLoading, isError } = useQuery({
    queryKey: [VACANCY_AI_API_KEY, "source", vacancyId],
    queryFn: () => getVacancyAiSource(vacancyId),
    retry: false,
  });

  if (isLoading || isError || !data) {
    return null;
  }

  return <VacancyAiSourceCard run={data} />;
}

function VacancyAiSourceCard({ run }: { run: AiVacancyRunDetail }) {
  return (
    <div className="rounded-2xl border border-brand-border bg-surface p-6 lg:col-span-3">
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-electric/10 text-electric">
          <Sparkles className="h-3.5 w-3.5" />
        </div>
        <h3 className="text-sm font-semibold text-ink">Generada con IA</h3>
      </div>
      <div className="space-y-4 text-sm">
        {run.userPrompt ? (
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-brand">
              Prompt del usuario
            </p>
            <p className="whitespace-pre-wrap text-slate-brand">{run.userPrompt}</p>
          </div>
        ) : null}
        <AiVacancyRunDocuments documents={run.documents} />
        <p className="text-xs text-muted-brand">
          Generado el {dayjs(run.createdAt).format("DD MMM YYYY, HH:mm")} con {run.model}.
        </p>
      </div>
    </div>
  );
}
