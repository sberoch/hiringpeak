"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Layers,
  TrendingUp,
  Factory,
  Radio,
  ClipboardList,
  UserCheck,
  XCircle,
  GitBranch,
  CircleOff,
  Tag,
  type LucideIcon,
} from "lucide-react";

import { usePermissions } from "@/contexts/permission-context";
import { PermissionCode } from "@workspace/shared/enums";

type SettingsNavItem = { href: string; label: string; icon: LucideIcon };

const settingsNav: SettingsNavItem[] = [
  { href: "/settings/areas", label: "Áreas", icon: Layers },
  { href: "/settings/seniorities", label: "Seniority", icon: TrendingUp },
  { href: "/settings/industries", label: "Industrias", icon: Factory },
  { href: "/settings/sources", label: "Fuentes", icon: Radio },
  { href: "/settings/vacancy-statuses", label: "Estados de vacante", icon: ClipboardList },
  { href: "/settings/candidate-statuses", label: "Estados de candidato", icon: UserCheck },
  { href: "/settings/rejection-reasons", label: "Motivos de rechazo", icon: XCircle },
];

/** «Comercial» group: only for users with CRM_MANAGE. */
const commercialNav: SettingsNavItem[] = [
  { href: "/settings/opportunity-stages", label: "Etapas de oportunidad", icon: GitBranch },
  { href: "/settings/lost-reasons", label: "Motivos de pérdida", icon: CircleOff },
  { href: "/settings/contact-sources", label: "Orígenes de contacto", icon: Tag },
];

function SettingsNavList({ items }: { items: SettingsNavItem[] }) {
  const pathname = usePathname();

  return (
    <ul className="space-y-0.5">
      {items.map((item) => {
        const isActive = pathname === item.href;
        const Icon = item.icon;

        return (
          <li key={item.href}>
            <Link
              href={item.href}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]
                ${
                  isActive
                    ? "bg-electric/[0.08] text-electric shadow-[inset_0_0_0_1px_rgba(0,102,255,0.12)]"
                    : "text-slate-brand hover:text-ink hover:bg-brand-border-light/70"
                }
              `}
            >
              <div
                className={`
                  flex h-7 w-7 shrink-0 items-center justify-center rounded-lg
                  transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]
                  ${
                    isActive
                      ? "bg-electric text-white shadow-[0_2px_8px_-2px_rgba(0,102,255,0.4)]"
                      : "bg-brand-border-light text-slate-brand group-hover:bg-brand-border"
                  }
                `}
              >
                <Icon className="h-3.5 w-3.5" />
              </div>
              {item.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function SettingsNavGroup({
  label,
  items,
}: {
  label: string;
  items: SettingsNavItem[];
}) {
  return (
    <>
      <div className="mx-3 mb-1.5 mt-4 flex items-center gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-brand">
          {label}
        </span>
        <span className="h-px flex-1 bg-brand-border" />
      </div>
      <SettingsNavList items={items} />
    </>
  );
}

export function SettingsSidebar() {
  const { hasPermission } = usePermissions();

  return (
    <nav className="w-[240px] shrink-0">
      <div className="sticky top-6 rounded-2xl border border-brand-border bg-surface p-2 shadow-[0_1px_3px_rgba(0,0,0,0.04)] min-h-[calc(100vh-10rem)]">
        <SettingsNavList items={settingsNav} />
        {hasPermission(PermissionCode.CRM_MANAGE) && (
          <SettingsNavGroup label="Comercial" items={commercialNav} />
        )}
      </div>
    </nav>
  );
}
