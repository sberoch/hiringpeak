"use client";

import { FileText } from "lucide-react";

import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { Textarea } from "@workspace/ui/components/textarea";
import type { AiVacancyDraft } from "@workspace/shared/types/vacancy-ai";
import { AiVacancySection, fieldClassName } from "./ai-vacancy-section";

interface AiVacancyDraftFieldsSectionProps {
  draft: AiVacancyDraft;
  onUpdate: (updater: (current: AiVacancyDraft) => AiVacancyDraft) => void;
}

export function AiVacancyDraftFieldsSection({
  draft,
  onUpdate,
}: AiVacancyDraftFieldsSectionProps) {
  return (
    <AiVacancySection
      icon={FileText}
      title="Borrador editable"
      description="Ajustá título, compensación y descripción antes de publicar."
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="ai-vacancy-title">Título</Label>
          <Input
            id="ai-vacancy-title"
            value={draft.title ?? ""}
            onChange={(event) =>
              onUpdate((current) => ({
                ...current,
                title: event.target.value,
              }))
            }
            placeholder="Título de la vacante"
            className={fieldClassName}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="ai-vacancy-salary">Compensación</Label>
          <Input
            id="ai-vacancy-salary"
            value={draft.salary ?? ""}
            onChange={(event) =>
              onUpdate((current) => ({
                ...current,
                salary: event.target.value,
              }))
            }
            placeholder="$10,000,000"
            className={fieldClassName}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="ai-vacancy-description">Descripción</Label>
          <Textarea
            id="ai-vacancy-description"
            className={`min-h-[120px] ${fieldClassName}`}
            value={draft.description ?? ""}
            onChange={(event) =>
              onUpdate((current) => ({
                ...current,
                description: event.target.value,
              }))
            }
            placeholder="Describe el rol, el contexto y lo que esperas del perfil."
          />
        </div>
      </div>
    </AiVacancySection>
  );
}
