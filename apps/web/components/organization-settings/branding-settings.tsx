"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ImageIcon, Palette, Trash2, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@workspace/ui/components/button";
import { PageHeading } from "@workspace/ui/components/page-heading";
import { Skeleton } from "@workspace/ui/components/skeleton";

import { apiErrorMessage } from "@/lib/api/api-error";
import {
  BRANDING_API_KEY,
  getBranding,
  removeBrandingAccent,
  removeBrandingLogo,
  updateBrandingAccent,
  updateBrandingLogo,
} from "@/lib/api/branding";
import { AccentColorSettings } from "./accent-color-settings";
import { firebaseLogoStorage } from "@/lib/branding/firebase-logo-storage";
import {
  LOGO_ACCEPT,
  logoFileError,
  uploadBrandingLogo,
} from "@/lib/branding/logo-upload";

const ACCEPT_ATTRIBUTE = Object.entries(LOGO_ACCEPT)
  .flatMap(([type, extensions]) => [type, ...extensions])
  .join(",");

/**
 * The Branding card: upload or remove the Organization's logo, and pick the
 * accent color for its client PDFs.
 */
export function BrandingSettings({
  organizationId,
  organizationName,
}: {
  organizationId: number;
  organizationName: string;
}) {
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  const { data: branding, isLoading } = useQuery({
    queryKey: [BRANDING_API_KEY],
    queryFn: getBranding,
  });

  const onSaved = (message: string) => {
    queryClient.invalidateQueries({ queryKey: [BRANDING_API_KEY] });
    toast.success(message);
  };

  const upload = useMutation({
    mutationFn: async (file: File) =>
      updateBrandingLogo(
        await uploadBrandingLogo(file, organizationId, firebaseLogoStorage),
      ),
    onSuccess: () => onSaved("Logo actualizado"),
    onError: (error) =>
      toast.error(apiErrorMessage(error, "No se pudo subir el logo")),
  });

  const remove = useMutation({
    mutationFn: removeBrandingLogo,
    onSuccess: () => onSaved("Logo eliminado"),
    onError: (error) =>
      toast.error(apiErrorMessage(error, "No se pudo eliminar el logo")),
  });

  const onFile = (file: File | undefined) => {
    if (inputRef.current) inputRef.current.value = "";
    if (!file) return;
    const error = logoFileError(file);
    setFileError(error);
    if (!error) upload.mutate(file);
  };

  const saveAccent = useMutation({
    mutationFn: (accentColor: string) => updateBrandingAccent({ accentColor }),
    onSuccess: () => onSaved("Color actualizado"),
    onError: (error) =>
      toast.error(apiErrorMessage(error, "No se pudo guardar el color")),
  });

  const clearAccent = useMutation({
    mutationFn: removeBrandingAccent,
    onSuccess: () => onSaved("Se volvió al color predeterminado"),
    onError: (error) =>
      toast.error(apiErrorMessage(error, "No se pudo quitar el color")),
  });

  const busy = upload.isPending || remove.isPending;
  const accentBusy = saveAccent.isPending || clearAccent.isPending;

  return (
    <div className="flex flex-col mb-12">
      <PageHeading
        icon={Palette}
        title="Branding"
        description="El logo de tu organización reemplaza al de HiringPeak en el menú lateral, y junto con el color de acento identifica los reportes que enviás a tus clientes."
        className="mb-8"
      />

      <section className="max-w-2xl rounded-2xl border border-brand-border bg-surface p-6">
        <h2 className="text-sm font-semibold text-ink">Logo</h2>
        <p className="mt-1 text-xs text-slate-brand">
          PNG o JPG de hasta 10 MB. Se muestra una copia reducida.
        </p>

        <div className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-center">
          <div className="flex h-24 w-48 shrink-0 items-center justify-center rounded-xl border border-dashed border-brand-border bg-canvas p-3">
            {isLoading ? (
              <Skeleton className="h-full w-full" />
            ) : branding?.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- remote Firebase URL, already downscaled
              <img
                src={branding.logoUrl}
                alt="Logo de la organización"
                className="max-h-full max-w-full object-contain"
              />
            ) : (
              <ImageIcon className="h-6 w-6 text-muted-brand" aria-hidden />
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <input
              ref={inputRef}
              type="file"
              accept={ACCEPT_ATTRIBUTE}
              className="sr-only"
              aria-label="Archivo del logo"
              onChange={(event) => onFile(event.target.files?.[0])}
            />
            <Button
              type="button"
              disabled={busy}
              onClick={() => inputRef.current?.click()}
            >
              <Upload className="h-4 w-4" />
              {upload.isPending
                ? "Subiendo…"
                : branding?.logoUrl
                  ? "Reemplazar logo"
                  : "Subir logo"}
            </Button>
            {branding?.logoUrl && (
              <Button
                type="button"
                variant="outline"
                disabled={busy}
                onClick={() => remove.mutate()}
              >
                <Trash2 className="h-4 w-4" />
                Quitar logo
              </Button>
            )}
          </div>
        </div>

        {fileError && (
          <p role="alert" className="mt-3 text-sm text-red-600">
            {fileError}
          </p>
        )}
      </section>

      {branding && (
        <AccentColorSettings
          // Remount on a saved change so the picker starts from the new color.
          key={branding.accentColor ?? "default"}
          accentColor={branding.accentColor}
          logoUrl={branding.logoUrl}
          organizationName={organizationName}
          busy={accentBusy}
          onSave={(color) => saveAccent.mutate(color)}
          onClear={() => clearAccent.mutate()}
        />
      )}
    </div>
  );
}
