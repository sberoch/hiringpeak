import { Metadata } from "next";
import { DashboardView } from "@/components/dashboard/dashboard-view";
import { getMePermissions } from "@/lib/api/auth";
import { auth } from "@/lib/auth";
import { parseJwt } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function Dashboard() {
  const session = await auth();
  const token = session?.accessToken ?? "";
  const data = parseJwt(token);
  const permissions = token ? await getMePermissions(token) : null;

  const currentHour = new Date().getHours();
  const greeting =
    currentHour < 12
      ? "Buenos días"
      : currentHour < 18
        ? "Buenas tardes"
        : "Buenas noches";

  // Widgets load their own data on the client, so hidden ones load nothing.
  return (
    <DashboardView
      greeting={greeting}
      userName={data.name}
      roleName={permissions?.roleName}
      spreadsheetUrl={process.env.NEXT_PUBLIC_SPREADSHEET_URL}
    />
  );
}
