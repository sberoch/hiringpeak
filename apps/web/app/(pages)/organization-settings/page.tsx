import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { getMePermissions } from "@/lib/api/auth";
import { Users, Shield, FileText, Building2, ChevronRight } from "lucide-react";
import { PageHeading } from "@workspace/ui/components/page-heading";
import { PermissionCode } from "@workspace/shared/enums";

export const metadata: Metadata = {
  title: "Configuración de organización",
};

export default async function OrganizationSettingsPage() {
  const session = await auth();
  if (!session?.accessToken) redirect("/login");
  const permissions = await getMePermissions(session.accessToken);
  const canManageRoles = permissions.permissionCodes.includes(PermissionCode.ROLE_MANAGE);
  const canReadUsers = permissions.permissionCodes.includes(PermissionCode.USER_READ);

  if (!canManageRoles && !canReadUsers) redirect("/dashboard");

  const cards = [
    ...(canReadUsers
      ? [
          {
            href: "/organization-settings/users",
            icon: Users,
            title: "Usuarios",
            description: "Gestionar usuarios de la organización",
          },
        ]
      : []),
    ...(canManageRoles
      ? [
          {
            href: "/organization-settings/roles",
            icon: Shield,
            title: "Roles y permisos",
            description: "Gestionar roles y asignar permisos",
          },
          {
            href: "/organization-settings/audit-log",
            icon: FileText,
            title: "Registro de auditoría",
            description: "Ver historial de acciones de la organización",
          },
        ]
      : []),
  ];

  return (
    <div className="flex flex-col mb-12">
      <PageHeading
        icon={Building2}
        title="Configuración de la organización"
        description="Gestiona usuarios, roles y permisos de tu organización."
        className="mb-8"
      />

      {/* Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="group flex items-center gap-4 rounded-2xl border border-brand-border bg-surface p-5 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1 hover:border-electric/20 hover:shadow-[0_8px_24px_-6px_rgba(0,102,255,0.12)]"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-electric/[0.08] text-electric transition-colors duration-300 group-hover:bg-electric group-hover:text-white group-hover:shadow-[0_2px_8px_-2px_rgba(0,102,255,0.4)]">
              <card.icon className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-ink">{card.title}</p>
              <p className="text-xs text-slate-brand mt-0.5">
                {card.description}
              </p>
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-brand transition-transform duration-300 group-hover:translate-x-0.5 group-hover:text-electric" />
          </Link>
        ))}
      </div>
    </div>
  );
}
