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
