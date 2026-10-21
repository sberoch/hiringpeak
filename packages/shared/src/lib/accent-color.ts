/**
 * The readability rule for an Organization's accent color (see Branding in
 * GLOSSARY.md). Shared by the Branding settings preview and the API
 * validation so both always agree.
 */

/** HiringPeak's blue: the client PDFs' accent when the Organization sets none. */
export const DEFAULT_ACCENT_COLOR = "#0066ff";

/** An accent color as stored and sent: `#RRGGBB`. */
export const ACCENT_COLOR_PATTERN = /^#[0-9a-fA-F]{6}$/;
export const ACCENT_COLOR_FORMAT_MESSAGE =
  "El color debe tener el formato #RRGGBB";

export type AccentTextColor = "#000000" | "#ffffff";

export type AccentReadability =
  | { ok: true; textColor: AccentTextColor }
  | { ok: false; reason: string };

/**
 * The contrast text on the accent must reach. WCAG AA asks 4.5:1, but black or
 * white always reaches at least ~4.58:1 on any color, so AA alone would never
 * reject anything. A small margin above it rejects the true mid-tones while
 * keeping HiringPeak's default blue (4.83:1 with white) usable.
 */
export const MIN_ACCENT_CONTRAST = 4.75;

const BLACK: AccentTextColor = "#000000";
const WHITE: AccentTextColor = "#ffffff";

/**
 * Which of black or white text reads better on `color` (`#RRGGBB`), using the
 * WCAG contrast ratio, or why neither is readable enough.
 */
export function accentTextColor(color: string): AccentReadability {
  if (!ACCENT_COLOR_PATTERN.test(color)) {
    return { ok: false, reason: ACCENT_COLOR_FORMAT_MESSAGE };
  }
  const luminance = relativeLuminance(color);
  const onBlack = contrastRatio(luminance, 0);
  const onWhite = contrastRatio(luminance, 1);
  if (Math.max(onBlack, onWhite) < MIN_ACCENT_CONTRAST) {
    return {
      ok: false,
      reason:
        "Este color no se lee bien ni con texto negro ni con texto blanco. Elegí uno más claro o más oscuro.",
    };
  }
  return { ok: true, textColor: onWhite >= onBlack ? WHITE : BLACK };
}

function contrastRatio(a: number, b: number): number {
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

/** WCAG 2 relative luminance of a `#RRGGBB` color. */
function relativeLuminance(color: string): number {
  const [r, g, b] = [1, 3, 5].map((at) => {
    const channel = parseInt(color.slice(at, at + 2), 16) / 255;
    return channel <= 0.04045
      ? channel / 12.92
      : ((channel + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
}
