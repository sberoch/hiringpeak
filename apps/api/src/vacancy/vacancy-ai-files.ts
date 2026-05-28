import { BadRequestException } from '@nestjs/common';

export const VACANCY_AI_MAX_FILES = 5;
export const VACANCY_AI_MAX_FILE_BYTES = 10 * 1024 * 1024;

export const VACANCY_AI_ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'text/plain',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

const EXTENSION_TO_MIME: Record<string, string> = {
  pdf: 'application/pdf',
  txt: 'text/plain',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
};

export type VacancyAiUploadFile = {
  buffer: Buffer;
  mimeType: string;
  fileName: string;
  sizeBytes: number;
};

export type VacancyAiMulterFile = {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
  size: number;
};

export function resolveUploadMimeType(file: VacancyAiMulterFile): string | null {
  if (VACANCY_AI_ALLOWED_MIME_TYPES.has(file.mimetype)) {
    return file.mimetype;
  }

  const extension = file.originalname.split('.').pop()?.toLowerCase();
  if (!extension) {
    return null;
  }

  return EXTENSION_TO_MIME[extension] ?? null;
}

export function parseVacancyAiUploadFiles(
  files: VacancyAiMulterFile[] | undefined,
): VacancyAiUploadFile[] {
  if (!files?.length) {
    return [];
  }

  if (files.length > VACANCY_AI_MAX_FILES) {
    throw new BadRequestException(
      `You can upload at most ${VACANCY_AI_MAX_FILES} files`,
    );
  }

  return files.map((file) => {
    const mimeType = resolveUploadMimeType(file);

    if (!mimeType) {
      throw new BadRequestException(
        `File type not allowed: ${file.originalname}. Use PDF, TXT, or DOCX.`,
      );
    }

    if (file.size > VACANCY_AI_MAX_FILE_BYTES) {
      throw new BadRequestException(
        `File exceeds maximum size of ${VACANCY_AI_MAX_FILE_BYTES / 1024 / 1024}MB: ${file.originalname}`,
      );
    }

    return {
      buffer: file.buffer,
      mimeType,
      fileName: file.originalname,
      sizeBytes: file.size,
    };
  });
}

export function assertExtractHasInput(
  userPrompt: string | undefined,
  files: VacancyAiUploadFile[],
) {
  const hasPrompt = (userPrompt?.trim().length ?? 0) > 0;
  const hasFiles = files.length > 0;

  if (!hasPrompt && !hasFiles) {
    throw new BadRequestException(
      'Provide a prompt, at least one file, or both',
    );
  }
}

export function resolveSourceType(
  userPrompt: string | undefined,
  files: VacancyAiUploadFile[],
): 'prompt' | 'documents' | 'mixed' {
  const hasPrompt = (userPrompt?.trim().length ?? 0) > 0;
  const hasFiles = files.length > 0;

  if (hasPrompt && hasFiles) {
    return 'mixed';
  }

  if (hasFiles) {
    return 'documents';
  }

  return 'prompt';
}

export function buildExtractionPromptText(
  userPrompt: string | undefined,
  files: VacancyAiUploadFile[],
): string {
  const trimmedPrompt = userPrompt?.trim();

  if (trimmedPrompt) {
    if (files.length === 0) {
      return trimmedPrompt;
    }

    return `${trimmedPrompt}\n\n(Se adjuntaron ${files.length} documento(s) para esta solicitud.)`;
  }

  return 'Generá la vacante a partir de los documentos adjuntos.';
}
