"use client";

import {
  Briefcase,
  Building2,
  ChevronRight,
  LayoutDashboard,
  Settings,
  Users
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ComponentProps } from "react";

import { SidebarDialogs } from "@/components/sidebar/dialogs";
import { LogoutButton } from "@/components/sidebar/logout";
import { usePermissions } from "@/contexts/permission-context";
import { DialogsIdsEnum } from "@/lib/consts";
import { PermissionCode } from "@workspace/shared/enums";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@workspace/ui/components/collapsible";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@workspace/ui/components/sidebar";

interface SidebarItem {
  id: string;
  title: string;
  url: string;
  icon: React.ReactNode;
  items?: SidebarSubItem[];
  /** Show item when user has any of these permissions; omit = show to all authenticated. */
  requiredPermissions?: PermissionCode[];
}

interface SidebarSubItem {
  id: string;
  title: string;
  url: string;
  dialogId?: string;
  requiredPermissions?: PermissionCode[];
}

const SIDEBAR_DATA: SidebarItem[] = [
  {
    id: "dashboard",
    title: "Dashboard",
    url: "/dashboard",
    icon: <LayoutDashboard className="w-4 h-4" />,
  },
  {
    id: "candidates",
    title: "Postulantes",
    url: "/candidates",
    icon: <Users className="w-4 h-4" />,
    requiredPermissions: [PermissionCode.CANDIDATE_READ],
  },
  {
    id: "vacancies",
    title: "Vacantes",
    url: "/vacancies",
    icon: <Briefcase className="w-4 h-4" />,
    requiredPermissions: [PermissionCode.VACANCY_READ],
    items: [
      {
        id: "all-vacancies",
        title: "Todas las vacantes",
        url: "/vacancies",
        requiredPermissions: [PermissionCode.VACANCY_READ],
      },
      {
        id: "simulate-vacancy",
        title: "Simular búsqueda",
        url: "#",
        dialogId: DialogsIdsEnum.simulateVacancy,
        requiredPermissions: [PermissionCode.VACANCY_READ],
      },
    ],
  },
  {
    id: "companies",
    title: "Empresas",
    url: "/companies",
    icon: <Building2 className="w-4 h-4" />,
    requiredPermissions: [PermissionCode.COMPANY_READ],
  },
  {
    id: "organization-settings",
    title: "Organización",
    url: "/organization-settings",
    icon: <Building2 className="w-4 h-4" />,
    requiredPermissions: [PermissionCode.SETTINGS_READ],
    items: [
      {
        id: "org-users",
        title: "Usuarios",
        url: "/organization-settings/users",
        requiredPermissions: [PermissionCode.USER_READ, PermissionCode.USER_MANAGE],
      },
      {
        id: "org-roles",
        title: "Roles y permisos",
        url: "/organization-settings/roles",
        requiredPermissions: [PermissionCode.ROLE_MANAGE],
      },
      {
        id: "org-audit-log",
        title: "Registro de auditoría",
        url: "/organization-settings/audit-log",
        requiredPermissions: [PermissionCode.AUDIT_LOG_READ],
      },
    ],
  },
  {
    id: "settings",
    title: "Configuración",
    url: "/settings",
    icon: <Settings className="w-4 h-4" />,
    requiredPermissions: [PermissionCode.SETTINGS_READ],
  },
];

interface SidebarContentProps {
  otherProps: ComponentProps<typeof Sidebar>;
}

export function AppSidebarContent({ otherProps }: SidebarContentProps) {
  const pathname = usePathname();
  const { hasAnyPermission, isLoading } = usePermissions();
  const { ...props } = otherProps;

  const canSee = (requiredPermissions?: PermissionCode[]) =>
    !requiredPermissions?.length || hasAnyPermission(requiredPermissions);

  const isActiveItem = (itemUrl: string) => {
    if (itemUrl === "/dashboard") {
      return pathname === "/dashboard";
    }
    return pathname.startsWith(itemUrl);
  };

  const isActiveSubItem = (subItemUrl: string, parentUrl: string) => {
    if (subItemUrl === "#") return false;
    if (subItemUrl === parentUrl) {
      return pathname === parentUrl;
    }
    return pathname.startsWith(subItemUrl);
  };

  if (isLoading) return null;

  return (
    <Sidebar {...props}>
      <SidebarHeader className="p-0">
        <div className="bg-primary/5 py-6 px-4 flex items-center justify-center border-b border-sidebar-border mb-2">
          <Link href="/dashboard" className="flex items-center justify-center">
            <Image
              src="/images/logo-1.svg"
              alt="PRATT FIT"
              width={100}
              height={100}
              className="hover:scale-105 transition-transform duration-200"
            />
          </Link>
        </div>
      </SidebarHeader>
      <SidebarContent className="gap-0">
        {SIDEBAR_DATA.filter((itm) => canSee(itm.requiredPermissions))
          .map((item) => {
            const isActive = isActiveItem(item.url);
            const hasActiveSubItem = item.items?.some((subItem) =>
              isActiveSubItem(subItem.url, item.url)
            );

            return (
              <Collapsible
                key={item.id}
                title={item.title}
                defaultOpen
                className="group/collapsible px-2 py-1"
              >
                <SidebarGroup className="px-2 py-0">
                  <SidebarGroupLabel
                    asChild
                    className={`group/label text-sm transition-colors relative py-2 ${isActive || hasActiveSubItem
                      ? "bg-primary/5 text-primary border-l-2 border-primary hover:bg-primary/10"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      }`}
                  >
                    {item.items ? (
                      <CollapsibleTrigger>
                        <span className="mr-2">{item.icon}</span>
                        {item.title}
                        <ChevronRight className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90" />
                      </CollapsibleTrigger>
                    ) : (
                      <Link href={item.url}>
                        <span className="mr-2">{item.icon}</span>
                        {item.title}
                      </Link>
                    )}
                  </SidebarGroupLabel>
                  {item.items && (
                    <CollapsibleContent>
                      <SidebarGroupContent>
                        <SidebarMenu>
                          {item.items
                            .filter((subItm) => canSee(subItm.requiredPermissions))
                            .map((subItem) => {
                              return (
                                <SidebarMenuItem key={subItem.id}>
                                  <SidebarMenuButton asChild className="pl-8">
                                    {subItem.dialogId ? (
                                      <Link href={`?action=${subItem.dialogId}`}>
                                        {subItem.title}
                                      </Link>
                                    ) : (
                                      <Link href={subItem.url}>
                                        {subItem.title}
                                      </Link>
                                    )}
                                  </SidebarMenuButton>
                                </SidebarMenuItem>
                              );
                            })}
                        </SidebarMenu>
                      </SidebarGroupContent>
                    </CollapsibleContent>
                  )}
                </SidebarGroup>
              </Collapsible>
            );
          })}
      </SidebarContent>
      <SidebarFooter className="p-0 border-t border-sidebar-border">
        <LogoutButton />
      </SidebarFooter>
      <SidebarRail />
      <SidebarDialogs />
    </Sidebar>
  );
}
