export interface DownloadableFile {
  blob: Blob;
  fileName: string;
}

export function downloadFile(file: DownloadableFile) {
  const objectUrl = window.URL.createObjectURL(file.blob);
  const anchor = document.createElement("a");

  anchor.href = objectUrl;
  anchor.download = file.fileName;
  anchor.style.display = "none";

  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  window.URL.revokeObjectURL(objectUrl);
}

export function getFileNameFromContentDisposition(
  contentDisposition?: string
): string | null {
  if (!contentDisposition) {
    return null;
  }

  const encodedMatch = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (encodedMatch?.[1]) {
    return decodeURIComponent(encodedMatch[1]);
  }

  const plainMatch = contentDisposition.match(/filename="?([^"]+)"?/i);
  if (plainMatch?.[1]) {
    return plainMatch[1];
  }

  return null;
}
