import { readFileSync } from 'fs';
import { join } from 'path';
import { ParsePdfService } from './parse-pdf.service';

describe('ParsePdfService', () => {
  let service: ParsePdfService;

  beforeEach(() => {
    service = new ParsePdfService();
  });

  it('extracts all five fields from a LinkedIn-exported PDF', async () => {
    const fixturePath = join(
      __dirname,
      '../../test/fixtures/linkedin-profile.pdf',
    );
    const buffer = readFileSync(fixturePath);

    const result = await service.parse(buffer);

    expect(result.name).toBe('Maria Garcia Lopez');
    expect(result.linkedin).toBe('www.linkedin.com/in/mariagarcia');
    expect(result.email).toBe('maria.garcia@email.com');
    expect(result.phone).toBe('+54 11 5555-1234');
    expect(result.shortDescription).toBe(
      'Chief Technology Officer en Acme Corp',
    );
  });
});
