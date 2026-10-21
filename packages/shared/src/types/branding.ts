/**
 * An Organization's Branding (see GLOSSARY.md). Every field is optional:
 * an Organization without a logo keeps HiringPeak's in the sidebar.
 */
export interface Branding {
  /** The downscaled logo (~600 px tall): what the app and PDFs display. */
  logoUrl: string | null;
  /** The logo as uploaded, kept only so it can be downscaled again later. */
  originalLogoUrl: string | null;
  /** Accent color as `#RRGGBB`. */
  accentColor: string | null;
}
