"use client";

import { BriefcaseBusiness, Loader2, Sparkles } from "lucide-react";

import { AiVacancyComposerInput } from "./ai-vacancy-composer-input";

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
  files: File[];
  onPromptChange: (value: string) => void;
  onFilesChange: (files: File[]) => void;
  onSubmit: () => void;
  isGenerating: boolean;
}

export function AiVacancyPromptLanding({
  prompt,
  files,
  onPromptChange,
  onFilesChange,
  onSubmit,
  isGenerating,
}: AiVacancyPromptLandingProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center overflow-y-auto px-6 py-10">
      <div className="w-full max-w-3xl">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-electric text-white shadow-[0_2px_8px_-2px_rgba(0,102,255,0.4)]">
            {isGenerating ? (
              <Sparkles className="h-6 w-6 animate-pulse" />
            ) : (
              <BriefcaseBusiness className="h-6 w-6" />
            )}
          </div>
          {isGenerating ? (
            <>
              <h2 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-ink">
                <Loader2 className="h-5 w-5 animate-spin text-electric" />
                Generando borrador…
              </h2>
              <p className="mt-2 max-w-lg text-sm leading-relaxed text-slate-brand">
                Estamos interpretando tu descripción para proponer título, compensación, filtros y
                una primera lista de candidatos. Esto puede tardar unos segundos.
              </p>
            </>
          ) : (
            <>
              <h2 className="text-2xl font-bold tracking-tight text-ink">Describí la vacante</h2>
              <p className="mt-2 max-w-lg text-sm leading-relaxed text-slate-brand">
                Describí el rol en texto, adjuntá documentos (PDF, DOCX, TXT) o ambos. Generamos un
                borrador para que revises datos, filtros y candidatos antes de publicar.
              </p>
            </>
          )}
        </div>

        <AiVacancyComposerInput
          textareaId="vacancy-ai-prompt-landing"
          prompt={prompt}
          files={files}
          onPromptChange={onPromptChange}
          onFilesChange={onFilesChange}
          onSubmit={onSubmit}
          isGenerating={isGenerating}
        />

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
