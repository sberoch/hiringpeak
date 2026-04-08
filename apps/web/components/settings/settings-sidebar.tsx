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
} from "lucide-react";

const settingsNav = [
  { href: "/settings/areas", label: "Áreas", icon: Layers },
  { href: "/settings/seniorities", label: "Seniority", icon: TrendingUp },
  { href: "/settings/industries", label: "Industrias", icon: Factory },
  { href: "/settings/sources", label: "Fuentes", icon: Radio },
  { href: "/settings/vacancy-statuses", label: "Estados de vacante", icon: ClipboardList },
  { href: "/settings/candidate-statuses", label: "Estados de candidato", icon: UserCheck },
];

export function SettingsSidebar() {
  const pathname = usePathname();

  return (
    <nav className="w-[240px] shrink-0">
      <div className="sticky top-6 rounded-2xl border border-brand-border bg-surface p-2 shadow-[0_1px_3px_rgba(0,0,0,0.04)] min-h-[calc(100vh-10rem)]">
        <ul className="space-y-0.5">
          {settingsNav.map((item) => {
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
      </div>
    </nav>
  );
}
