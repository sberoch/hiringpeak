import { brandingStorageDir } from "@workspace/shared/lib/branding-storage";

/** The logo types the PDF renderer can embed: no SVG. */
const LOGO_EXTENSION_BY_TYPE: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
};

export const LOGO_ACCEPT = {
  "image/png": [".png"],
  "image/jpeg": [".jpg", ".jpeg"],
};

export const LOGO_MAX_BYTES = 10 * 1024 * 1024;

/** Height of the copy the sidebar and PDFs display. */
export const LOGO_DISPLAY_HEIGHT = 600;

/** Why `file` can't be the logo, or null when it can. */
export function logoFileError(file: File): string | null {
  if (!LOGO_EXTENSION_BY_TYPE[file.type]) {
    return "El logo debe ser un archivo PNG o JPG.";
  }
  if (file.size > LOGO_MAX_BYTES) {
    return "El logo no puede superar los 10 MB.";
  }
  return null;
}

/** The image and storage boundary: Canvas and Firebase Storage in the app. */
export interface LogoStorage {
  /** A copy of `file` at most `maxHeight` px tall, same type. */
  downscale(file: File, maxHeight: number): Promise<Blob>;
  /** Stores `blob` at `path` and returns its public URL. */
  upload(blob: Blob, path: string): Promise<string>;
}

/**
 * Stores a new logo for the Organization: the original as uploaded, and a
 * copy downscaled to {@link LOGO_DISPLAY_HEIGHT} px tall that is what gets
 * displayed. Both live under the Organization's Branding path.
 */
export async function uploadBrandingLogo(
  file: File,
  organizationId: number,
  storage: LogoStorage,
): Promise<{ logoUrl: string; originalLogoUrl: string }> {
  const error = logoFileError(file);
  if (error) throw new Error(error);

  const base = `${brandingStorageDir(organizationId)}/${Date.now()}-logo`;
  const extension = LOGO_EXTENSION_BY_TYPE[file.type];
  const downscaled = await storage.downscale(file, LOGO_DISPLAY_HEIGHT);
  const [logoUrl, originalLogoUrl] = await Promise.all([
    storage.upload(downscaled, `${base}.${extension}`),
    storage.upload(file, `${base}-original.${extension}`),
  ]);
  return { logoUrl, originalLogoUrl };
}
