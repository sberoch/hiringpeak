"use client";

import { ArrowUp, BriefcaseBusiness, Sparkles } from "lucide-react";

import { Button } from "@workspace/ui/components/button";
import { Textarea } from "@workspace/ui/components/textarea";
import { cn } from "@workspace/ui/lib/utils";

const SUGGESTION_PILLS = [
  {
    label: "Gerente comercial retail",
    prompt:
      "Busco gerente comercial para retail en Buenos Aires, con experiencia en consumo masivo, liderazgo de equipos y manejo de P&L.",
  },
  {
    label: "Líder técnico",
    prompt:
      "Necesito tech lead con experiencia en TypeScript, arquitectura de producto y mentoring de desarrolladores en equipo híbrido.",
  },
  {
    label: "Rol bilingüe",
    prompt:
      "Vacante bilingüe (inglés avanzado) para área de operaciones regionales, con disponibilidad para viajar y 5+ años de experiencia.",
  },
  {
    label: "Finanzas senior",
    prompt:
      "Busco analista financiero senior para industria manufacturera, con Excel avanzado, reporting y experiencia en cierre mensual.",
  },
] as const;

interface AiVacancyPromptLandingProps {
  prompt: string;
  onPromptChange: (value: string) => void;
  onSubmit: () => void;
  isGenerating: boolean;
}

export function AiVacancyPromptLanding({
  prompt,
  onPromptChange,
  onSubmit,
  isGenerating,
}: AiVacancyPromptLandingProps) {
  const canSubmit = prompt.trim().length > 0 && !isGenerating;

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter" && canSubmit) {
      event.preventDefault();
      onSubmit();
    }
  };

  return (
    <div className="flex flex-1 flex-col items-center justify-center overflow-y-auto px-6 py-10">
      <div className="w-full max-w-3xl">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-electric text-white shadow-[0_2px_8px_-2px_rgba(0,102,255,0.4)]">
            <BriefcaseBusiness className="h-6 w-6" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-ink">Describí la vacante</h2>
          <p className="mt-2 max-w-lg text-sm leading-relaxed text-slate-brand">
            Contanos el rol en tus palabras. Generamos un borrador para que revises datos, filtros y
            candidatos antes de publicar.
          </p>
        </div>

        <div
          className={cn(
            "overflow-hidden rounded-2xl border border-brand-border bg-surface shadow-[0_4px_6px_-1px_rgba(0,0,0,0.03),0_20px_40px_-12px_rgba(0,0,0,0.06)]",
            "focus-within:border-electric focus-within:shadow-[0_0_0_4px_rgba(0,102,255,0.1)]",
            "transition-all duration-200",
          )}
          aria-busy={isGenerating}
        >
          <Textarea
            id="vacancy-ai-prompt-landing"
            value={prompt}
            onChange={(event) => onPromptChange(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ej: Busco gerente comercial para retail en Buenos Aires, con inglés, experiencia en consumo masivo y liderazgo regional."
            disabled={isGenerating}
            className="min-h-[140px] resize-none border-0 bg-transparent px-5 pt-5 pb-2 text-base text-ink shadow-none placeholder:text-muted-brand focus-visible:ring-0"
          />
          <div className="flex items-center justify-between gap-3 border-t border-brand-border/80 px-4 py-3">
            <p className="text-xs text-muted-brand">
              <kbd className="rounded border border-brand-border bg-canvas px-1.5 py-0.5 font-mono text-[10px]">
                ⌘
              </kbd>{" "}
              + Enter para generar
            </p>
            <Button
              type="button"
              size="icon"
              disabled={!canSubmit}
              onClick={onSubmit}
              aria-label={isGenerating ? "Generando vacante" : "Generar vacante"}
              className="h-10 w-10 shrink-0 rounded-full bg-electric text-white hover:bg-electric-light hover:shadow-[0_8px_24px_-6px_rgba(0,102,255,0.3)] disabled:opacity-40"
            >
              {isGenerating ? (
                <Sparkles className="h-4 w-4 animate-pulse" />
              ) : (
                <ArrowUp className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap justify-center gap-2">
          {SUGGESTION_PILLS.map((pill) => (
            <button
              key={pill.label}
              type="button"
              disabled={isGenerating}
              onClick={() => onPromptChange(pill.prompt)}
              className="rounded-full border border-brand-border bg-surface px-3.5 py-1.5 text-sm text-slate-brand transition-colors hover:border-electric hover:bg-electric/5 hover:text-ink disabled:opacity-50"
            >
              {pill.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
