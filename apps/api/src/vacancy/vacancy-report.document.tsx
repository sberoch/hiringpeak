import { readFileSync } from 'fs';
import { join } from 'path';
import {
  Document,
  Image,
  Page,
  Path,
  StyleSheet,
  Svg,
  Text,
  View,
} from '@react-pdf/renderer';
import { stringToColor } from '@workspace/shared/utils';
import type {
  VacancyReportCandidateRow,
  VacancyReportDocumentData,
} from './vacancy-report.types';
import {
  daysBetween,
  formatReportDate,
  getInitials,
} from './vacancy-report.utils';

interface VacancyReportDocumentProps {
  report: VacancyReportDocumentData;
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

const BADGE_PALETTE: Record<string, { bg: string; text: string }> = {
  seniority: { bg: '#eef2ff', text: '#4338ca' },
  area: { bg: '#ecfeff', text: '#0e7490' },
  industry: { bg: '#fef3c7', text: '#92400e' },
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
  vacancyTitle: {
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
  companyLine: {
    marginTop: 6,
    fontSize: 12,
    color: COLORS.slate,
    fontWeight: 500,
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

  // ── Hired callout ────────────────────────────────────────────
  hiredCard: {
    padding: 12,
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
    marginBottom: 6,
  },
  hiredRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  hiredName: {
    fontSize: 12,
    fontWeight: 700,
    color: COLORS.hiredText,
    marginRight: 8,
  },

  // ── Description ──────────────────────────────────────────────
  descriptionText: {
    fontSize: 10,
    color: COLORS.slate,
    lineHeight: 1.55,
  },

  // ── Candidate cards ──────────────────────────────────────────
  candidateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginBottom: 6,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    border: `1 solid ${COLORS.border}`,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  avatarInitials: {
    fontSize: 11,
    fontWeight: 700,
    color: COLORS.ink,
  },
  candidateBody: {
    flex: 1,
    minWidth: 0,
  },
  candidateName: {
    fontSize: 11,
    fontWeight: 700,
    color: COLORS.ink,
    marginBottom: 4,
  },
  candidateShortDescription: {
    fontSize: 9,
    color: COLORS.slate,
    lineHeight: 1.4,
    marginBottom: 4,
  },
  candidateBadgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  catalogBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginRight: 4,
    marginBottom: 2,
  },
  catalogBadgeText: {
    fontSize: 8,
    fontWeight: 600,
  },
  candidateRight: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    marginLeft: 10,
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  starsText: {
    fontSize: 10,
    fontWeight: 700,
    color: '#b45309',
    marginLeft: 3,
  },
  rowStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  rowStatusBadgeText: {
    fontSize: 8,
    fontWeight: 700,
    color: COLORS.ink,
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

export function VacancyReportDocument({
  report,
}: VacancyReportDocumentProps) {
  const generationDateLabel = formatReportDate(report.metadata.generatedAt);
  const isClosed = !!report.metadata.closedAt;
  const openedDays = daysBetween(
    report.metadata.createdAt,
    report.metadata.generatedAt,
  );

  return (
    <Document title={`Reporte de ${report.metadata.vacancyTitle}`}>
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
            <Text style={styles.vacancyTitle}>
              {report.metadata.vacancyTitle}
            </Text>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: stringToColor(report.metadata.statusName) },
              ]}
            >
              <Text style={styles.statusBadgeText}>
                {report.metadata.statusName}
              </Text>
            </View>
          </View>
          <Text style={styles.companyLine}>{report.metadata.companyName}</Text>

          <View style={styles.metaStrip}>
            <MetaCell
              label="Asignado a"
              value={report.metadata.assignedToName}
            />
            <MetaCell
              label={isClosed ? 'Cerrada el' : 'Abierta hace'}
              value={
                isClosed
                  ? formatReportDate(report.metadata.closedAt)
                  : `${openedDays} ${openedDays === 1 ? 'día' : 'días'}`
              }
            />
            {report.metadata.compensation ? (
              <MetaCell
                label="Compensación"
                value={report.metadata.compensation}
              />
            ) : null}
          </View>
        </View>

        {/* Hired callout */}
        {report.hiredCandidates.length > 0 ? (
          <View style={styles.section} wrap={false}>
            <View style={styles.hiredCard}>
              <Text style={styles.hiredHeader}>
                {report.hiredCandidates.length === 1
                  ? 'Contratado'
                  : 'Contratados'}
              </Text>
              {report.hiredCandidates.map((candidate) => (
                <View key={candidate.id} style={styles.hiredRow}>
                  <Text style={styles.hiredName}>{candidate.name}</Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {/* Description */}
        {report.description ? (
          <View style={styles.section}>
            <SectionHeader title="Descripción" />
            <Text style={styles.descriptionText}>{report.description}</Text>
          </View>
        ) : null}

        {/* Postulantes */}
        <View style={styles.section}>
          <SectionHeader
            title="Postulantes"
            count={report.summary.totalCandidates}
          />
          {report.candidates.length > 0 ? (
            report.candidates.map((candidate) => (
              <CandidateCard key={candidate.id} candidate={candidate} />
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>
                Esta vacante todavía no tiene postulantes asociados.
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

interface CandidateCardProps {
  candidate: VacancyReportCandidateRow;
}

function CandidateCard({ candidate }: CandidateCardProps) {
  return (
    <View style={styles.candidateCard} wrap={false}>
      <CandidateAvatar candidate={candidate} />

      <View style={styles.candidateBody}>
        <Text style={styles.candidateName}>{candidate.name}</Text>
        {candidate.shortDescription ? (
          <Text style={styles.candidateShortDescription}>
            {candidate.shortDescription}
          </Text>
        ) : null}
        <View style={styles.candidateBadgeRow}>
          {candidate.seniorities.map((value) => (
            <CatalogBadge key={`s-${value}`} value={value} kind="seniority" />
          ))}
          {candidate.areas.map((value) => (
            <CatalogBadge key={`a-${value}`} value={value} kind="area" />
          ))}
          {candidate.industries.map((value) => (
            <CatalogBadge key={`i-${value}`} value={value} kind="industry" />
          ))}
        </View>
      </View>

      <View style={styles.candidateRight}>
        {candidate.starsValue != null ? (
          <View style={styles.starsRow}>
            <StarIcon />
            <Text style={styles.starsText}>
              {formatStars(candidate.starsValue)}
            </Text>
          </View>
        ) : null}
        <View
          style={[
            styles.rowStatusBadge,
            { backgroundColor: stringToColor(candidate.statusName) },
          ]}
        >
          <Text style={styles.rowStatusBadgeText}>{candidate.statusName}</Text>
        </View>
      </View>
    </View>
  );
}

function StarIcon() {
  return (
    <Svg width={11} height={11} viewBox="0 0 24 24">
      <Path
        d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
        fill="#f59e0b"
      />
    </Svg>
  );
}

function CandidateAvatar({ candidate }: { candidate: VacancyReportCandidateRow }) {
  const fallbackBg = stringToColor(candidate.name);
  if (candidate.image) {
    return (
      <View style={[styles.avatar, { backgroundColor: fallbackBg }]}>
        <Image src={candidate.image} style={styles.avatarImage} />
      </View>
    );
  }
  return (
    <View style={[styles.avatar, { backgroundColor: fallbackBg }]}>
      <Text style={styles.avatarInitials}>{getInitials(candidate.name)}</Text>
    </View>
  );
}

interface CatalogBadgeProps {
  value: string;
  kind: 'seniority' | 'area' | 'industry';
}

function CatalogBadge({ value, kind }: CatalogBadgeProps) {
  const palette = BADGE_PALETTE[kind] ?? BADGE_PALETTE.seniority!;
  return (
    <View style={[styles.catalogBadge, { backgroundColor: palette.bg }]}>
      <Text style={[styles.catalogBadgeText, { color: palette.text }]}>
        {value}
      </Text>
    </View>
  );
}

function formatStars(value: number): string {
  return Number.isInteger(value) ? `${value}` : value.toFixed(1);
}
