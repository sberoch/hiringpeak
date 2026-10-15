import { describe, expect, it } from 'vitest';
import { findLikelyDuplicates } from './contact-duplicates';

const paula = {
  id: 1,
  name: 'Paula Ibáñez',
  email: 'paula@acme.com',
  linkedin: 'https://www.linkedin.com/in/paula-ibanez/',
};
const juan = {
  id: 2,
  name: 'Juan Pérez',
  email: null,
  linkedin: null,
};

describe('findLikelyDuplicates', () => {
  it('flags a Contact with the same email, ignoring case', () => {
    expect(
      findLikelyDuplicates({ name: 'P. I.', email: 'PAULA@acme.com' }, [
        paula,
        juan,
      ]),
    ).toEqual([{ contact: paula, reason: 'email' }]);
  });

  it('flags a Contact with the same LinkedIn, however the URL is written', () => {
    expect(
      findLikelyDuplicates(
        { name: 'Otra', linkedin: 'linkedin.com/in/paula-ibanez' },
        [paula, juan],
      ),
    ).toEqual([{ contact: paula, reason: 'linkedin' }]);
  });

  it('flags a Contact with the same name, ignoring accents and case', () => {
    expect(
      findLikelyDuplicates({ name: '  juan perez ' }, [paula, juan]),
    ).toEqual([{ contact: juan, reason: 'name' }]);
  });

  it('ignores names too short to mean anything', () => {
    const ana = { id: 3, name: 'Ana', email: null, linkedin: null };
    expect(findLikelyDuplicates({ name: 'ana' }, [ana])).toEqual([]);
  });

  it('never matches on blank email or LinkedIn', () => {
    expect(
      findLikelyDuplicates({ name: 'Alguien Nuevo', email: '', linkedin: '' }, [
        juan,
      ]),
    ).toEqual([]);
  });

  it('reports each matching Contact once, by its strongest reason', () => {
    expect(
      findLikelyDuplicates({ name: 'Paula Ibáñez', email: 'paula@acme.com' }, [
        paula,
      ]),
    ).toEqual([{ contact: paula, reason: 'email' }]);
  });
});
