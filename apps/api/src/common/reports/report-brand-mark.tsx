import { Image, StyleSheet, Text } from '@react-pdf/renderer';
import type { ReportBrand } from './report-brand';

const styles = StyleSheet.create({
  // Fixed height, width from the logo's aspect ratio, capped so a very wide
  // logo can't push the header's date off the page.
  logo: {
    height: 24,
    maxWidth: 160,
    objectFit: 'contain',
  },
  wordmark: {
    fontSize: 12,
    fontWeight: 700,
    color: '#0a0f1c',
    letterSpacing: 0.2,
  },
});

/** The Organization's mark in a client-facing PDF's repeating header. */
export function ReportBrandMark({ brand }: { brand: ReportBrand }) {
  if (brand.kind === 'logo') {
    return <Image src={brand.logoUrl} style={styles.logo} />;
  }
  return <Text style={styles.wordmark}>{brand.text}</Text>;
}
