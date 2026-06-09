import { describe, expect, it } from 'vitest';
import {
  buildExtractionSystemPrompt,
  type CatalogContext,
} from './vacancy-ai-prompt';

const catalogs: CatalogContext = {
  areas: [
    { id: 1, name: 'Comercial' },
    { id: 2, name: 'Sistemas - Tecnología' },
  ],
  industries: [{ id: 10, name: 'Retail - SMK' }],
  seniorities: [
    { id: 20, name: 'Gerente' },
    { id: 21, name: 'Director' },
  ],
  companies: [{ id: 30, name: 'Acme SA', description: 'Consumo masivo' }],
};

describe('buildExtractionSystemPrompt', () => {
  const prompt = buildExtractionSystemPrompt(catalogs);

  it('inlines every org catalog entry with its id', () => {
    expect(prompt).toContain('1: Comercial');
    expect(prompt).toContain('2: Sistemas - Tecnología');
    expect(prompt).toContain('10: Retail - SMK');
    expect(prompt).toContain('20: Gerente');
    expect(prompt).toContain('21: Director');
    expect(prompt).toContain('30: Acme SA');
  });

  it('inlines static location and language catalogs', () => {
    expect(prompt).toContain('Argentina');
    expect(prompt).toContain('Buenos Aires');
    expect(prompt).toContain('Inglés');
  });

  it('instructs the model to never invent ids', () => {
    expect(prompt.toLowerCase()).toContain('nunca inventes ids');
  });

  it('keeps the description length constraint', () => {
    expect(prompt).toContain('1500');
  });

  it('handles empty company catalogs without crashing', () => {
    const emptyPrompt = buildExtractionSystemPrompt({
      ...catalogs,
      companies: [],
    });
    expect(emptyPrompt).toContain('(sin empresas activas cargadas)');
  });
});
