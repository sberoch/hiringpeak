import { buildReportBrand } from './report-brand';

const LOGO_URL =
  'https://firebasestorage.googleapis.com/v0/b/demo/o/organizations%2F7%2Fbranding%2Flogo.png?alt=media';

describe('buildReportBrand', () => {
  it("heads the report with the Organization's logo when it has one", () => {
    expect(
      buildReportBrand('Acme Talent', { logoUrl: LOGO_URL, accentColor: null }),
    ).toEqual({ kind: 'logo', logoUrl: LOGO_URL });
  });

  it("falls back to the Organization's name as a wordmark, never HiringPeak's", () => {
    expect(
      buildReportBrand('Acme Talent', { logoUrl: null, accentColor: null }),
    ).toEqual({ kind: 'wordmark', text: 'Acme Talent' });
  });
});
