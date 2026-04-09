import { Font } from '@react-pdf/renderer';

let fontsRegistered = false;

export function registerVacancyReportFonts() {
  if (fontsRegistered) {
    return;
  }

  Font.register({
    family: 'Plus Jakarta Sans',
    fonts: [
      {
        src: require.resolve(
          '@fontsource/plus-jakarta-sans/files/plus-jakarta-sans-latin-400-normal.woff',
        ),
        fontWeight: 400,
      },
      {
        src: require.resolve(
          '@fontsource/plus-jakarta-sans/files/plus-jakarta-sans-latin-500-normal.woff',
        ),
        fontWeight: 500,
      },
      {
        src: require.resolve(
          '@fontsource/plus-jakarta-sans/files/plus-jakarta-sans-latin-600-normal.woff',
        ),
        fontWeight: 600,
      },
      {
        src: require.resolve(
          '@fontsource/plus-jakarta-sans/files/plus-jakarta-sans-latin-700-normal.woff',
        ),
        fontWeight: 700,
      },
    ],
  });

  Font.registerHyphenationCallback((word) => [word]);
  fontsRegistered = true;
}
