"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Building2, LogOut, ShieldCheck } from "lucide-react";

import { Button } from "@workspace/ui/components/button";
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
} from "@workspace/ui/components/sidebar";
import { REDIRECT_UNAUTHORIZED } from "@/lib/consts";
import { useSession } from "next-auth/react";

const navItems = [
  { href: "/organizations", label: "Organizaciones", icon: Building2 },
  { href: "/permissions", label: "Permisos", icon: ShieldCheck },
] as const;

export function AppSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <span className="text-sm font-semibold text-sidebar-foreground">
          Backoffice
        </span>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map(({ href, label, icon: Icon }) => (
                <SidebarMenuItem key={href}>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === href || pathname.startsWith(`${href}/`)}
                    tooltip={label}
                  >
                    <Link href={href}>
                      <Icon className="size-4" />
                      <span>{label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border p-2">
        <div className="flex flex-col gap-2">
          {session?.user?.email && (
            <p className="truncate px-2 text-xs text-muted-foreground" title={session.user.email}>
              {session.user.email}
            </p>
          )}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2"
            onClick={() =>
              signOut({
                callbackUrl: `${typeof window !== "undefined" ? window.location.origin : ""}${REDIRECT_UNAUTHORIZED}`,
              })
            }
          >
            <LogOut className="size-4" />
            Cerrar sesión
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
