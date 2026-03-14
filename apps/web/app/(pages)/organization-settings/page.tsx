import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { getMePermissions } from "@/lib/api/auth";
import { Heading } from "@workspace/ui/components/heading";
import { Users, Shield, FileText } from "lucide-react";
import { PermissionCode } from "@workspace/shared/enums";


export default async function OrganizationSettingsPage() {
  const session = await auth();
  if (!session?.accessToken) redirect("/login");
  const permissions = await getMePermissions(session.accessToken);
  const canManageRoles = permissions.permissionCodes.includes(PermissionCode.ROLE_MANAGE);
  const canReadUsers = permissions.permissionCodes.includes(PermissionCode.USER_READ);

  if (!canManageRoles && !canReadUsers) redirect("/dashboard");

  return (
    <div className="container flex flex-col gap-6">
      <Heading>Configuración de la organización</Heading>
      <div className="grid gap-4 md:grid-cols-2">
        {canReadUsers && (
          <Link
            href="/organization-settings/users"
            className="flex items-center gap-3 rounded-lg border p-4 transition-colors hover:bg-muted/50"
          >
            <Users className="h-8 w-8" />
            <div>
              <p className="font-medium">Usuarios</p>
              <p className="text-sm text-muted-foreground">
                Gestionar usuarios de la organización
              </p>
            </div>
          </Link>
        )}
        {canManageRoles && (
          <Link
            href="/organization-settings/roles"
            className="flex items-center gap-3 rounded-lg border p-4 transition-colors hover:bg-muted/50"
          >
            <Shield className="h-8 w-8" />
            <div>
              <p className="font-medium">Roles y permisos</p>
              <p className="text-sm text-muted-foreground">
                Gestionar roles y asignar permisos
              </p>
            </div>
          </Link>
        )}
        {canManageRoles && (
          <Link
            href="/organization-settings/audit-log"
            className="flex items-center gap-3 rounded-lg border p-4 transition-colors hover:bg-muted/50"
          >
            <FileText className="h-8 w-8" />
            <div>
              <p className="font-medium">Registro de auditoría</p>
              <p className="text-sm text-muted-foreground">
                Ver historial de acciones de la organización
              </p>
            </div>
          </Link>
        )}
      </div>
    </div>
  );
}
