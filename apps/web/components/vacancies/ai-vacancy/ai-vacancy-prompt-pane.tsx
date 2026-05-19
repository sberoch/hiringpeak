"use client";

import { Sparkles } from "lucide-react";

import { AiVacancyComposerInput } from "./ai-vacancy-composer-input";
import { Button } from "@workspace/ui/components/button";

interface AiVacancyPromptPaneProps {
  prompt: string;
  files: File[];
  onPromptChange: (value: string) => void;
  onFilesChange: (files: File[]) => void;
  onSubmit: () => void;
  isGenerating: boolean;
  selectedRunDocuments?: { fileName: string }[];
}

export function AiVacancyPromptPane({
  prompt,
  files,
  onPromptChange,
  onFilesChange,
  onSubmit,
  isGenerating,
  selectedRunDocuments = [],
}: AiVacancyPromptPaneProps) {
  const canSubmit = (prompt.trim().length > 0 || files.length > 0) && !isGenerating;

  return (
    <div className="flex flex-col p-5">
      <div className="mb-4 space-y-1">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-brand">
          Prompt
        </p>
        <h2 className="text-lg font-bold tracking-tight text-ink">Texto inicial del rol</h2>
        <p className="text-sm text-slate-brand">
          El resultado es un borrador: podés ajustar filtros, título y descripción, y elegir
          candidatos antes de publicar.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <AiVacancyComposerInput
          textareaId="vacancy-ai-prompt"
          prompt={prompt}
          files={files}
          onPromptChange={onPromptChange}
          onFilesChange={onFilesChange}
          isGenerating={isGenerating}
          showSubmitButton={false}
          containerClassName="shadow-none focus-within:shadow-none"
        />

        {selectedRunDocuments.length > 0 ? (
          <div className="rounded-xl border border-brand-border bg-canvas px-3 py-2 text-xs text-muted-brand">
            Archivos de la generación seleccionada:{" "}
            {selectedRunDocuments.map((document) => document.fileName).join(", ")}
          </div>
        ) : null}

        <Button
          type="button"
          disabled={!canSubmit}
          onClick={onSubmit}
          className="w-full shrink-0 bg-electric font-semibold text-white hover:bg-electric-light hover:shadow-[0_8px_24px_-6px_rgba(0,102,255,0.3)] sm:w-auto"
        >
          <Sparkles className="mr-2 h-4 w-4" />
          {isGenerating ? "Generando vacante..." : "Generar vacante"}
        </Button>
      </div>
    </div>
  );
}
