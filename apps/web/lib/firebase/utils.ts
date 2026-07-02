export function sanitizeFileName(fileName: string): string {
  const extension = fileName.split(".").pop() || "";
  const nameWithoutExtension =
    fileName.slice(0, fileName.lastIndexOf(".")) || fileName;

  const sanitized = nameWithoutExtension
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9._-]/g, "");

  return extension ? `${sanitized}.${extension.toLowerCase()}` : sanitized;
}

export function generateCandidateImagePath(fileName: string): string {
  const sanitizedName = sanitizeFileName(fileName);
  return `candidates/${sanitizedName}`;
}

export function generateCandidateFilePath(fileName: string): string {
  const sanitizedName = sanitizeFileName(fileName);
  return `candidates/files/${Date.now()}-${sanitizedName}`;
}

export async function uploadFile(
  file: File,
  path: string
): Promise<{ path: string; fullPath: string }> {
  const { ref, uploadBytes } = await import("firebase/storage");
  const { storage } = await import("./firebase");

  const storageRef = ref(storage, path);

  const snapshot = await uploadBytes(storageRef, file, {
    cacheControl: "3600",
  });

  return {
    path: snapshot.ref.fullPath,
    fullPath: snapshot.ref.fullPath,
  };
}

export async function getPublicUrl(path: string): Promise<string> {
  const { ref, getDownloadURL } = await import("firebase/storage");
  const { storage } = await import("./firebase");

  const storageRef = ref(storage, path);
  return await getDownloadURL(storageRef);
}

const EXTENSION_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

export function isLinkedinCdnUrl(url: string | null | undefined): boolean {
  return !!url?.startsWith("https://media.licdn.com/");
}

/**
 * Copies a remote image (e.g. a signed media.licdn.com URL, which expires
 * after a few months) into our Firebase Storage and returns the permanent
 * public URL. licdn serves `Access-Control-Allow-Origin: *`, so the fetch
 * works from the browser.
 */
export async function mirrorRemoteImageToFirebase(
  remoteUrl: string
): Promise<string> {
  const response = await fetch(remoteUrl);
  if (!response.ok) {
    throw new Error(`No se pudo descargar la imagen (${response.status})`);
  }
  const blob = await response.blob();
  if (!blob.type.startsWith("image/") || blob.size === 0) {
    throw new Error("La URL remota no devolvió una imagen");
  }

  const extension = EXTENSION_BY_MIME[blob.type] ?? "jpg";
  const fileName = `linkedin_${Date.now()}.${extension}`;
  const file = new File([blob], fileName, { type: blob.type });

  const uploaded = await uploadFile(file, generateCandidateImagePath(fileName));
  return getPublicUrl(uploaded.path);
}
