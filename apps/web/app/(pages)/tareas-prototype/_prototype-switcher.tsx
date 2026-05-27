"use client";

/** THROWAWAY PROTOTYPE — floating variant switcher. Hidden in production. */

import { ChevronLeft, ChevronRight, FlaskConical } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect } from "react";

export const VARIANTS = [
  { key: "A", name: "Bandeja unificada" },
  { key: "B", name: "Panel de vencimientos" },
  { key: "C", name: "Split maestro-detalle" },
] as const;

export type VariantKey = (typeof VARIANTS)[number]["key"];

export function useVariant(): VariantKey {
  const sp = useSearchParams();
  const raw = (sp.get("variant") ?? "A").toUpperCase();
  return (VARIANTS.some((v) => v.key === raw) ? raw : "A") as VariantKey;
}

export function PrototypeSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const current = useVariant();

  if (process.env.NODE_ENV === "production") return null;

  const idx = VARIANTS.findIndex((v) => v.key === current);
  const meta = VARIANTS[idx]!;

  const go = useCallback(
    (delta: number) => {
      const next = VARIANTS[(idx + delta + VARIANTS.length) % VARIANTS.length]!;
      router.replace(`${pathname}?variant=${next.key}`);
    },
    [idx, pathname, router],
  );

  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => {
      const el = document.activeElement;
      const tag = el?.tagName?.toLowerCase();
      if (
        tag === "input" ||
        tag === "textarea" ||
        (el as HTMLElement | null)?.isContentEditable
      ) {
        return;
      }
      if (ev.key === "ArrowLeft") go(-1);
      if (ev.key === "ArrowRight") go(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go]);

  return (
    <div className="fixed bottom-6 left-1/2 z-[60] -translate-x-1/2">
      <div className="flex items-center gap-1 rounded-full border border-ink/10 bg-ink px-2 py-2 text-white shadow-[0_12px_32px_-8px_rgba(0,0,0,0.45)]">
        <button
          type="button"
          onClick={() => go(-1)}
          aria-label="Variante anterior"
          className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-white/15"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="flex items-center gap-2 px-3 text-sm">
          <FlaskConical className="h-3.5 w-3.5 text-white/60" />
          <span className="font-bold">{meta.key}</span>
          <span className="text-white/70">— {meta.name}</span>
          <span className="ml-1 text-[11px] text-white/40">
            ({idx + 1}/{VARIANTS.length})
          </span>
        </div>
        <button
          type="button"
          onClick={() => go(1)}
          aria-label="Variante siguiente"
          className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-white/15"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
