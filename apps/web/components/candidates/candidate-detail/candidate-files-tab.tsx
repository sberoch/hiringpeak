import { DownloadIcon, FileIcon } from "lucide-react";

import type { Candidate } from "@workspace/shared/types/candidate";
import { Button } from "@workspace/ui/components/button";

interface CandidateFilesTabProps {
  candidate: Candidate;
}

export const CandidateFilesTab = ({ candidate }: CandidateFilesTabProps) => {
  const candidateFiles = candidate.files || [];

  return (
    <div className="rounded-2xl border border-brand-border bg-surface">
      <div className="p-6 lg:p-8">
        <h3 className="text-lg font-bold tracking-tight text-ink">
          Archivos del Candidato
        </h3>
        <p className="text-sm text-slate-brand mt-1">
          Los archivos asociados a {candidate.name} están disponibles para
          descargar.
        </p>
      </div>
      <div className="px-6 pb-6 lg:px-8 lg:pb-8">
        {candidateFiles.length > 0 ? (
          <div className="rounded-xl border border-brand-border divide-y divide-brand-border">
            {candidateFiles.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between p-4 hover:bg-canvas transition-colors ease-[cubic-bezier(0.16,1,0.3,1)]"
              >
                <div className="flex items-center space-x-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-electric/5">
                    <FileIcon className="h-5 w-5 text-electric" />
                  </div>
                  <div>
                    <a
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-ink hover:text-electric transition-colors"
                    >
                      {file.name}
                    </a>
                    <div className="text-xs text-muted-brand">
                      Archivo del candidato
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 hover:bg-electric/5 hover:text-electric transition-colors"
                  asChild
                >
                  <a href={file.url} target="_blank" rel="noopener noreferrer">
                    <DownloadIcon className="h-4 w-4" />
                  </a>
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 text-muted-brand rounded-xl border border-brand-border-light bg-canvas">
            No hay archivos asociados a este candidato
          </div>
        )}
      </div>
    </div>
  );
};
