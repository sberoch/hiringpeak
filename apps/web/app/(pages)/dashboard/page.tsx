import Link from "next/link";
import { Metadata } from "next";
import { Briefcase, FileSpreadsheet, Users } from "lucide-react";

import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import { Heading } from "@workspace/ui/components/heading";
import { StatCard } from "@workspace/ui/components/stat-card";
import { VacancyTableHeadless } from "@/components/vacancies/vacancy-table-headless";
import { getMePermissions } from "@/lib/api/auth";
import { getDashboardSummary } from "@/lib/api/dashboard";
import { getAllVacancyStatuses } from "@/lib/api/vacancy-status";
import { auth } from "@/lib/auth";
import { parseJwt } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Dashboard | PRATT FIT",
};

export default async function Dashboard() {
  const session = await auth();
  const token = session?.accessToken ?? "";
  const data = parseJwt(token);
  const permissions = token ? await getMePermissions(token) : null;
  const dashboardData = await getDashboardSummary();
  const spreadsheetUrl = process.env.NEXT_PUBLIC_SPREADSHEET_URL;
  const vacancyStatuses = await getAllVacancyStatuses({ limit: 1e9, page: 1 });

  const openStatus = vacancyStatuses.items.find(
    (status) =>
      status.name.toLowerCase().includes("abierto") ||
      status.name.toLowerCase().includes("abierta") ||
      status.name.toLowerCase().includes("open")
  );
  const closedStatus = vacancyStatuses.items.find(
    (status) =>
      status.name.toLowerCase().includes("cerrado") ||
      status.name.toLowerCase().includes("cubierta") ||
      status.name.toLowerCase().includes("closed") ||
      status.name.toLowerCase().includes("finalizado")
  );

  return (
    <div className="container mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <Heading>¡Hola {data.name}! 👋</Heading>
        {permissions?.roleName && (
          <Badge className="ml-4 bg-[#445cb4]/10 text-[#445cb4] hover:bg-[#445cb4]/10">
            {permissions.roleName}
          </Badge>
        )}
        <Badge className="bg-[#445cb4] hover:bg-[#445cb4]/70">Pratt</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <StatCard
          icon={Briefcase}
          value={dashboardData.activeVacancies}
          label="Busquedas activas"
          monthlyVariation={dashboardData.monthlyVacancies}
        />
        <StatCard
          icon={Users}
          value={dashboardData.activeCandidates}
          label="Postulantes activos"
          monthlyVariation={dashboardData.monthlyCandidates}
        />
        {spreadsheetUrl && (
          <a
            href={spreadsheetUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-blue-50 border border-blue-200 h-fit text-blue-800 rounded-xl
           p-6 shadow-none hover:bg-blue-100/50 transition-colors block"
          >
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <FileSpreadsheet size={24} className="text-blue-600" />
              </div>
              <div className="flex flex-col">
                <div className="font-medium text-base underline">Status</div>
              </div>
            </div>
          </a>
        )}
      </div>
      <div className="mt-10">
        <div className="flex justify-between w-full items-center">
          <h2 className="text-xl font-semibold mb-4">Últimas busquedas</h2>
          <div className="flex gap-2">
            <Link href={`/vacancies?status=${openStatus?.id || "abierta"}`}>
              <Button>Busquedas abiertas</Button>
            </Link>
            <Link href={`/vacancies?status=${closedStatus?.id || "cubierta"}`}>
              <Button>Busquedas cerradas</Button>
            </Link>
            <Link href="/vacancies">
              <Button>Ver todas las busquedas </Button>
            </Link>
          </div>
        </div>
        <VacancyTableHeadless />
      </div>
    </div>
  );
}
