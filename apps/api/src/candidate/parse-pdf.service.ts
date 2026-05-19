import { Injectable } from '@nestjs/common';
import { getDocumentProxy } from 'unpdf';
import type { ParsePdfResponseDto } from '@workspace/shared/dtos';

interface MarkedEntry {
  tag: string;
  text: string;
}

const EMAIL_RE = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const PHONE_RE = /^[+\d][\d\s().-]{6,}$/;
const DURATION_SUMMARY_RE = /^\d+\s+(años?|years?|meses|months?|mois|ans?)\b/i;

@Injectable()
export class ParsePdfService {
  async parse(buffer: Buffer): Promise<ParsePdfResponseDto> {
    const doc = await getDocumentProxy(new Uint8Array(buffer));

    try {
      const entries = await this.extractMarkedEntries(doc);

      return {
        name: this.extractName(entries) ?? '',
        linkedin: this.extractLinkedin(entries) ?? '',
        email: this.extractEmail(entries) ?? '',
        phone: this.extractPhone(entries) ?? '',
        shortDescription: this.extractShortDescription(entries) ?? '',
      };
    } finally {
      await doc.destroy();
    }
  }

  private async extractMarkedEntries(doc: any): Promise<MarkedEntry[]> {
    const entries: MarkedEntry[] = [];

    for (let p = 1; p <= doc.numPages; p++) {
      const page = await doc.getPage(p);
      const textContent = await page.getTextContent({
        includeMarkedContent: true,
      });

      const stack: Array<{ tag: string; texts: string[] }> = [];

      for (const item of textContent.items) {
        if (
          item.type === 'beginMarkedContent' ||
          item.type === 'beginMarkedContentProps'
        ) {
          stack.push({ tag: item.tag, texts: [] });
        } else if (item.type === 'endMarkedContent') {
          const entry = stack.pop();
          if (entry && entry.texts.length > 0) {
            entries.push({ tag: entry.tag, text: entry.texts.join('') });
          }
        } else if (item.str !== undefined && stack.length > 0) {
          stack[stack.length - 1]!.texts.push(item.str);
        }
      }
    }

    return entries;
  }

  private extractName(entries: MarkedEntry[]): string | null {
    const h1s = entries.filter((e) => e.tag === 'H1');
    return h1s[h1s.length - 1]?.text || null;
  }

  private extractLinkedin(entries: MarkedEntry[]): string | null {
    const liLinkIdx = entries.findIndex(
      (e) => e.tag === 'Link' && e.text.toLowerCase().includes('linkedin'),
    );

    if (liLinkIdx === -1) return null;

    const parts = [entries[liLinkIdx]!.text];
    for (
      let i = liLinkIdx + 1;
      i < entries.length && entries[i]!.tag === 'Link';
      i++
    ) {
      parts.push(entries[i]!.text);
    }
    const joined = parts.join('');
    if (!joined.startsWith('https://')) {
      return `https://${joined.replace(/^https?:\/\//, '')}`;
    }
    return joined;
  }

  private extractEmail(entries: MarkedEntry[]): string | null {
    return (
      entries
        .find((e) => e.tag === 'Link' && EMAIL_RE.test(e.text.trim()))
        ?.text.trim() || null
    );
  }

  private extractPhone(entries: MarkedEntry[]): string | null {
    const firstH1 = entries.findIndex((e) => e.tag === 'H1');
    const secondH1 = entries.findIndex((e, i) => i > firstH1 && e.tag === 'H1');
    const contactSection = entries.slice(firstH1 + 1, secondH1);

    return (
      contactSection
        .find((e) => e.tag === 'P' && PHONE_RE.test(e.text.trim()))
        ?.text.trim() || null
    );
  }

  private extractShortDescription(entries: MarkedEntry[]): string | null {
    const expIdx = entries.findIndex(
      (e) => e.tag === 'P' && /^(Experience|Experiencia)$/i.test(e.text.trim()),
    );

    if (expIdx === -1) return null;

    const after = entries.slice(expIdx + 1);
    const company = after.find((e) => e.tag === 'P');
    if (!company) return null;

    const companyIdx = after.indexOf(company);
    const role = after
      .slice(companyIdx + 1)
      .find((e) => e.tag === 'P' && !DURATION_SUMMARY_RE.test(e.text.trim()));

    const companyName = company.text.trim() || null;
    const roleName = role?.text.trim() || null;

    if (roleName && companyName) return `${roleName} en ${companyName}`;
    if (roleName) return roleName;
    if (companyName) return companyName;
    return null;
  }
}
