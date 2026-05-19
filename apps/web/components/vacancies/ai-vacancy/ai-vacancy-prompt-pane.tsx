"use client";

import { Sparkles } from "lucide-react";

import { Button } from "@workspace/ui/components/button";
import { Label } from "@workspace/ui/components/label";
import { Textarea } from "@workspace/ui/components/textarea";
import { fieldClassName } from "./ai-vacancy-section";

interface AiVacancyPromptPaneProps {
  prompt: string;
  onPromptChange: (value: string) => void;
  onSubmit: () => void;
  isGenerating: boolean;
}

export function AiVacancyPromptPane({
  prompt,
  onPromptChange,
  onSubmit,
  isGenerating,
}: AiVacancyPromptPaneProps) {
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
        <Label htmlFor="vacancy-ai-prompt" className="text-sm font-medium text-ink">
          Qué estás buscando
        </Label>
        <Textarea
          id="vacancy-ai-prompt"
          value={prompt}
          onChange={(event) => onPromptChange(event.target.value)}
          placeholder="Ej: Busco gerente comercial para retail en Buenos Aires, con inglés, experiencia en consumo masivo y liderazgo regional."
          className={`min-h-[200px] resize-none text-base ${fieldClassName}`}
        />
        <Button
          type="button"
          disabled={isGenerating}
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
