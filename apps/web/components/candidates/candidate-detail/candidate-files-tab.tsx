import { DownloadIcon, FileIcon } from "lucide-react";

import type { Candidate } from "@workspace/shared/types/candidate";
import { Button } from "@workspace/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card";

interface CandidateFilesTabProps {
  candidate: Candidate;
}

export const CandidateFilesTab = ({ candidate }: CandidateFilesTabProps) => {
  const candidateFiles = candidate.files || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Archivos del Candidato</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            Los archivos asociados a {candidate.name} están disponibles para
            descargar.
          </div>

          {candidateFiles.length > 0 ? (
            <div className="border rounded-md divide-y">
              {candidateFiles.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between p-4"
                >
                  <div className="flex items-center space-x-4">
                    <FileIcon className="h-8 w-8 text-blue-500" />
                    <div>
                      <a
                        href={file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium hover:underline text-blue-600 hover:text-blue-800"
                      >
                        {file.name}
                      </a>
                      <div className="text-sm text-muted-foreground">
                        Archivo del candidato
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <Button variant="ghost" size="icon" asChild>
                      <a href={file.url} target="_blank" rel="noopener noreferrer">
                        <DownloadIcon className="h-4 w-4" />
                      </a>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No hay archivos asociados a este candidato
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
