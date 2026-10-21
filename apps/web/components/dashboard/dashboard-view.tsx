"use client";

import {
  rectSortingStrategy,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  Check,
  ExternalLink,
  FileSpreadsheet,
  RotateCcw,
  Settings,
  TrendingUp,
} from "lucide-react";
import { useState } from "react";
import {
  RAIL_WIDGETS,
  STAT_WIDGETS,
  WIDE_WIDGETS,
} from "@workspace/shared/lib/widget-catalogues";
import { Button } from "@workspace/ui/components/button";
import { cn } from "@workspace/ui/lib/utils";

import { useSavedLayout } from "@/hooks/use-saved-layout";

import {
  RAIL_WIDGET_DEFINITIONS,
  STAT_WIDGET_DEFINITIONS,
  WIDE_WIDGET_DEFINITIONS,
} from "./dashboard-widgets";
import { WidgetArea } from "./widget-area";

interface DashboardViewProps {
  greeting: string;
  userName: string;
  roleName?: string | null;
  spreadsheetUrl?: string;
}

/**
 * The dashboard: a hero, then the User's Dashboard Layout in three Widget
 * Areas (Stat, Wide, Rail). The gear button edits the layout in place.
 * When the Rail has no Widgets, the main column takes the full width.
 */
export function DashboardView({
  greeting,
  userName,
  roleName,
  spreadsheetUrl,
}: DashboardViewProps) {
  const [editing, setEditing] = useState(false);
  const stat = useSavedLayout("dashboard.stat", STAT_WIDGETS);
  const wide = useSavedLayout("dashboard.wide", WIDE_WIDGETS);
  const rail = useSavedLayout("dashboard.rail", RAIL_WIDGETS);

  const showsRail =
    rail.entries.length > 0 || (editing && rail.choices.length > 0);
  const resetAll = () => {
    stat.reset();
    wide.reset();
    rail.reset();
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Hero header */}
      <div className="relative overflow-hidden rounded-2xl border border-brand-border bg-surface p-6">
        {/* Subtle background orbs */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-electric/[0.04] blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-teal/[0.04] blur-3xl" />

        <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-electric text-white shadow-[0_4px_12px_-2px_rgba(0,102,255,0.35)]">
              <TrendingUp className="h-5 w-5" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-ink">
                {greeting}, {userName}
              </h1>
              <p className="mt-0.5 text-sm text-slate-brand">
                Resumen de tu actividad
                {roleName && (
                  <span className="ml-2 inline-flex items-center rounded-md bg-electric/[0.08] px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-electric">
                    {roleName}
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {spreadsheetUrl && !editing && (
              <a
                href={spreadsheetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl border border-brand-border bg-canvas px-4 py-2.5 text-sm font-semibold text-ink transition-all hover:border-electric/30 hover:shadow-[0_2px_8px_-2px_rgba(0,102,255,0.15)] group"
              >
                <FileSpreadsheet className="h-4 w-4 text-teal" />
                Ver spreadsheet
                <ExternalLink className="h-3 w-3 text-muted-brand transition-colors group-hover:text-electric" />
              </a>
            )}
            {editing ? (
              <>
                <Button
                  variant="ghost"
                  onClick={resetAll}
                  className="gap-2 rounded-xl text-slate-brand hover:text-ink"
                >
                  <RotateCcw className="h-4 w-4" />
                  Restablecer
                </Button>
                <Button
                  onClick={() => setEditing(false)}
                  className="gap-2 rounded-xl bg-electric text-white hover:bg-electric-light"
                >
                  <Check className="h-4 w-4" />
                  Listo
                </Button>
              </>
            ) : (
              <Button
                variant="outline"
                size="icon"
                aria-label="Personalizar dashboard"
                title="Personalizar dashboard"
                onClick={() => setEditing(true)}
                className="h-10 w-10 rounded-xl border-brand-border text-slate-brand hover:border-electric hover:bg-electric/5 hover:text-ink"
              >
                <Settings className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>

      <WidgetArea
        title="Estadísticas"
        layout={stat}
        definitions={STAT_WIDGET_DEFINITIONS}
        editing={editing}
        className="grid grid-cols-1 gap-5 sm:grid-cols-3"
        strategy={rectSortingStrategy}
      />

      {/* Analytics on the left; the user's own tasks and recent arrivals on a sticky rail */}
      <div
        className={cn(
          "grid grid-cols-1 gap-6",
          showsRail && "xl:grid-cols-[minmax(0,1fr)_420px]",
        )}
      >
        <WidgetArea
          title="Columna principal"
          layout={wide}
          definitions={WIDE_WIDGET_DEFINITIONS}
          editing={editing}
          className="flex min-w-0 flex-col gap-6"
          strategy={verticalListSortingStrategy}
        />

        {showsRail && (
          <aside className="flex min-w-0 flex-col gap-6 xl:sticky xl:top-6 xl:self-start">
            <WidgetArea
              title="Columna lateral"
              layout={rail}
              definitions={RAIL_WIDGET_DEFINITIONS}
              editing={editing}
              className="flex min-w-0 flex-col gap-6"
              strategy={verticalListSortingStrategy}
            />
          </aside>
        )}
      </div>
    </div>
  );
}
