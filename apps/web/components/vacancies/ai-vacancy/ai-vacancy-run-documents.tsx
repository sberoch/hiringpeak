"use client";

import { FileText } from "lucide-react";

import type { AiVacancyRunDocumentSummary } from "@workspace/shared/types/vacancy-ai";

function formatFileSize(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface AiVacancyRunDocumentsProps {
  documents: AiVacancyRunDocumentSummary[];
}

export function AiVacancyRunDocuments({ documents }: AiVacancyRunDocumentsProps) {
  if (documents.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-brand">
        Archivos usados
      </p>
      <ul className="space-y-2">
        {documents.map((document) => (
          <li
            key={document.id}
            className="flex items-center gap-2 rounded-lg border border-brand-border bg-canvas px-3 py-2"
          >
            <FileText className="h-4 w-4 shrink-0 text-electric" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-ink">
                {document.fileName}
              </p>
              <p className="text-xs text-muted-brand">
                {formatFileSize(document.sizeBytes)}
              </p>
            </div>
          </li>
        ))}
      </ul>
      <p className="text-xs text-muted-brand">
        Los archivos no se almacenan todavía; solo se conserva el registro de
        qué documentos se usaron en la generación.
      </p>
    </div>
  );
}
