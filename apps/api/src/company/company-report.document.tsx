import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
} from '@react-pdf/renderer';
import type { CompanyReportDocumentData } from './company-report.types';
import {
  formatReportCurrency,
  formatReportDate,
  formatReportDecimal,
  formatReportPercentage,
} from './company-report.utils';

interface CompanyReportDocumentProps {
  report: CompanyReportDocumentData;
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
  contactSection: {
    marginBottom: 18,
    padding: 16,
    borderRadius: 14,
    backgroundColor: '#f8fbff',
    border: '1 solid #dbeafe',
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 700,
    color: '#0a0f1c',
    marginBottom: 10,
  },
  contactRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  contactBlock: {
    width: '31%',
  },
  contactValue: {
    fontSize: 10,
    fontWeight: 600,
    color: '#1a2332',
  },
  summarySection: {
    marginBottom: 18,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  summaryCard: {
    width: '48.2%',
    padding: 14,
    marginBottom: 12,
    borderRadius: 14,
    backgroundColor: '#ffffff',
    border: '1 solid #e2e8f0',
  },
  summaryLabel: {
    fontSize: 8,
    fontWeight: 600,
    textTransform: 'uppercase',
    color: '#94a3b8',
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
  tableSection: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    border: '1 solid #e2e8f0',
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
  tableTotalsRow: {
    flexDirection: 'row',
    marginTop: 10,
    paddingTop: 10,
    borderTop: '1 solid #e2e8f0',
  },
  colVacancy: {
    width: '37%',
    paddingRight: 10,
  },
  colPeople: {
    width: '12%',
    textAlign: 'right',
  },
  colCancelled: {
    width: '15%',
    textAlign: 'right',
  },
  colRate: {
    width: '16%',
    textAlign: 'right',
  },
  colAmount: {
    width: '20%',
    textAlign: 'right',
  },
  tableHeaderText: {
    fontSize: 8,
    fontWeight: 700,
    textTransform: 'uppercase',
    color: '#64748b',
    letterSpacing: 0.7,
  },
  vacancyTitle: {
    fontSize: 10,
    fontWeight: 600,
    color: '#0a0f1c',
    marginBottom: 3,
  },
  vacancyStatus: {
    fontSize: 8,
    color: '#64748b',
  },
  cellValue: {
    fontSize: 10,
    fontWeight: 600,
    color: '#1a2332',
  },
  totalsLabel: {
    fontSize: 10,
    fontWeight: 700,
    color: '#0a0f1c',
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

export function CompanyReportDocument({
  report,
}: CompanyReportDocumentProps) {
  const hasContactInfo =
    Boolean(report.contactInfo.clientName) ||
    Boolean(report.contactInfo.clientEmail) ||
    Boolean(report.contactInfo.clientPhone);

  return (
    <Document title={`Reporte de ${report.companyName}`}>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>{report.organizationName}</Text>
          <Text style={styles.title}>Reporte de vacantes por empresa</Text>
          <Text style={styles.subtitle}>
            Resumen operativo de vacantes, volumen de personas y cancelaciones
            actuales de {report.companyName}.
          </Text>

          <View style={styles.headerMetaRow}>
            <View style={styles.headerMetaBlock}>
              <Text style={styles.metaLabel}>Empresa</Text>
              <Text style={styles.metaValue}>{report.companyName}</Text>
            </View>
            <View style={styles.headerMetaBlock}>
              <Text style={styles.metaLabel}>Fecha de generación</Text>
              <Text style={styles.metaValue}>
                {formatReportDate(report.generatedAt)}
              </Text>
            </View>
          </View>
        </View>

        {hasContactInfo ? (
          <View style={styles.contactSection}>
            <Text style={styles.sectionTitle}>Datos del cliente</Text>
            <View style={styles.contactRow}>
              {report.contactInfo.clientName ? (
                <View style={styles.contactBlock}>
                  <Text style={styles.metaLabel}>Cliente</Text>
                  <Text style={styles.contactValue}>
                    {report.contactInfo.clientName}
                  </Text>
                </View>
              ) : null}
              {report.contactInfo.clientEmail ? (
                <View style={styles.contactBlock}>
                  <Text style={styles.metaLabel}>Email</Text>
                  <Text style={styles.contactValue}>
                    {report.contactInfo.clientEmail}
                  </Text>
                </View>
              ) : null}
              {report.contactInfo.clientPhone ? (
                <View style={styles.contactBlock}>
                  <Text style={styles.metaLabel}>Teléfono</Text>
                  <Text style={styles.contactValue}>
                    {report.contactInfo.clientPhone}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>
        ) : null}

        <View style={styles.summarySection}>
          <Text style={styles.sectionTitle}>Resumen general</Text>
          <View style={styles.summaryGrid}>
            <SummaryCard
              label="Total de vacantes"
              value={`${report.summary.totalVacancies}`}
              helper="Cantidad total de vacantes incluidas en el reporte"
            />
            <SummaryCard
              label="Total de personas"
              value={`${report.summary.totalPeople}`}
              helper="Personas actualmente asociadas a las vacantes"
            />
            <SummaryCard
              label="Promedio por vacante"
              value={formatReportDecimal(
                report.summary.averagePeoplePerVacancy,
              )}
              helper="Media de personas por vacante"
            />
            <SummaryCard
              label="% canceladas global"
              value={formatReportPercentage(
                report.summary.globalCancellationRate,
              )}
              helper={`${report.summary.totalCancelledPeople} personas canceladas sobre el total`}
            />
            <SummaryCard
              label="Monto total estimado"
              value={formatReportCurrency(report.summary.totalEstimatedAmount)}
              helper="Calculado con un monto fijo mockeado por vacante"
            />
          </View>
        </View>

        <View style={styles.tableSection}>
          <Text style={styles.sectionTitle}>Detalle por vacante</Text>
          {report.vacancies.length > 0 ? (
            <>
              <View style={styles.tableHeaderRow}>
                <Text style={[styles.tableHeaderText, styles.colVacancy]}>
                  Vacante
                </Text>
                <Text style={[styles.tableHeaderText, styles.colPeople]}>
                  Personas
                </Text>
                <Text style={[styles.tableHeaderText, styles.colCancelled]}>
                  Canceladas
                </Text>
                <Text style={[styles.tableHeaderText, styles.colRate]}>
                  % canceladas
                </Text>
                <Text style={[styles.tableHeaderText, styles.colAmount]}>
                  Monto estimado
                </Text>
              </View>

              {report.vacancies.map((vacancy, index) => (
                <View
                  key={vacancy.id}
                  style={[
                    styles.tableRow,
                    index % 2 === 0 ? styles.tableRowEven : styles.tableRowOdd,
                  ]}
                  wrap={false}
                >
                  <View style={styles.colVacancy}>
                    <Text style={styles.vacancyTitle}>{vacancy.title}</Text>
                    <Text style={styles.vacancyStatus}>
                      Estado: {vacancy.statusName}
                    </Text>
                  </View>
                  <Text style={[styles.cellValue, styles.colPeople]}>
                    {vacancy.peopleCount}
                  </Text>
                  <Text style={[styles.cellValue, styles.colCancelled]}>
                    {vacancy.cancelledCount}
                  </Text>
                  <Text style={[styles.cellValue, styles.colRate]}>
                    {formatReportPercentage(vacancy.cancellationRate)}
                  </Text>
                  <Text style={[styles.cellValue, styles.colAmount]}>
                    {formatReportCurrency(vacancy.estimatedAmount)}
                  </Text>
                </View>
              ))}

              <View style={styles.tableTotalsRow} wrap={false}>
                <Text style={[styles.totalsLabel, styles.colVacancy]}>
                  Totales
                </Text>
                <Text style={[styles.totalsLabel, styles.colPeople]}>
                  {report.summary.totalPeople}
                </Text>
                <Text style={[styles.totalsLabel, styles.colCancelled]}>
                  {report.summary.totalCancelledPeople}
                </Text>
                <Text style={[styles.totalsLabel, styles.colRate]}>
                  {formatReportPercentage(report.summary.globalCancellationRate)}
                </Text>
                <Text style={[styles.totalsLabel, styles.colAmount]}>
                  {formatReportCurrency(report.summary.totalEstimatedAmount)}
                </Text>
              </View>
            </>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateTitle}>
                La empresa no tiene vacantes asociadas
              </Text>
              <Text style={styles.emptyStateText}>
                El reporte se generó igualmente para dejar trazabilidad de la
                empresa y mostrar el resumen general en cero.
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

interface SummaryCardProps {
  label: string;
  value: string;
  helper: string;
}

function SummaryCard({ label, value, helper }: SummaryCardProps) {
  return (
    <View style={styles.summaryCard}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
      <Text style={styles.summaryHelper}>{helper}</Text>
    </View>
  );
}
