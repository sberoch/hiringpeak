"use client";

import Link from "next/link";
import { BriefcaseBusiness } from "lucide-react";

import { PageHeading } from "@workspace/ui/components/page-heading";
import { Button } from "@workspace/ui/components/button";

interface AiVacancyShellProps {
  children: React.ReactNode;
}

export function AiVacancyShell({ children }: AiVacancyShellProps) {
  return (
    <div className="-m-6 flex h-svh max-h-svh flex-col overflow-hidden">
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-4 border-b border-brand-border bg-surface px-5 py-4">
        <PageHeading
          icon={BriefcaseBusiness}
          title="Nueva vacante asistida"
          description="Describí el rol en texto, adjuntá documentos o ambos; generamos un borrador para revisar."
        />
        <Button
          asChild
          variant="outline"
          className="rounded-xl border-brand-border text-slate-brand hover:border-electric hover:bg-electric/5 hover:text-ink"
        >
          <Link href="/vacancies">Volver a vacantes</Link>
        </Button>
      </header>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">{children}</div>
    </div>
  );
}
