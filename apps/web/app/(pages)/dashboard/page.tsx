import { Metadata } from "next";
import { ExternalLink, FileSpreadsheet, TrendingUp } from "lucide-react";
import { LatestVacancies } from "@/components/vacancies/latest-vacancies";
import { LatestCandidates } from "@/components/candidates/latest-candidates";
import { DashboardStatCards } from "@/components/dashboard/dashboard-stat-cards";
import { DueSoonWidget } from "@/components/dashboard/due-soon-widget";
import { TeamPerformanceTable } from "@/components/dashboard/team-performance";
import { getMePermissions } from "@/lib/api/auth";
import { getDashboardSummary } from "@/lib/api/dashboard";
import { getAllVacancyStatuses } from "@/lib/api/vacancy-status";
import { auth } from "@/lib/auth";
import { parseJwt } from "@/lib/utils";
import { hasCommercialAccess } from "@workspace/shared/lib/commercial-access";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function Dashboard() {
  const session = await auth();
  const token = session?.accessToken ?? "";
  const data = parseJwt(token);
  const permissions = token ? await getMePermissions(token) : null;
  const dashboardData = await getDashboardSummary();
  const spreadsheetUrl = process.env.NEXT_PUBLIC_SPREADSHEET_URL;
  const vacancyStatuses = await getAllVacancyStatuses({ limit: 1e9, page: 1 });

  const openStatus = vacancyStatuses.items.find((status) => !status.isFinal);
  const closedStatus = vacancyStatuses.items.find((status) => status.isFinal);

  const currentHour = new Date().getHours();
  const greeting =
    currentHour < 12
      ? "Buenos días"
      : currentHour < 18
        ? "Buenas tardes"
        : "Buenas noches";

  return (
    <div className="flex flex-col gap-6">
      {/* Hero header */}
      <div className="relative overflow-hidden rounded-2xl border border-brand-border bg-surface p-6">
        {/* Subtle background orbs */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-electric/[0.04] blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-teal/[0.04] blur-3xl" />

        <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-electric text-white shadow-[0_4px_12px_-2px_rgba(0,102,255,0.35)]">
              <TrendingUp className="h-5 w-5" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-ink">
                {greeting}, {data.name}
              </h1>
              <p className="mt-0.5 text-sm text-slate-brand">
                Resumen de tu actividad
                {permissions?.roleName && (
                  <span className="ml-2 inline-flex items-center rounded-md bg-electric/[0.08] px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-electric">
                    {permissions.roleName}
                  </span>
                )}
              </p>
            </div>
          </div>

          {spreadsheetUrl && (
            <a
              href={spreadsheetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-brand-border bg-canvas px-4 py-2.5 text-sm font-semibold text-ink transition-all hover:border-electric/30 hover:shadow-[0_2px_8px_-2px_rgba(0,102,255,0.15)] group"
            >
              <FileSpreadsheet className="h-4 w-4 text-teal" />
              Ver spreadsheet
              <ExternalLink className="h-3 w-3 text-muted-brand transition-colors group-hover:text-electric" />
            </a>
          )}
        </div>
      </div>

      {/* Stat cards */}
      <DashboardStatCards data={dashboardData} />

      {/* Analytics on the left; the user's own tasks and recent arrivals on a sticky rail */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="flex min-w-0 flex-col gap-6">
          <TeamPerformanceTable
            currentUserId={data.id}
            permissionCodes={permissions?.permissionCodes ?? []}
            commercialAccess={hasCommercialAccess(
              permissions?.permissionCodes ?? [],
            )}
          />
          <LatestVacancies
            openStatusId={openStatus?.id}
            closedStatusId={closedStatus?.id}
          />
        </div>

        <aside className="flex min-w-0 flex-col gap-6 xl:sticky xl:top-6 xl:self-start">
          <DueSoonWidget />
          <LatestCandidates />
        </aside>
      </div>
    </div>
  );
}
