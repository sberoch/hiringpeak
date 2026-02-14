import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getMePermissions } from "@/lib/api/auth";

const VACANCY_READ = "VACANCY_READ";

export default async function VacanciesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.accessToken) {
    redirect("/login");
  }
  const permissions = await getMePermissions(session.accessToken);
  if (!permissions.permissionCodes.includes(VACANCY_READ)) {
    redirect("/dashboard");
  }
  return <>{children}</>;
}
