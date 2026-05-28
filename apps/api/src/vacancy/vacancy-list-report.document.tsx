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
  VacancyListReportDocumentData,
  VacancyListReportRow,
} from './vacancy-list-report.types';
import { formatReportDate } from './vacancy-report.utils';

interface VacancyListReportDocumentProps {
  report: VacancyListReportDocumentData;
}

const LOGO_BUFFER = readFileSync(join(__dirname, '../common/assets/logo.png'));

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
};

const FACET_PALETTE: Record<string, { bg: string; text: string }> = {
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

  // ── Hero summary band ────────────────────────────────────────
  hero: {
    marginTop: 4,
    marginBottom: 16,
    padding: 14,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    border: `1 solid ${COLORS.border}`,
  },
  heroEyebrow: {
    fontSize: 9,
    fontWeight: 700,
    color: COLORS.electric,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  heroTotalRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  heroTotal: {
    fontSize: 30,
    fontWeight: 700,
    color: COLORS.ink,
    letterSpacing: -0.5,
  },
  heroTotalLabel: {
    marginLeft: 8,
    fontSize: 12,
    fontWeight: 600,
    color: COLORS.slate,
  },
  tallyWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    maxWidth: '55%',
  },
  tallyPill: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 999,
    marginLeft: 5,
    marginBottom: 4,
  },
  tallyPillText: {
    fontSize: 9,
    fontWeight: 700,
    color: COLORS.ink,
  },
  heroDivider: {
    marginTop: 12,
    paddingTop: 10,
    borderTop: `1 solid ${COLORS.borderLight}`,
  },
  filtersLabel: {
    fontSize: 7,
    fontWeight: 700,
    textTransform: 'uppercase',
    color: COLORS.muted,
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  filterChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  filterChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginRight: 5,
    marginBottom: 4,
    backgroundColor: COLORS.surfaceAlt,
    border: `1 solid ${COLORS.border}`,
  },
  filterChipText: {
    fontSize: 8,
    fontWeight: 500,
    color: COLORS.slate,
  },
  noFiltersText: {
    fontSize: 9,
    color: COLORS.muted,
  },

  // ── Vacancy ficha ────────────────────────────────────────────
  ficha: {
    marginBottom: 10,
    padding: 13,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    border: `1 solid ${COLORS.border}`,
  },
  fichaIdentityRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  fichaTitle: {
    fontSize: 13,
    fontWeight: 700,
    color: COLORS.ink,
    marginRight: 10,
  },
  fichaSubline: {
    marginTop: 3,
    fontSize: 10,
    color: COLORS.slate,
  },
  fichaSublineMuted: {
    color: COLORS.muted,
  },
  statusPill: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 999,
  },
  statusPillText: {
    fontSize: 8,
    fontWeight: 700,
    color: COLORS.ink,
  },

  // ── Meta strip ───────────────────────────────────────────────
  metaStrip: {
    marginTop: 11,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  metaCell: {
    marginRight: 26,
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

  // ── Search Brief facets ──────────────────────────────────────
  facetRow: {
    marginTop: 9,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  facetBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginRight: 4,
    marginBottom: 3,
  },
  facetBadgeText: {
    fontSize: 8,
    fontWeight: 600,
  },
  facetEmpty: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    border: `1 solid ${COLORS.border}`,
    borderStyle: 'dashed',
  },
  facetEmptyText: {
    fontSize: 8,
    fontWeight: 500,
    color: COLORS.muted,
  },

  // ── Empty state ──────────────────────────────────────────────
  emptyState: {
    paddingVertical: 40,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: COLORS.surfaceAlt,
    border: `1 solid ${COLORS.border}`,
    alignItems: 'center',
  },
  emptyStateTitle: {
    fontSize: 12,
    fontWeight: 600,
    color: COLORS.slate,
  },
  emptyStateHint: {
    marginTop: 6,
    fontSize: 10,
    color: COLORS.muted,
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

export function VacancyListReportDocument({
  report,
}: VacancyListReportDocumentProps) {
  const generationDateLabel = formatReportDate(report.generatedAt);

  return (
    <Document title="Listado de vacantes">
      <Page size="A4" style={styles.page} wrap>
        {/* Repeating slim header */}
        <View style={styles.pageHeader} fixed>
          <View style={styles.pageHeaderBrand}>
            <Image src={LOGO_BUFFER} style={styles.pageHeaderLogo} />
            <Text style={styles.pageHeaderTitle}>HiringPeak</Text>
          </View>
          <Text style={styles.pageHeaderMeta}>
            Listado de vacantes · {generationDateLabel}
          </Text>
          <View style={styles.pageHeaderAccent} />
        </View>

        {/* Hero summary band */}
        <HeroSummary report={report} />

        {/* Vacancy fichas (or empty state) */}
        {report.rows.length > 0 ? (
          report.rows.map((row) => <VacancyFicha key={row.id} row={row} />)
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateTitle}>
              No hay vacantes que coincidan con los filtros aplicados.
            </Text>
            <Text style={styles.emptyStateHint}>
              Ajustá o limpiá los filtros para ampliar el listado.
            </Text>
          </View>
        )}

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

function HeroSummary({ report }: { report: VacancyListReportDocumentData }) {
  return (
    <View style={styles.hero}>
      <Text style={styles.heroEyebrow}>{report.organizationName}</Text>
      <View style={styles.heroRow}>
        <View style={styles.heroTotalRow}>
          <Text style={styles.heroTotal}>{report.total}</Text>
          <Text style={styles.heroTotalLabel}>vacantes en el listado</Text>
        </View>
        {report.statusTally.length > 0 ? (
          <View style={styles.tallyWrap}>
            {report.statusTally.map((tally) => (
              <View
                key={tally.name}
                style={[
                  styles.tallyPill,
                  { backgroundColor: stringToColor(tally.name) },
                ]}
              >
                <Text style={styles.tallyPillText}>
                  {tally.name} {tally.count}
                </Text>
              </View>
            ))}
          </View>
        ) : null}
      </View>

      <View style={styles.heroDivider}>
        <Text style={styles.filtersLabel}>Filtros aplicados</Text>
        {report.appliedFilters.length > 0 ? (
          <View style={styles.filterChipRow}>
            {report.appliedFilters.map((label) => (
              <View key={label} style={styles.filterChip}>
                <Text style={styles.filterChipText}>{label}</Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.noFiltersText}>
            Sin filtros aplicados — toda la organización
          </Text>
        )}
      </View>
    </View>
  );
}

function VacancyFicha({ row }: { row: VacancyListReportRow }) {
  return (
    <View style={styles.ficha} wrap={false}>
      {/* Identity */}
      <View style={styles.fichaIdentityRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.fichaTitle}>{row.title}</Text>
          <Text style={styles.fichaSubline}>
            {row.companyName}
            <Text style={styles.fichaSublineMuted}> · Resp. {row.ownerName}</Text>
          </Text>
        </View>
        <View
          style={[
            styles.statusPill,
            { backgroundColor: stringToColor(row.statusName) },
          ]}
        >
          <Text style={styles.statusPillText}>{row.statusName}</Text>
        </View>
      </View>

      {/* Meta strip */}
      <View style={styles.metaStrip}>
        <MetaCell label="Candidatos" value={`${row.candidateCount}`} />
        <MetaCell label="Salario" value={row.salary || 'No informado'} />
        <MetaCell label="Creada" value={formatReportDate(row.createdAt)} />
        <MetaCell
          label="Cierre"
          value={row.closedAt ? formatReportDate(row.closedAt) : 'Abierta'}
        />
        <MetaCell label="Días abiertas" value={`${row.daysOpen}`} />
      </View>

      {/* Search Brief */}
      <FacetRow
        seniorities={row.seniorities}
        areas={row.areas}
        industries={row.industries}
      />
    </View>
  );
}

function MetaCell({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metaCell}>
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={styles.metaValue}>{value}</Text>
    </View>
  );
}

function FacetRow({
  seniorities,
  areas,
  industries,
}: {
  seniorities: string[];
  areas: string[];
  industries: string[];
}) {
  const isEmpty =
    seniorities.length === 0 && areas.length === 0 && industries.length === 0;

  if (isEmpty) {
    return (
      <View style={styles.facetRow}>
        <View style={styles.facetEmpty}>
          <Text style={styles.facetEmptyText}>Sin perfil de búsqueda</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.facetRow}>
      {seniorities.map((value) => (
        <FacetBadge key={`s-${value}`} value={value} kind="seniority" />
      ))}
      {areas.map((value) => (
        <FacetBadge key={`a-${value}`} value={value} kind="area" />
      ))}
      {industries.map((value) => (
        <FacetBadge key={`i-${value}`} value={value} kind="industry" />
      ))}
    </View>
  );
}

function FacetBadge({
  value,
  kind,
}: {
  value: string;
  kind: 'seniority' | 'area' | 'industry';
}) {
  const palette = FACET_PALETTE[kind] ?? FACET_PALETTE.seniority!;
  return (
    <View style={[styles.facetBadge, { backgroundColor: palette.bg }]}>
      <Text style={[styles.facetBadgeText, { color: palette.text }]}>
        {value}
      </Text>
    </View>
  );
}
