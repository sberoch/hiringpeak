import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
} from '@react-pdf/renderer';
import type { VacancyReportDocumentData } from './vacancy-report.types';
import { formatReportDate } from './vacancy-report.utils';

interface VacancyReportDocumentProps {
  report: VacancyReportDocumentData;
}

const styles = StyleSheet.create({
  page: {
    paddingTop: 36,
    paddingBottom: 48,
    paddingHorizontal: 32,
    backgroundColor: '#fafbfc',
    color: '#0a0f1c',
    fontFamily: 'Plus Jakarta Sans',
    fontSize: 10,
  },
  header: {
    marginBottom: 18,
    padding: 20,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    border: '1 solid #e2e8f0',
  },
  eyebrow: {
    fontSize: 9,
    fontWeight: 600,
    color: '#0066ff',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 700,
    color: '#0a0f1c',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 11,
    color: '#64748b',
    marginBottom: 16,
  },
  headerMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 14,
    borderTop: '1 solid #f1f5f9',
  },
  headerMetaBlock: {
    width: '48%',
  },
  metaLabel: {
    fontSize: 8,
    fontWeight: 600,
    textTransform: 'uppercase',
    color: '#94a3b8',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  metaValue: {
    fontSize: 11,
    fontWeight: 600,
    color: '#1a2332',
  },
  section: {
    marginBottom: 18,
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    border: '1 solid #e2e8f0',
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 700,
    color: '#0a0f1c',
    marginBottom: 10,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  summaryCard: {
    width: '31.5%',
    padding: 14,
    marginBottom: 10,
    borderRadius: 14,
    backgroundColor: '#f8fbff',
    border: '1 solid #dbeafe',
  },
  summaryLabel: {
    fontSize: 8,
    fontWeight: 600,
    textTransform: 'uppercase',
    color: '#64748b',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 700,
    color: '#0a0f1c',
    marginBottom: 4,
  },
  summaryHelper: {
    fontSize: 9,
    color: '#64748b',
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  detailCard: {
    width: '48.2%',
    padding: 14,
    marginBottom: 10,
    borderRadius: 14,
    backgroundColor: '#ffffff',
    border: '1 solid #e2e8f0',
  },
  descriptionText: {
    fontSize: 10,
    color: '#1a2332',
    lineHeight: 1.5,
  },
  filterGroup: {
    marginBottom: 10,
  },
  filterTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  filterTag: {
    marginRight: 6,
    marginBottom: 6,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: '#eff6ff',
    border: '1 solid #bfdbfe',
  },
  filterTagText: {
    fontSize: 9,
    color: '#1d4ed8',
    fontWeight: 600,
  },
  hiredCard: {
    marginBottom: 8,
    padding: 12,
    borderRadius: 14,
    backgroundColor: '#f0fdf4',
    border: '1 solid #bbf7d0',
  },
  hiredName: {
    fontSize: 11,
    fontWeight: 700,
    color: '#166534',
    marginBottom: 4,
  },
  hiredMeta: {
    fontSize: 9,
    color: '#166534',
    lineHeight: 1.4,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    paddingBottom: 8,
    marginBottom: 8,
    borderBottom: '1 solid #e2e8f0',
    backgroundColor: '#ffffff',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 10,
    marginBottom: 4,
  },
  tableRowEven: {
    backgroundColor: '#f8fafc',
  },
  tableRowOdd: {
    backgroundColor: '#ffffff',
  },
  tableHeaderText: {
    fontSize: 8,
    fontWeight: 700,
    textTransform: 'uppercase',
    color: '#64748b',
    letterSpacing: 0.7,
  },
  candidateName: {
    fontSize: 10,
    fontWeight: 600,
    color: '#0a0f1c',
    marginBottom: 3,
  },
  candidateMeta: {
    fontSize: 8,
    color: '#64748b',
  },
  cellValue: {
    fontSize: 9,
    fontWeight: 500,
    color: '#1a2332',
  },
  colCandidate: {
    width: '28%',
    paddingRight: 10,
  },
  colStatus: {
    width: '22%',
    paddingRight: 8,
  },
  colStars: {
    width: '8%',
    textAlign: 'center',
  },
  colSource: {
    width: '14%',
    paddingRight: 8,
  },
  colReason: {
    width: '28%',
  },
  emptyState: {
    paddingVertical: 24,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    border: '1 solid #e2e8f0',
  },
  emptyStateTitle: {
    fontSize: 12,
    fontWeight: 700,
    color: '#0a0f1c',
    marginBottom: 4,
  },
  emptyStateText: {
    fontSize: 10,
    color: '#64748b',
    lineHeight: 1.5,
  },
  footer: {
    position: 'absolute',
    left: 32,
    right: 32,
    bottom: 20,
    paddingTop: 8,
    borderTop: '1 solid #e2e8f0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 8,
    color: '#94a3b8',
  },
});

export function VacancyReportDocument({
  report,
}: VacancyReportDocumentProps) {
  const hasProfile = hasProfileData(report);

  return (
    <Document title={`Reporte de ${report.metadata.vacancyTitle}`}>
      <Page size="A4" style={styles.page} wrap>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>{report.organizationName}</Text>
          <Text style={styles.title}>Reporte de vacante</Text>
          <Text style={styles.subtitle}>
            Resumen operativo y seguimiento de postulantes para{' '}
            {report.metadata.vacancyTitle}.
          </Text>

          <View style={styles.headerMetaRow}>
            <View style={styles.headerMetaBlock}>
              <Text style={styles.metaLabel}>Vacante</Text>
              <Text style={styles.metaValue}>{report.metadata.vacancyTitle}</Text>
            </View>
            <View style={styles.headerMetaBlock}>
              <Text style={styles.metaLabel}>Fecha de generación</Text>
              <Text style={styles.metaValue}>
                {formatReportDate(report.metadata.generatedAt)}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Resumen general</Text>
          <View style={styles.summaryGrid}>
            <SummaryCard
              label="Total postulantes"
              value={`${report.summary.totalCandidates}`}
              helper="Personas actualmente asociadas a la vacante"
            />
            <SummaryCard
              label="Contratados"
              value={`${report.summary.hiredCandidates}`}
              helper="Candidatos con estado exacto Contratado"
            />
            <SummaryCard
              label="No es el perfil"
              value={`${report.summary.noProfileCandidates}`}
              helper="Postulantes descartados con ese estado exacto"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Datos operativos</Text>
          <View style={styles.detailsGrid}>
            <DetailCard label="Empresa" value={report.metadata.companyName} />
            <DetailCard label="Estado" value={report.metadata.statusName} />
            <DetailCard
              label="Asignado a"
              value={report.metadata.assignedToName}
            />
            <DetailCard
              label="Creación"
              value={formatReportDate(report.metadata.createdAt)}
            />
            <DetailCard
              label="Actualización"
              value={formatReportDate(report.metadata.updatedAt)}
            />
            <DetailCard
              label="Cierre"
              value={formatReportDate(report.metadata.closedAt)}
            />
            {report.metadata.compensation ? (
              <DetailCard
                label="Compensación"
                value={report.metadata.compensation}
              />
            ) : null}
          </View>
        </View>

        {report.description ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Descripción</Text>
            <Text style={styles.descriptionText}>{report.description}</Text>
          </View>
        ) : null}

        {hasProfile ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Perfil buscado</Text>
            <ProfileGroup label="Seniorities" values={report.profile.seniorities} />
            <ProfileGroup label="Áreas" values={report.profile.areas} />
            <ProfileGroup label="Industrias" values={report.profile.industries} />
            <ProfileGroup
              label="Rating mínimo"
              values={report.profile.minStars ? [report.profile.minStars] : []}
            />
            <ProfileGroup
              label="Rango de edad"
              values={report.profile.ageRange ? [report.profile.ageRange] : []}
            />
            <ProfileGroup
              label="Género"
              values={report.profile.gender ? [report.profile.gender] : []}
            />
            <ProfileGroup label="Países" values={report.profile.countries} />
            <ProfileGroup label="Provincias" values={report.profile.provinces} />
            <ProfileGroup label="Idiomas" values={report.profile.languages} />
          </View>
        ) : null}

        {report.hiredCandidates.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Contratado</Text>
            {report.hiredCandidates.map((candidate) => (
              <View key={candidate.id} style={styles.hiredCard} wrap={false}>
                <Text style={styles.hiredName}>{candidate.name}</Text>
                <Text style={styles.hiredMeta}>
                  Estado: {candidate.statusName}
                  {candidate.stars ? ` · Rating: ${candidate.stars}` : ''}
                  {candidate.sourceName ? ` · Fuente: ${candidate.sourceName}` : ''}
                </Text>
              </View>
            ))}
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Postulantes</Text>
          {report.candidates.length > 0 ? (
            <>
              <View style={styles.tableHeaderRow}>
                <Text style={[styles.tableHeaderText, styles.colCandidate]}>
                  Candidato
                </Text>
                <Text style={[styles.tableHeaderText, styles.colStatus]}>
                  Estado
                </Text>
                <Text style={[styles.tableHeaderText, styles.colStars]}>
                  Stars
                </Text>
                <Text style={[styles.tableHeaderText, styles.colSource]}>
                  Fuente
                </Text>
                <Text style={[styles.tableHeaderText, styles.colReason]}>
                  Motivo
                </Text>
              </View>

              {report.candidates.map((candidate, index) => (
                <View
                  key={candidate.id}
                  style={[
                    styles.tableRow,
                    index % 2 === 0 ? styles.tableRowEven : styles.tableRowOdd,
                  ]}
                >
                  <View style={styles.colCandidate}>
                    <Text style={styles.candidateName}>{candidate.name}</Text>
                    <Text style={styles.candidateMeta}>ID {candidate.id}</Text>
                  </View>
                  <Text style={[styles.cellValue, styles.colStatus]}>
                    {candidate.statusName}
                  </Text>
                  <Text style={[styles.cellValue, styles.colStars]}>
                    {candidate.stars || '-'}
                  </Text>
                  <Text style={[styles.cellValue, styles.colSource]}>
                    {candidate.sourceName || '-'}
                  </Text>
                  <Text style={[styles.cellValue, styles.colReason]}>
                    {candidate.rejectionReason || '-'}
                  </Text>
                </View>
              ))}
            </>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateTitle}>
                La vacante no tiene postulantes asociados
              </Text>
              <Text style={styles.emptyStateText}>
                El reporte se generó igualmente para dejar trazabilidad de la
                vacante y sus datos operativos.
              </Text>
            </View>
          )}
        </View>

        <View style={styles.footer} fixed>
          <Text>{report.organizationName}</Text>
          <Text
            render={({ pageNumber, totalPages }) =>
              `Página ${pageNumber} de ${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  );
}

function hasProfileData(report: VacancyReportDocumentData): boolean {
  return (
    report.profile.seniorities.length > 0 ||
    report.profile.areas.length > 0 ||
    report.profile.industries.length > 0 ||
    Boolean(report.profile.minStars) ||
    Boolean(report.profile.ageRange) ||
    Boolean(report.profile.gender) ||
    report.profile.countries.length > 0 ||
    report.profile.provinces.length > 0 ||
    report.profile.languages.length > 0
  );
}

interface SummaryCardProps {
  helper: string;
  label: string;
  value: string;
}

function SummaryCard({ helper, label, value }: SummaryCardProps) {
  return (
    <View style={styles.summaryCard}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
      <Text style={styles.summaryHelper}>{helper}</Text>
    </View>
  );
}

interface DetailCardProps {
  label: string;
  value: string;
}

function DetailCard({ label, value }: DetailCardProps) {
  return (
    <View style={styles.detailCard}>
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={styles.metaValue}>{value}</Text>
    </View>
  );
}

interface ProfileGroupProps {
  label: string;
  values: string[];
}

function ProfileGroup({ label, values }: ProfileGroupProps) {
  if (values.length === 0) {
    return null;
  }

  return (
    <View style={styles.filterGroup}>
      <Text style={styles.metaLabel}>{label}</Text>
      <View style={styles.filterTags}>
        {values.map((value) => (
          <View key={`${label}-${value}`} style={styles.filterTag}>
            <Text style={styles.filterTagText}>{value}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}
