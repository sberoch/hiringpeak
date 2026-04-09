"use client";

import {
  Briefcase,
  Building2,
  ChevronLeft,
  ChevronRight,
  Landmark,
  LayoutDashboard,
  LogOut,
  Settings,
  Users,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { ComponentProps } from "react";

import { SidebarDialogs } from "@/components/sidebar/dialogs";
import { usePermissions } from "@/contexts/permission-context";
import { DialogsIdsEnum, REDIRECT_UNAUTHORIZED } from "@/lib/consts";
import { PermissionCode } from "@workspace/shared/enums";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@workspace/ui/components/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  useSidebar,
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
        icon: <Landmark className="w-4 h-4" />,
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

const activeNavClass =
  "data-[active=true]:bg-sidebar-primary/10 data-[active=true]:text-sidebar-primary data-[active=true]:font-semibold";

interface SidebarContentProps {
  otherProps: ComponentProps<typeof Sidebar>;
}

export function AppSidebarContent({ otherProps }: SidebarContentProps) {
  const pathname = usePathname();
  const { hasAnyPermission, isLoading } = usePermissions();
  const { collapsible = "icon", ...sidebarProps } = otherProps;
  const { toggleSidebar, state, isMobile, openMobile } = useSidebar();
  const showIconOnly = !isMobile && state === "collapsed";
  /** Desktop: expanded sidebar; mobile: sheet open (open state alone is cookie/desktop). */
  const sidebarUiExpanded = isMobile ? openMobile : state === "expanded";

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
    <Sidebar collapsible={collapsible} {...sidebarProps}>
      <SidebarHeader className="p-0">
        <div className="flex items-center border-b border-sidebar-border px-5 py-6 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-2 group-data-[collapsible=icon]:py-4">
          <Link
            href="/dashboard"
            className="group flex items-center gap-2.5 group-data-[collapsible=icon]:gap-0"
          >
            <Image
              src="/images/logo.png"
              alt="HiringPeak"
              width={36}
              height={36}
              className="h-9 w-auto transition-transform duration-200 group-hover:scale-105 group-data-[collapsible=icon]:h-8 group-data-[collapsible=icon]:w-8 group-data-[collapsible=icon]:object-contain"
            />
            <span className="font-sans text-lg font-bold tracking-tight text-ink group-data-[collapsible=icon]:sr-only">
              HiringPeak
            </span>
          </Link>
        </div>
      </SidebarHeader>
      <SidebarContent className="gap-0 overflow-x-hidden pt-4 group-data-[collapsible=icon]:pt-2">
        {SIDEBAR_SECTIONS.map((section) => {
          const visibleItems = section.items.filter((itm) =>
            canSee(itm.requiredPermissions),
          );
          if (visibleItems.length === 0) return null;

          return (
            <SidebarGroup
              key={section.label}
              className="mb-6 px-3 py-0 group-data-[collapsible=icon]:px-0"
            >
              <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-widest text-muted-brand group-data-[collapsible=icon]:hidden">
                {section.label}
              </p>
              <SidebarGroupContent>
                <SidebarMenu className="group-data-[collapsible=icon]:items-center">
                  {visibleItems.map((item) => {
                    const isActive = isActiveItem(item.url);
                    const hasActiveSubItem = item.items?.some((subItem) =>
                      isActiveSubItem(subItem.url, item.url),
                    );
                    const parentActive = isActive || hasActiveSubItem;
                    const visibleSubItems =
                      item.items?.filter((subItm) =>
                        canSee(subItm.requiredPermissions),
                      ) ?? [];

                    if (!item.items?.length) {
                      return (
                        <SidebarMenuItem key={item.id}>
                          <SidebarMenuButton
                            asChild
                            isActive={isActive}
                            tooltip={item.title}
                            className={activeNavClass}
                          >
                            <Link href={item.url}>
                              {item.icon}
                              <span>{item.title}</span>
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      );
                    }

                    if (showIconOnly) {
                      return (
                        <SidebarMenuItem key={item.id}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <SidebarMenuButton
                                isActive={parentActive}
                                tooltip={item.title}
                                className={activeNavClass}
                              >
                                {item.icon}
                                <span>{item.title}</span>
                              </SidebarMenuButton>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              className="w-56"
                              side="right"
                              align="start"
                            >
                              {visibleSubItems.map((subItem) =>
                                subItem.dialogId ? (
                                  <DropdownMenuItem key={subItem.id} asChild>
                                    <Link
                                      href={`?action=${subItem.dialogId}`}
                                    >
                                      {subItem.title}
                                    </Link>
                                  </DropdownMenuItem>
                                ) : (
                                  <DropdownMenuItem key={subItem.id} asChild>
                                    <Link href={subItem.url}>
                                      {subItem.title}
                                    </Link>
                                  </DropdownMenuItem>
                                ),
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </SidebarMenuItem>
                      );
                    }

                    return (
                      <SidebarMenuItem key={item.id}>
                        <Collapsible
                          defaultOpen
                          className="group/collapsible min-w-0 w-full"
                        >
                          <CollapsibleTrigger asChild>
                            <SidebarMenuButton
                              isActive={parentActive}
                              className={activeNavClass}
                            >
                              {item.icon}
                              <span className="truncate">{item.title}</span>
                              <ChevronRight className="ml-auto h-3.5 w-3.5 shrink-0 opacity-50 transition-transform group-data-[state=open]/collapsible:rotate-90" />
                            </SidebarMenuButton>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <SidebarMenuSub>
                              {visibleSubItems.map((subItem) => {
                                const isSubActive = isActiveSubItem(
                                  subItem.url,
                                  item.url,
                                );
                                return (
                                  <SidebarMenuSubItem key={subItem.id}>
                                    <SidebarMenuSubButton
                                      asChild
                                      isActive={isSubActive}
                                      className={
                                        isSubActive
                                          ? "bg-sidebar-primary/5 font-medium text-sidebar-primary"
                                          : "text-slate-brand hover:bg-sidebar-accent hover:text-sidebar-foreground"
                                      }
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
                                    </SidebarMenuSubButton>
                                  </SidebarMenuSubItem>
                                );
                              })}
                            </SidebarMenuSub>
                          </CollapsibleContent>
                        </Collapsible>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          );
        })}
      </SidebarContent>

      <SidebarFooter className="shrink-0 gap-0 border-t border-sidebar-border p-0">
        <SidebarMenu className="px-2 py-3 group-data-[collapsible=icon]:px-1">
          <SidebarMenuItem>
            {sidebarUiExpanded ? (
              <SidebarMenuButton
                type="button"
                onClick={toggleSidebar}
                aria-expanded
                tooltip="Colapsar menú"
                className="text-slate-brand hover:bg-sidebar-accent hover:text-sidebar-foreground"
              >
                <span className="min-w-0 flex-1 truncate text-left text-[13px] font-medium group-data-[collapsible=icon]:hidden">
                  Colapsar menú
                </span>
                <ChevronLeft
                  className="ml-auto h-4 w-4 shrink-0 opacity-70 group-data-[collapsible=icon]:hidden"
                  aria-hidden
                />
              </SidebarMenuButton>
            ) : (
              <SidebarMenuButton
                type="button"
                onClick={toggleSidebar}
                aria-expanded={false}
                tooltip="Expandir menú"
                className="text-slate-brand hover:bg-sidebar-accent hover:text-sidebar-foreground"
              >
                <ChevronRight className="h-4 w-4 opacity-70" aria-hidden />
                <span className="sr-only">Expandir menú</span>
              </SidebarMenuButton>
            )}
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              type="button"
              tooltip="Cerrar sesión"
              className="text-slate-brand hover:bg-red-50/80 hover:text-red-600"
              onClick={() => {
                signOut({
                  callbackUrl: `${window.location.origin}${REDIRECT_UNAUTHORIZED}`,
                });
              }}
            >
              <LogOut className="h-4 w-4 transition-transform duration-200 group-hover:scale-105" />
              <span className="text-[13px] font-medium">Cerrar sesión</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
      <SidebarDialogs />
    </Sidebar>
  );
}
