"use server";

import { getDownloadURL, ref } from "firebase/storage";

import { storage } from "../firebase";

export interface DownloadResult {
  success: boolean;
  url?: string;
  error?: string;
  fileName?: string;
}

export async function getDownloadLink(
  filePath: string
): Promise<DownloadResult> {
  try {
    if (!filePath) {
      return {
        success: false,
        error: "File path is required",
      };
    }

    const storageRef = ref(storage, filePath);
    const downloadURL = await getDownloadURL(storageRef);
    const fileName = filePath.split("/").pop() || "document";

    return {
      success: true,
      url: downloadURL,
      fileName: fileName,
    };
  } catch (error) {
    console.error("Error getting download link:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

export async function downloadDocument(
  filePath: string,
  fileName?: string
): Promise<DownloadResult> {
  try {
    const result = await getDownloadLink(filePath);

    if (!result.success) {
      return result;
    }

    const finalFileName = fileName || result.fileName || "document";

    return {
      success: true,
      url: result.url,
      fileName: finalFileName,
    };
  } catch (error) {
    console.error("Error downloading document:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}
