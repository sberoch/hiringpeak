"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { FileUp, Loader2, UserRoundPlus } from "lucide-react";
import { toast } from "sonner";
import { PageHeading } from "@workspace/ui/components/page-heading";
import { Button } from "@workspace/ui/components/button";
import { parseCandidatePdf } from "@/lib/api/candidate";
import NewCandidateForm from "./new-candidate-form";
import type { ParsePdfResponse } from "@workspace/shared/types/candidate";

export default function NewCandidatePageWrapper() {
  const [parsedPdfData, setParsedPdfData] = useState<ParsePdfResponse | null>(
    null
  );
  const [isParsing, setIsParsing] = useState(false);
  const [parsedFileName, setParsedFileName] = useState<string | null>(null);

  const handleFile = useCallback(async (file: File) => {
    setParsedFileName(file.name);
    setIsParsing(true);
    toast.success(`PDF "${file.name}" recibido correctamente`);

    try {
      const data = await parseCandidatePdf(file);
      setParsedPdfData(data);
      toast.success("Datos extraídos del PDF correctamente");
    } catch {
      toast.error("Error al extraer datos del PDF");
    } finally {
      setIsParsing(false);
    }
  }, []);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        handleFile(acceptedFiles[0]!);
      }
    },
    [handleFile]
  );

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    maxSize: 10 * 1024 * 1024,
    multiple: false,
    noClick: true,
    noKeyboard: true,
    onDropRejected: () => {
      toast.error("Solo se aceptan archivos PDF");
    },
  });

  return (
    <div {...getRootProps()} className="relative flex flex-col gap-6">
      <input {...getInputProps()} />

      {isDragActive && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-canvas/80 backdrop-blur-sm border-2 border-dashed border-brand-border">
          <div className="flex flex-col items-center gap-3">
            <FileUp className="h-12 w-12 text-slate-brand" />
            <p className="text-lg font-medium text-ink">
              Suelte el PDF aquí
            </p>
            <p className="text-sm text-muted-brand">
              Se aceptan archivos PDF de hasta 10MB
            </p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between gap-4">
        <PageHeading
          icon={UserRoundPlus}
          title="Nuevo Postulante"
          description="Ingrese los datos del nuevo candidato. Los campos con * son obligatorios."
        />
        <div className="flex items-center gap-3 flex-shrink-0">
          {isParsing && (
            <div className="flex items-center gap-2 rounded-lg border border-brand-border bg-surface px-3 py-1.5">
              <Loader2 className="h-4 w-4 animate-spin text-slate-brand" />
              <span className="text-sm text-slate-brand">{parsedFileName}</span>
            </div>
          )}
          {!isParsing && parsedFileName && (
            <div className="flex items-center gap-2 rounded-lg border border-brand-border bg-surface px-3 py-1.5">
              <FileUp className="h-4 w-4 text-slate-brand" />
              <span className="text-sm text-slate-brand">{parsedFileName}</span>
            </div>
          )}
          <Button type="button" variant="brand-ghost" onClick={open}>
            <FileUp className="h-4 w-4 mr-2" />
            Cargar PDF
          </Button>
        </div>
      </div>

      <NewCandidateForm parsedPdfData={parsedPdfData} />
    </div>
  );
}
