import {
  inferSeniorityBandFromText,
  resolveSeniorityIdsFromBand,
  resolveSeniorityIdsFromInference,
} from './vacancy-ai-seniority';

const seedCatalog = [
  { id: 1, name: 'CEO' },
  { id: 2, name: 'Director' },
  { id: 3, name: 'Gerente' },
  { id: 4, name: 'Jefe - Team Lider' },
  { id: 5, name: 'Asistente Ejecutiva' },
];

describe('inferSeniorityBandFromText', () => {
  it('maps executive roles to executive band', () => {
    expect(inferSeniorityBandFromText('Buscamos CFO para fintech')).toBe(
      'executive',
    );
    expect(inferSeniorityBandFromText('CEO regional')).toBe('executive');
  });

  it('maps gerente and director roles', () => {
    expect(
      inferSeniorityBandFromText('gerente comercial para retail'),
    ).toBe('manager');
    expect(inferSeniorityBandFromText('Director de operaciones')).toBe(
      'director',
    );
  });

  it('maps entry-level roles', () => {
    expect(inferSeniorityBandFromText('data entry remoto')).toBe('entry');
    expect(inferSeniorityBandFromText('pasante de administración')).toBe(
      'entry',
    );
  });
});

describe('resolveSeniorityIdsFromInference', () => {
  it('resolves gerente to Gerente id', () => {
    expect(
      resolveSeniorityIdsFromInference('gerente comercial', seedCatalog),
    ).toEqual([3]);
  });

  it('resolves CEO to CEO id', () => {
    expect(resolveSeniorityIdsFromInference('CEO', seedCatalog)).toEqual([1]);
  });

  it('resolves data entry to lowest available catalog match', () => {
    const ids = resolveSeniorityIdsFromInference('data entry', seedCatalog);
    expect(ids).toBeDefined();
    expect(ids).toContain(5);
  });

  it('resolves director band to Director', () => {
    expect(
      resolveSeniorityIdsFromBand('director', seedCatalog),
    ).toEqual([2]);
  });
});
