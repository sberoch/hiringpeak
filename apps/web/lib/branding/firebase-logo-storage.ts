import { getPublicUrl, uploadFile } from "@/lib/firebase/utils";

import type { LogoStorage } from "./logo-upload";

/** Downscales with a canvas; never upscales a logo that is already small. */
async function downscale(file: File, maxHeight: number): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxHeight / bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const context = canvas.getContext("2d");
  if (!context) throw new Error("No se pudo procesar el logo.");
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) =>
        blob ? resolve(blob) : reject(new Error("No se pudo procesar el logo.")),
      file.type,
      0.9,
    ),
  );
}

/** The app's logo storage: Canvas for resizing, Firebase Storage for files. */
export const firebaseLogoStorage: LogoStorage = {
  downscale,
  async upload(blob, path) {
    // Without a bucket the Firebase SDK fails in ways that read as nothing
    // happening, e.g. on a local setup with no NEXT_PUBLIC_FIREBASE_* vars.
    if (!process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET) {
      throw new Error(
        "No se pudo subir el logo: el almacenamiento de archivos no está configurado.",
      );
    }
    const name = path.split("/").pop() ?? "logo";
    const file = new File([blob], name, { type: blob.type });
    const uploaded = await uploadFile(file, path);
    return getPublicUrl(uploaded.path);
  },
};
