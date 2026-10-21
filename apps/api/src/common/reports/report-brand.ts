import type { Branding } from '@workspace/shared/types/branding';

/**
 * The mark heading a client-facing PDF (Vacancy Report, Company Report): the
 * Organization's logo when it has one, else its name as a text wordmark. These
 * PDFs are the agency's deliverables, so they never carry HiringPeak's mark.
 */
export type ReportBrand =
  | { kind: 'logo'; logoUrl: string }
  | { kind: 'wordmark'; text: string };

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
