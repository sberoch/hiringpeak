import {
  type AccentTextColor,
  accentTextColor,
  DEFAULT_ACCENT_COLOR,
} from '@workspace/shared/lib/accent-color';
import type { Branding } from '@workspace/shared/types/branding';

/**
 * The mark heading a client-facing PDF (Vacancy Report, Company Report): the
 * Organization's logo when it has one, else its name as a text wordmark. These
 * PDFs are the agency's deliverables, so they never carry HiringPeak's mark.
 */
export type ReportBrand =
  | { kind: 'logo'; logoUrl: string }
  | { kind: 'wordmark'; text: string };

/**
 * The color accenting a client-facing PDF, and the text color (black or white)
 * that reads on it.
 */
export type ReportAccent = { color: string; textColor: AccentTextColor };

/** What the report data builders need to know about the Organization's brand. */
export type ReportBranding = Pick<Branding, 'logoUrl' | 'accentColor'>;

export function buildReportBrand(
  organizationName: string,
  branding: ReportBranding,
): ReportBrand {
  if (branding.logoUrl) {
    return { kind: 'logo', logoUrl: branding.logoUrl };
  }
  return { kind: 'wordmark', text: organizationName };
}

/**
 * The Organization's accent color, or the default blue when it has none. A
 * stored color that fails the readability rule (the API never saves one) also
 * falls back to the default rather than ship an unreadable PDF.
 */
export function buildReportAccent({
  accentColor,
}: ReportBranding): ReportAccent {
  const color = accentColor ?? DEFAULT_ACCENT_COLOR;
  const readability = accentTextColor(color);
  if (readability.ok === true) {
    return { color, textColor: readability.textColor };
  }
  return buildReportAccent({ logoUrl: null, accentColor: null });
}
