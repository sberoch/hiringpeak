import { readFileSync } from 'fs';
import { join } from 'path';
import {
  Document,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
} from '@react-pdf/renderer';
import { stringToColor } from '@workspace/shared/utils';
import type {
  CompanyReportDocumentData,
  CompanyReportVacancyRow,
} from './company-report.types';
import { formatReportDate } from './company-report.utils';

interface CompanyReportDocumentProps {
  report: CompanyReportDocumentData;
}

const LOGO_BUFFER = readFileSync(
  join(__dirname, '../common/assets/logo.png'),
);

const COLORS = {
  bg: '#fafbfc',
  surface: '#ffffff',
  surfaceAlt: '#f8fafc',
  ink: '#0a0f1c',
  slate: '#475569',
  muted: '#94a3b8',
  border: '#e2e8f0',
  borderLight: '#f1f5f9',
  electric: '#0066ff',
  hiredBg: '#f0fdf4',
  hiredBorder: '#bbf7d0',
  hiredText: '#166534',
};

const styles = StyleSheet.create({
  page: {
    paddingTop: 64,
    paddingBottom: 48,
    paddingHorizontal: 32,
    backgroundColor: COLORS.bg,
    color: COLORS.ink,
    fontFamily: 'Plus Jakarta Sans',
    fontSize: 10,
  },

  // ── Repeating header ─────────────────────────────────────────
  pageHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 44,
    paddingHorizontal: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    borderBottom: `1 solid ${COLORS.border}`,
  },
  pageHeaderBrand: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pageHeaderLogo: {
    width: 22,
    height: 22,
    marginRight: 8,
  },
  pageHeaderTitle: {
    fontSize: 12,
    fontWeight: 700,
    color: COLORS.ink,
    letterSpacing: 0.2,
  },
  pageHeaderMeta: {
    fontSize: 8,
    color: COLORS.muted,
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  pageHeaderAccent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: COLORS.electric,
  },

  // ── Title block (page 1) ─────────────────────────────────────
  titleBlock: {
    marginTop: 4,
    marginBottom: 18,
    paddingBottom: 16,
    borderBottom: `1 solid ${COLORS.border}`,
  },
  titleEyebrow: {
    fontSize: 9,
    fontWeight: 700,
    color: COLORS.electric,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  companyTitle: {
    fontSize: 22,
    fontWeight: 700,
    color: COLORS.ink,
    marginRight: 10,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statusBadgeText: {
    fontSize: 9,
    fontWeight: 700,
    color: COLORS.ink,
  },
  companyDescription: {
    marginTop: 10,
    fontSize: 10,
    color: COLORS.slate,
    lineHeight: 1.5,
  },
  metaStrip: {
    marginTop: 14,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  metaCell: {
    marginRight: 24,
    marginBottom: 4,
  },
  metaLabel: {
    fontSize: 7,
    fontWeight: 700,
    textTransform: 'uppercase',
    color: COLORS.muted,
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  metaValue: {
    fontSize: 11,
    fontWeight: 600,
    color: COLORS.ink,
  },

  // ── Section ──────────────────────────────────────────────────
  section: {
    marginBottom: 18,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionAccent: {
    width: 3,
    height: 12,
    borderRadius: 2,
    backgroundColor: COLORS.electric,
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: 700,
    color: COLORS.ink,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  sectionCount: {
    marginLeft: 6,
    fontSize: 10,
    fontWeight: 600,
    color: COLORS.muted,
  },

  // ── Summary stat cards ───────────────────────────────────────
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryCard: {
    flex: 1,
    marginRight: 8,
    padding: 14,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    border: `1 solid ${COLORS.border}`,
  },
  summaryCardLast: {
    marginRight: 0,
  },
  summaryLabel: {
    fontSize: 7,
    fontWeight: 700,
    textTransform: 'uppercase',
    color: COLORS.muted,
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  summaryValue: {
    fontSize: 22,
    fontWeight: 700,
    color: COLORS.ink,
  },
  summaryHelper: {
    marginTop: 4,
    fontSize: 9,
    color: COLORS.slate,
  },

  // ── Hired callout ────────────────────────────────────────────
  hiredCard: {
    padding: 14,
    borderRadius: 12,
    backgroundColor: COLORS.hiredBg,
    border: `1 solid ${COLORS.hiredBorder}`,
  },
  hiredHeader: {
    fontSize: 8,
    fontWeight: 700,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    color: COLORS.hiredText,
    marginBottom: 8,
  },
  hiredRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 4,
  },
  hiredName: {
    fontSize: 11,
    fontWeight: 700,
    color: COLORS.hiredText,
    marginRight: 6,
  },
  hiredArrow: {
    fontSize: 10,
    color: COLORS.hiredText,
    marginRight: 6,
  },
  hiredVacancy: {
    fontSize: 10,
    color: COLORS.hiredText,
  },

  // ── Vacancy cards ────────────────────────────────────────────
  vacancyCard: {
    padding: 14,
    marginBottom: 8,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    border: `1 solid ${COLORS.border}`,
  },
  vacancyTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  vacancyTitleWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginRight: 10,
  },
  vacancyTitle: {
    fontSize: 12,
    fontWeight: 700,
    color: COLORS.ink,
    marginRight: 8,
  },
  vacancyTenure: {
    fontSize: 9,
    color: COLORS.muted,
    fontWeight: 600,
    textAlign: 'right',
  },
  vacancyDescription: {
    marginTop: 6,
    fontSize: 9.5,
    color: COLORS.slate,
    lineHeight: 1.5,
  },
  vacancyMetaLine: {
    marginTop: 8,
    fontSize: 9,
    color: COLORS.muted,
    fontWeight: 600,
  },

  // ── Empty state ──────────────────────────────────────────────
  emptyState: {
    paddingVertical: 22,
    paddingHorizontal: 18,
    borderRadius: 12,
    backgroundColor: COLORS.surfaceAlt,
    border: `1 solid ${COLORS.border}`,
  },
  emptyStateText: {
    fontSize: 10,
    color: COLORS.slate,
    lineHeight: 1.5,
  },

  // ── Footer ───────────────────────────────────────────────────
  footer: {
    position: 'absolute',
    left: 32,
    right: 32,
    bottom: 20,
    paddingTop: 8,
    borderTop: `1 solid ${COLORS.border}`,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 8,
    color: COLORS.muted,
  },
});

export function CompanyReportDocument({
  report,
}: CompanyReportDocumentProps) {
  const generationDateLabel = formatReportDate(report.generatedAt);
  const summaryCards = buildSummaryCards(report);

  return (
    <Document title={`Reporte de ${report.companyName}`}>
      <Page size="A4" style={styles.page} wrap>
        {/* Repeating slim header */}
        <View style={styles.pageHeader} fixed>
          <View style={styles.pageHeaderBrand}>
            <Image src={LOGO_BUFFER} style={styles.pageHeaderLogo} />
            <Text style={styles.pageHeaderTitle}>HiringPeak</Text>
          </View>
          <Text style={styles.pageHeaderMeta}>
            Reporte · {generationDateLabel}
          </Text>
          <View style={styles.pageHeaderAccent} />
        </View>

        {/* Title block (page 1 only) */}
        <View style={styles.titleBlock}>
          <Text style={styles.titleEyebrow}>{report.organizationName}</Text>
          <View style={styles.titleRow}>
            <Text style={styles.companyTitle}>{report.companyName}</Text>
          </View>
          {report.companyDescription ? (
            <Text style={styles.companyDescription}>
              {report.companyDescription}
            </Text>
          ) : null}

          {hasContact(report) ? (
            <View style={styles.metaStrip}>
              {report.contactInfo.clientName ? (
                <MetaCell label="Cliente" value={report.contactInfo.clientName} />
              ) : null}
              {report.contactInfo.clientEmail ? (
                <MetaCell label="Email" value={report.contactInfo.clientEmail} />
              ) : null}
              {report.contactInfo.clientPhone ? (
                <MetaCell label="Teléfono" value={report.contactInfo.clientPhone} />
              ) : null}
            </View>
          ) : null}
        </View>

        {/* Resumen */}
        <View style={styles.section}>
          <SectionHeader title="Resumen" />
          <View style={styles.summaryGrid}>
            {summaryCards.map((card, index) => (
              <View
                key={card.label}
                style={[
                  styles.summaryCard,
                  index === summaryCards.length - 1
                    ? styles.summaryCardLast
                    : null,
                ]}
              >
                <Text style={styles.summaryLabel}>{card.label}</Text>
                <Text style={styles.summaryValue}>{card.value}</Text>
                {card.helper ? (
                  <Text style={styles.summaryHelper}>{card.helper}</Text>
                ) : null}
              </View>
            ))}
          </View>
        </View>

        {/* Contratados callout */}
        {report.hires.length > 0 ? (
          <View style={styles.section} wrap={false}>
            <View style={styles.hiredCard}>
              <Text style={styles.hiredHeader}>
                {report.hires.length === 1 ? 'Contratado' : 'Contratados'}
              </Text>
              {report.hires.map((hire, idx) => (
                <View
                  key={`${hire.candidateName}-${hire.vacancyTitle}-${idx}`}
                  style={styles.hiredRow}
                >
                  <Text style={styles.hiredName}>{hire.candidateName}</Text>
                  <Text style={styles.hiredArrow}>→</Text>
                  <Text style={styles.hiredVacancy}>{hire.vacancyTitle}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {/* Vacantes */}
        <View style={styles.section}>
          <SectionHeader
            title="Vacantes"
            count={report.summary.totalVacancies}
          />
          {report.vacancies.length > 0 ? (
            report.vacancies.map((vacancy) => (
              <VacancyCard key={vacancy.id} vacancy={vacancy} />
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>
                Esta empresa todavía no tiene vacantes asociadas.
              </Text>
            </View>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text>{report.organizationName}</Text>
          <Text
            render={({ pageNumber, totalPages }) =>
              `Página ${pageNumber} de ${totalPages}`
            }
          />
          <Text>{generationDateLabel}</Text>
        </View>
      </Page>
    </Document>
  );
}

interface SummaryCard {
  label: string;
  value: string;
  helper?: string;
}

function buildSummaryCards(report: CompanyReportDocumentData): SummaryCard[] {
  const { summary } = report;
  return [
    {
      label: 'Vacantes',
      value: `${summary.totalVacancies}`,
      helper: `${summary.activeVacancies} activas · ${summary.closedVacancies} cerradas`,
    },
    {
      label: 'Postulantes',
      value: `${summary.totalCandidates}`,
    },
    {
      label: 'Contratados',
      value: `${summary.hiredCandidates}`,
    },
    {
      label: 'Días promedio abierta',
      value:
        summary.activeVacancies > 0
          ? `${Math.round(summary.averageDaysOpen)}`
          : '—',
      helper:
        summary.activeVacancies > 0
          ? `${summary.activeVacancies} ${summary.activeVacancies === 1 ? 'vacante activa' : 'vacantes activas'}`
          : 'sin vacantes activas',
    },
  ];
}

function hasContact(report: CompanyReportDocumentData): boolean {
  return Boolean(
    report.contactInfo.clientName ||
      report.contactInfo.clientEmail ||
      report.contactInfo.clientPhone,
  );
}

interface MetaCellProps {
  label: string;
  value: string;
}

function MetaCell({ label, value }: MetaCellProps) {
  return (
    <View style={styles.metaCell}>
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={styles.metaValue}>{value}</Text>
    </View>
  );
}

interface SectionHeaderProps {
  title: string;
  count?: number;
}

function SectionHeader({ title, count }: SectionHeaderProps) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionAccent} />
      <Text style={styles.sectionTitle}>{title}</Text>
      {typeof count === 'number' ? (
        <Text style={styles.sectionCount}>({count})</Text>
      ) : null}
    </View>
  );
}

function VacancyCard({ vacancy }: { vacancy: CompanyReportVacancyRow }) {
  const tenureLabel = vacancy.isClosed
    ? `Cerrada ${formatReportDate(vacancy.closedAt)}`
    : `${vacancy.daysOpen} ${vacancy.daysOpen === 1 ? 'día' : 'días'} abierta`;

  const metaParts: string[] = [];
  metaParts.push(
    `${vacancy.totalCandidates} ${vacancy.totalCandidates === 1 ? 'postulante' : 'postulantes'}`,
  );
  if (vacancy.hiredCandidates > 0) {
    metaParts.push(
      `${vacancy.hiredCandidates} ${vacancy.hiredCandidates === 1 ? 'contratado' : 'contratados'}`,
    );
  }
  if (vacancy.salary) {
    metaParts.push(`Compensación ${vacancy.salary}`);
  }

  return (
    <View style={styles.vacancyCard} wrap={false}>
      <View style={styles.vacancyTopRow}>
        <View style={styles.vacancyTitleWrap}>
          <Text style={styles.vacancyTitle}>{vacancy.title}</Text>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: stringToColor(vacancy.statusName) },
            ]}
          >
            <Text style={styles.statusBadgeText}>{vacancy.statusName}</Text>
          </View>
        </View>
        <Text style={styles.vacancyTenure}>{tenureLabel}</Text>
      </View>
      {vacancy.description ? (
        <Text style={styles.vacancyDescription}>{vacancy.description}</Text>
      ) : null}
      <Text style={styles.vacancyMetaLine}>{metaParts.join(' · ')}</Text>
    </View>
  );
}
