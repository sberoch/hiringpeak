import { describe, expect, it, vi } from 'vitest';
import { BadRequestException } from '@nestjs/common';

vi.mock('mammoth', () => ({
  default: {
    extractRawText: vi.fn(async ({ buffer }: { buffer: Buffer }) => {
      if (buffer.toString('utf-8') === 'corrupt') {
        throw new Error('not a docx');
      }
      return { value: 'extracted docx text', messages: [] };
    }),
  },
}));

import { normalizeFilesForModel } from './vacancy-ai-files';

const DOCX_MIME =
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

function makeFile(mimeType: string, content: string, fileName: string) {
  const buffer = Buffer.from(content, 'utf-8');
  return { buffer, mimeType, fileName, sizeBytes: buffer.length };
}

describe('normalizeFilesForModel', () => {
  it('passes PDF files through as file parts', async () => {
    const file = makeFile('application/pdf', '%PDF-1.4 fake', 'cv.pdf');
    const parts = await normalizeFilesForModel([file]);

    expect(parts).toEqual([
      { type: 'file', data: file.buffer, mediaType: 'application/pdf' },
    ]);
  });

  it('inlines TXT files as labeled text parts', async () => {
    const parts = await normalizeFilesForModel([
      makeFile('text/plain', 'hola mundo', 'notas.txt'),
    ]);

    expect(parts).toEqual([
      { type: 'text', text: 'Documento adjunto "notas.txt":\nhola mundo' },
    ]);
  });

  it('extracts DOCX files to labeled text parts via mammoth', async () => {
    const parts = await normalizeFilesForModel([
      makeFile(DOCX_MIME, 'fake docx bytes', 'perfil.docx'),
    ]);

    expect(parts).toEqual([
      {
        type: 'text',
        text: 'Documento adjunto "perfil.docx":\nextracted docx text',
      },
    ]);
  });

  it('throws BadRequestException naming the file when DOCX extraction fails', async () => {
    await expect(
      normalizeFilesForModel([makeFile(DOCX_MIME, 'corrupt', 'roto.docx')]),
    ).rejects.toThrow(BadRequestException);

    await expect(
      normalizeFilesForModel([makeFile(DOCX_MIME, 'corrupt', 'roto.docx')]),
    ).rejects.toThrow(/roto\.docx/);
  });

  it('preserves file order with mixed types', async () => {
    const pdf = makeFile('application/pdf', '%PDF', 'a.pdf');
    const txt = makeFile('text/plain', 'texto', 'b.txt');
    const parts = await normalizeFilesForModel([pdf, txt]);

    expect(parts[0]).toMatchObject({ type: 'file' });
    expect(parts[1]).toMatchObject({ type: 'text' });
  });
});
