import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getMePermissions } from "@/lib/api/auth";
import { ORGANIZATION_SETTINGS_CODES } from "@/components/organization-settings/hub-cards";

export const metadata: Metadata = {
  title: {
    default: "Configuración de organización",
    template: "%s | HiringPeak",
  },
};

export default async function OrganizationSettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.accessToken) redirect("/login");
  const permissions = await getMePermissions(session.accessToken);
  const canAccess = ORGANIZATION_SETTINGS_CODES.some((code) =>
    permissions.permissionCodes.includes(code),
  );
  if (!canAccess) redirect("/dashboard");
  return <>{children}</>;
}
