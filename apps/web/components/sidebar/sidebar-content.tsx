"use client";

import { ComponentProps } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Briefcase,
  Building2,
  ChevronRight,
  LayoutDashboard,
  Settings,
  UserCircle,
  Users,
} from "lucide-react";

import { SidebarDialogs } from "@/components/sidebar/dialogs";
import { LogoutButton } from "@/components/sidebar/logout";
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
import { DialogsIdsEnum, PAGE_AUTHORIZATION_ACCESS } from "@/lib/consts";
import { UserRoleEnum } from "@workspace/shared/types/user";

interface SidebarItem {
  id: string;
  title: string;
  url: string;
  icon: React.ReactNode;
  items?: SidebarSubItem[];
  visibleTo: UserRoleEnum[];
}

interface SidebarSubItem {
  id: string;
  title: string;
  url: string;
  dialogId?: string;
  visibleTo: UserRoleEnum[];
}

const data: SidebarItem[] = [
  {
    id: "dashboard",
    title: "Dashboard",
    url: "/dashboard",
    icon: <LayoutDashboard className="w-4 h-4" />,
    visibleTo: PAGE_AUTHORIZATION_ACCESS["/dashboard"],
  },
  {
    id: "candidates",
    title: "Postulantes",
    url: "/candidates",
    icon: <Users className="w-4 h-4" />,
    visibleTo: PAGE_AUTHORIZATION_ACCESS["/candidates"],
  },
  {
    id: "vacancies",
    title: "Vacantes",
    url: "/vacancies",
    icon: <Briefcase className="w-4 h-4" />,
    visibleTo: PAGE_AUTHORIZATION_ACCESS["/vacancies"],
    items: [
      {
        id: "all-vacancies",
        title: "Todas las vacantes",
        url: "/vacancies",
        visibleTo: PAGE_AUTHORIZATION_ACCESS["/vacancies"],
      },
      {
        id: "simulate-vacancy",
        title: "Simular búsqueda",
        url: "#",
        dialogId: DialogsIdsEnum.simulateVacancy,
        visibleTo: [UserRoleEnum.ADMIN, UserRoleEnum.MANAGER, UserRoleEnum.BASIC],
      },
    ],
  },
  {
    id: "companies",
    title: "Empresas",
    url: "/companies",
    icon: <Building2 className="w-4 h-4" />,
    visibleTo: PAGE_AUTHORIZATION_ACCESS["/companies"],
  },
  {
    id: "organization-settings",
    title: "Organización",
    url: "/organization-settings",
    icon: <Building2 className="w-4 h-4" />,
    visibleTo: PAGE_AUTHORIZATION_ACCESS["/organization-settings"] ?? [UserRoleEnum.ADMIN],
    items: [
      {
        id: "org-users",
        title: "Usuarios",
        url: "/organization-settings/users",
        visibleTo: PAGE_AUTHORIZATION_ACCESS["/organization-settings/users"] ?? [UserRoleEnum.ADMIN, UserRoleEnum.MANAGER],
      },
      {
        id: "org-roles",
        title: "Roles y permisos",
        url: "/organization-settings/roles",
        visibleTo: PAGE_AUTHORIZATION_ACCESS["/organization-settings/roles"] ?? [UserRoleEnum.ADMIN],
      },
    ],
  },
  {
    id: "settings",
    title: "Configuración",
    url: "/settings",
    icon: <Settings className="w-4 h-4" />,
    visibleTo: PAGE_AUTHORIZATION_ACCESS["/settings"],
  },
];

interface SidebarContentProps {
  role: UserRoleEnum;
  otherProps: ComponentProps<typeof Sidebar>;
}

export function AppSidebarContent({ role, otherProps }: SidebarContentProps) {
  const pathname = usePathname();
  const { ...props } = otherProps;

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
        {data
          .filter((itm) => itm.visibleTo.includes(role))
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
                            .filter((itm) => itm.visibleTo.includes(role))
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
