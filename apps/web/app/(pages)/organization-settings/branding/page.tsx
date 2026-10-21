import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PermissionCode } from "@workspace/shared/enums";

import { BrandingSettings } from "@/components/organization-settings/branding-settings";
import { getMePermissions } from "@/lib/api/auth";
import { auth } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Branding",
};

export default async function OrganizationBrandingPage() {
  const session = await auth();
  if (!session?.accessToken) redirect("/login");
  const permissions = await getMePermissions(session.accessToken);
  if (
    !permissions.organizationId ||
    !permissions.permissionCodes.includes(PermissionCode.ORGANIZATION_MANAGE)
  ) {
    redirect("/organization-settings");
  }
  return (
    <BrandingSettings
      organizationId={permissions.organizationId}
      organizationName={permissions.organizationName ?? ""}
    />
  );
}
