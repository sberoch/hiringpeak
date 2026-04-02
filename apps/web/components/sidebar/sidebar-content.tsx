"use client";

import {
  Briefcase,
  Building2,
  ChevronRight,
  LayoutDashboard,
  Settings,
  Users,
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

interface SidebarSection {
  label: string;
  items: SidebarItem[];
}

const SIDEBAR_SECTIONS: SidebarSection[] = [
  {
    label: "Espacio de trabajo",
    items: [
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
    ],
  },
  {
    label: "Administración",
    items: [
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
            requiredPermissions: [
              PermissionCode.USER_READ,
              PermissionCode.USER_MANAGE,
            ],
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
    ],
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
        <div className="py-6 px-5 flex items-center border-b border-sidebar-border">
          <Link href="/dashboard" className="flex items-center gap-2.5 group">
            <Image
              src="/images/logo.png"
              alt="HiringPeak"
              width={36}
              height={36}
              className="h-9 w-auto group-hover:scale-105 transition-transform duration-200"
            />
            <span className="font-sans text-lg font-bold tracking-tight text-ink">
              HiringPeak
            </span>
          </Link>
        </div>
      </SidebarHeader>
      <SidebarContent className="gap-0 pt-4 overflow-x-hidden">
        {SIDEBAR_SECTIONS.map((section) => {
          const visibleItems = section.items.filter((itm) =>
            canSee(itm.requiredPermissions),
          );
          if (visibleItems.length === 0) return null;

          return (
            <SidebarGroup key={section.label} className="px-3 py-0 mb-6">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-brand px-3 mb-2">
                {section.label}
              </p>
              <SidebarGroupContent>
                {visibleItems.map((item) => {
                  const isActive = isActiveItem(item.url);
                  const hasActiveSubItem = item.items?.some((subItem) =>
                    isActiveSubItem(subItem.url, item.url),
                  );

                  return (
                    <Collapsible
                      key={item.id}
                      title={item.title}
                      defaultOpen
                      className="group/collapsible py-0.5"
                    >
                      <SidebarGroupLabel
                        asChild
                        className={`group/label w-full text-[13px] font-medium transition-all duration-200 relative rounded-lg px-3 py-2.5 ${
                          isActive || hasActiveSubItem
                            ? "bg-sidebar-primary/10 text-sidebar-primary font-semibold"
                            : "text-slate-brand hover:bg-sidebar-accent hover:text-sidebar-foreground"
                        }`}
                      >
                        {item.items ? (
                          <CollapsibleTrigger>
                            <span className="mr-2.5 opacity-80">
                              {item.icon}
                            </span>
                            {item.title}
                            <ChevronRight className="ml-auto w-3.5 h-3.5 opacity-50 transition-transform group-data-[state=open]/collapsible:rotate-90" />
                          </CollapsibleTrigger>
                        ) : (
                          <Link href={item.url}>
                            <span className="mr-2.5 opacity-80">
                              {item.icon}
                            </span>
                            {item.title}
                          </Link>
                        )}
                      </SidebarGroupLabel>
                      {item.items && (
                        <CollapsibleContent>
                          <SidebarMenu className="mt-1">
                            {item.items
                              .filter((subItm) =>
                                canSee(subItm.requiredPermissions),
                              )
                              .map((subItem) => {
                                const isSubActive = isActiveSubItem(
                                  subItem.url,
                                  item.url,
                                );
                                return (
                                  <SidebarMenuItem key={subItem.id}>
                                    <SidebarMenuButton
                                      asChild
                                      className={`text-[13px] rounded-md pl-10 pr-3 py-2 transition-all duration-200 ${
                                        isSubActive
                                          ? "text-sidebar-primary font-medium bg-sidebar-primary/5"
                                          : "text-slate-brand hover:text-sidebar-foreground hover:bg-sidebar-accent"
                                      }`}
                                    >
                                      {subItem.dialogId ? (
                                        <Link
                                          href={`?action=${subItem.dialogId}`}
                                        >
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
                        </CollapsibleContent>
                      )}
                    </Collapsible>
                  );
                })}
              </SidebarGroupContent>
            </SidebarGroup>
          );
        })}
      </SidebarContent>
      <SidebarFooter className="p-0 border-t border-sidebar-border shrink-0">
        <LogoutButton />
      </SidebarFooter>
      <SidebarRail />
      <SidebarDialogs />
    </Sidebar>
  );
}
