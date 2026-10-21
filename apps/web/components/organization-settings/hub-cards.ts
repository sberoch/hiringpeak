import { FileText, Palette, Shield, Users, type LucideIcon } from "lucide-react";
import { PermissionCode } from "@workspace/shared/enums";

export type OrganizationSettingsCard = {
  href: string;
  icon: LucideIcon;
  title: string;
  description: string;
};

/** Codes that open the Organization settings hub at all. */
export const ORGANIZATION_SETTINGS_CODES: readonly PermissionCode[] = [
  PermissionCode.USER_READ,
  PermissionCode.ROLE_MANAGE,
  PermissionCode.ORGANIZATION_MANAGE,
];

/** The Organization settings hub cards the caller's Permissions allow. */
export function organizationSettingsCards(
  codes: readonly string[],
): OrganizationSettingsCard[] {
  const has = (code: PermissionCode) => codes.includes(code);
  return [
    ...(has(PermissionCode.USER_READ)
      ? [
          {
            href: "/organization-settings/users",
            icon: Users,
            title: "Usuarios",
            description: "Gestionar usuarios de la organización",
          },
        ]
      : []),
    ...(has(PermissionCode.ROLE_MANAGE)
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
    ...(has(PermissionCode.ORGANIZATION_MANAGE)
      ? [
          {
            href: "/organization-settings/branding",
            icon: Palette,
            title: "Branding",
            description:
              "Logo en la aplicación y en los PDF para clientes, y color de acento de esos PDF",
          },
        ]
      : []),
  ];
}
