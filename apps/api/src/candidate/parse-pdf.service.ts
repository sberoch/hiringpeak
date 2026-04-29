import { Injectable } from '@nestjs/common';
import { extractText, getDocumentProxy } from 'unpdf';
import type { ParsePdfResponseDto } from '@workspace/shared/dtos';

const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
const PHONE_RE = /\+?[\d\s()-]{7,}/;
const LINKEDIN_RE = /(?:www\.)?linkedin\.com\/in\/[^\s]+/;
const EXPERIENCE_RE = /^(?:Experience|Experiencia)$/i;

@Injectable()
export class ParsePdfService {
  async parse(buffer: Buffer): Promise<ParsePdfResponseDto> {
    const pdf = await getDocumentProxy(new Uint8Array(buffer));
    const result = await extractText(pdf, { mergePages: false });
    const allText = (result.text as string[]).join('\n');
    const lines = allText.split('\n').map((l) => l.trim()).filter(Boolean);

    const name = lines[0] || '';

    let linkedin = '';
    let email = '';
    let phone = '';

    for (const line of lines) {
      if (!linkedin) {
        const m = line.match(LINKEDIN_RE);
        if (m) linkedin = m[0];
      }
      if (!email) {
        const m = line.match(EMAIL_RE);
        if (m) email = m[0];
      }
      if (!phone) {
        const m = line.match(PHONE_RE);
        if (m && !line.match(EMAIL_RE)) phone = m[0].trim();
      }
    }

    let shortDescription = '';
    for (let i = 0; i < lines.length; i++) {
      if (EXPERIENCE_RE.test(lines[i]!)) {
        const role = lines[i + 1] || '';
        const company = lines[i + 2] || '';
        if (role && company) {
          shortDescription = `${role} en ${company}`;
        }
        break;
      }
    }

    return { name, linkedin, email, phone, shortDescription };
  }
}
