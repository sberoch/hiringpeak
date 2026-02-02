"use server";

import { getDownloadURL, ref } from "firebase/storage";

import { storage } from "../firebase";

export interface OpenResult {
  success: boolean;
  url?: string;
  error?: string;
  fileName?: string;
  fileType?: string;
  canPreview?: boolean;
}

export async function getOpenUrl(filePath: string): Promise<OpenResult> {
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
    const fileExtension = fileName.split(".").pop()?.toLowerCase();

    const previewableExtensions = ["pdf", "jpg", "jpeg", "png", "gif", "txt"];
    const canPreview = previewableExtensions.includes(fileExtension || "");

    let fileType = "unknown";
    switch (fileExtension) {
      case "pdf":
        fileType = "pdf";
        break;
      case "doc":
      case "docx":
        fileType = "word";
        break;
      case "xls":
      case "xlsx":
        fileType = "excel";
        break;
      case "jpg":
      case "jpeg":
      case "png":
      case "gif":
        fileType = "image";
        break;
      case "txt":
        fileType = "text";
        break;
      default:
        fileType = "other";
    }

    return {
      success: true,
      url: downloadURL,
      fileName: fileName,
      fileType: fileType,
      canPreview: canPreview,
    };
  } catch (error) {
    console.error("Error getting open URL:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

export async function openDocumentInNewTab(
  filePath: string
): Promise<OpenResult> {
  try {
    const result = await getOpenUrl(filePath);

    if (!result.success) {
      return result;
    }

    if (result.canPreview) {
      return {
        ...result,
        success: true,
      };
    } else {
      return {
        ...result,
        success: true,
      };
    }
  } catch (error) {
    console.error("Error opening document:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}
