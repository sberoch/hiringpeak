import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getMePermissions } from "@/lib/api/auth";

export const metadata: Metadata = {
  title: {
    default: "Configuración de organización",
    template: "%s | PRATT FIT",
  },
};

const ROLE_MANAGE = "ROLE_MANAGE";
const USER_READ = "USER_READ";

export default async function OrganizationSettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.accessToken) redirect("/login");
  const permissions = await getMePermissions(session.accessToken);
  const canAccess =
    permissions.permissionCodes.includes(ROLE_MANAGE) ||
    permissions.permissionCodes.includes(USER_READ);
  if (!canAccess) redirect("/dashboard");
  return <>{children}</>;
}
