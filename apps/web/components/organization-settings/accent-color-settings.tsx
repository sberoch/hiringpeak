"use client";

import { RotateCcw, Save } from "lucide-react";
import { useState } from "react";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import {
  accentTextColor,
  accentTextOnWhite,
  DEFAULT_ACCENT_COLOR,
  type ReadableAccent,
  readableAccent,
} from "@workspace/shared/lib/accent-color";

/** The PDFs' ink, used for text that would fade on the page in a light accent. */
const PDF_INK = "#0a0f1c";

/**
 * The accent color part of the Branding card: a color picker with hex input
 * and a live preview of a branded PDF header, checked against the shared
 * readability rule before it can be saved.
 */
export function AccentColorSettings({
  accentColor,
  logoUrl,
  organizationName,
  busy,
  onSave,
  onClear,
}: {
  /** The saved accent color, or null for the default blue. */
  accentColor: string | null;
  logoUrl: string | null;
  organizationName: string;
  busy: boolean;
  onSave: (color: string) => void;
  onClear: () => void;
}) {
  const saved = accentColor ?? DEFAULT_ACCENT_COLOR;
  const [draft, setDraft] = useState(saved);
  const [previewed, setPreviewed] = useState<ReadableAccent>(() =>
    readableAccent(accentColor),
  );

  const readability = accentTextColor(draft);
  const pick = (value: string) => {
    setDraft(value);
    const result = accentTextColor(value);
    if (result.ok) setPreviewed({ color: value, textColor: result.textColor });
  };

  const unchanged = draft.toLowerCase() === saved.toLowerCase();

  return (
    <section className="mt-6 max-w-2xl rounded-2xl border border-brand-border bg-surface p-6">
      <h2 className="text-sm font-semibold text-ink">Color de acento</h2>
      <p className="mt-1 text-xs text-slate-brand">
        Se usa en los reportes PDF que enviás a tus clientes. El texto sobre el
        color se elige solo: negro o blanco, el que mejor se lea.
      </p>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <input
          type="color"
          aria-label="Color de acento"
          value={previewed.color}
          disabled={busy}
          onChange={(event) => pick(event.target.value)}
          className="h-9 w-12 cursor-pointer rounded-md border border-brand-border bg-transparent p-1"
        />
        <Input
          aria-label="Código hexadecimal"
          aria-invalid={!readability.ok}
          value={draft}
          disabled={busy}
          maxLength={7}
          onChange={(event) => pick(event.target.value.trim())}
          className="w-32 font-mono uppercase"
        />
        <Button
          type="button"
          disabled={busy || !readability.ok || unchanged}
          onClick={() => onSave(draft.toLowerCase())}
          className="bg-electric text-white hover:bg-electric-light"
        >
          <Save className="h-4 w-4" />
          Guardar color
        </Button>
        {accentColor && (
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            onClick={onClear}
          >
            <RotateCcw className="h-4 w-4" />
            Restablecer
          </Button>
        )}
      </div>

      {!readability.ok && (
        <p role="alert" className="mt-3 text-sm text-red-600">
          {readability.reason}
        </p>
      )}

      <PdfHeaderPreview
        accent={previewed}
        logoUrl={logoUrl}
        organizationName={organizationName}
      />
    </section>
  );
}

/** A miniature of the client PDFs' header, as `ReportBrandMark` draws it. */
function PdfHeaderPreview({
  accent,
  logoUrl,
  organizationName,
}: {
  accent: ReadableAccent;
  logoUrl: string | null;
  organizationName: string;
}) {
  // Mirrors the PDFs: the eyebrow keeps the accent only when it reads on white.
  const eyebrowColor = accentTextOnWhite(accent, PDF_INK);
  return (
    <figure
      aria-label="Vista previa del encabezado del PDF"
      className="mt-5 overflow-hidden rounded-xl border border-brand-border bg-white"
    >
      <div className="relative flex items-center justify-between px-5 py-3">
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- remote Firebase URL, already downscaled
          <img
            src={logoUrl}
            alt={organizationName}
            className="h-6 max-w-40 object-contain"
          />
        ) : (
          <span className="text-sm font-bold" style={{ color: PDF_INK }}>
            {organizationName}
          </span>
        )}
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-brand">
          Reporte
        </span>
        <div
          data-testid="preview-accent-bar"
          className="absolute inset-x-0 bottom-0 h-0.5"
          style={{ backgroundColor: accent.color }}
        />
      </div>
      <div className="flex items-center justify-between gap-4 px-5 py-4">
        <div>
          <p
            className="text-[10px] font-bold uppercase tracking-widest"
            style={{ color: eyebrowColor }}
          >
            {organizationName}
          </p>
          <p className="mt-1 flex items-center gap-2 text-base font-bold text-ink">
            <span
              aria-hidden
              className="inline-block h-3 w-[3px] rounded-sm"
              style={{ backgroundColor: accent.color }}
            />
            Gerente Comercial
          </p>
        </div>
        <span
          className="rounded-md px-2.5 py-1 text-xs font-semibold"
          style={{ backgroundColor: accent.color, color: accent.textColor }}
        >
          Texto de ejemplo
        </span>
      </div>
    </figure>
  );
}
