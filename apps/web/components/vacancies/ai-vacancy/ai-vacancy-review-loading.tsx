"use client";

import { Loader2, Sparkles } from "lucide-react";

import { Skeleton } from "@workspace/ui/components/skeleton";

export function AiVacancyReviewLoading() {
  return (
    <div className="flex min-h-[min(480px,50vh)] flex-col items-center justify-center px-6 py-16">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-electric/10 text-electric">
        <Sparkles className="h-7 w-7 animate-pulse" />
      </div>
      <h2 className="mt-6 flex items-center gap-2 text-xl font-semibold text-ink">
        <Loader2 className="h-5 w-5 animate-spin text-electric" />
        Generando borrador…
      </h2>
      <p className="mt-2 max-w-md text-center text-sm leading-6 text-slate-brand">
        Estamos interpretando tu descripción para proponer título, compensación, filtros y una
        primera lista de candidatos.
      </p>

      <div className="mt-10 w-full max-w-2xl space-y-4">
        <Skeleton className="h-10 w-2/3 rounded-xl" />
        <Skeleton className="h-24 w-full rounded-xl" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Skeleton className="h-10 rounded-xl" />
          <Skeleton className="h-10 rounded-xl" />
          <Skeleton className="h-10 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
