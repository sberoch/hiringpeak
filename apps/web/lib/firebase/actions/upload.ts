"use server";

import { getDownloadURL, ref, uploadBytes } from "firebase/storage";

import { storage } from "../firebase";

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
  fileName?: string;
}

export interface FileData {
  name: string;
  type: string;
  size: number;
  data: string;
}

export async function uploadDocument(
  fileData: FileData,
  path: string = "documents"
): Promise<UploadResult> {
  try {
    if (!fileData) {
      throw new Error("No se ha seleccionado ningún archivo");
    }

    const maxSize = 100 * 1024 * 1024;
    if (fileData.size > maxSize) {
      throw new Error("El archivo excede el tamaño permitido");
    }

    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "text/plain",
      "image/jpeg",
      "image/png",
      "image/gif",
    ];

    if (!allowedTypes.includes(fileData.type)) {
      return {
        success: false,
        error: "File type not allowed",
      };
    }

    const fileName = fileData.name;
    const storageRef = ref(storage, `${path}/${fileName}`);

    const base64Data = fileData.data.replace(/^data:[^;]+;base64,/, "");
    const uint8Array = new Uint8Array(Buffer.from(base64Data, "base64"));

    const snapshot = await uploadBytes(storageRef, uint8Array, {
      contentType: fileData.type,
    });

    const downloadURL = await getDownloadURL(snapshot.ref);

    return {
      success: true,
      url: downloadURL,
      fileName: fileName,
    };
  } catch (error) {
    console.error("Error uploading document:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Ocurrió un error desconocido",
    };
  }
}
