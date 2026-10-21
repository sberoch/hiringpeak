"use client";

import type { ComponentType } from "react";
import type {
  RailWidgetKey,
  StatWidgetKey,
  WideWidgetKey,
} from "@workspace/shared/lib/widget-catalogues";

import { LatestCandidates } from "@/components/candidates/latest-candidates";
import { LatestVacancies } from "@/components/vacancies/latest-vacancies";

import {
  ActiveCandidatesStat,
  ActiveVacanciesStat,
  AvgDaysOpenStat,
  CandidatesAddedStat,
  MyActiveVacanciesStat,
  MyOverdueTasksStat,
  OpenOpportunitiesStat,
  PipelineFeeStat,
} from "./dashboard-stat-cards";
import { DueSoonWidget } from "./due-soon-widget";
import { NoNextStepWidget } from "./no-next-step-widget";
import { TeamPerformanceTable } from "./team-performance";

/**
 * How the dashboard draws a Widget: its name in edit mode and the
 * component that renders it. Widgets take no props and load their own
 * data, so a hidden Widget (never mounted) loads nothing.
 *
 * Adding a Widget: a catalogue entry in the shared `widget-catalogues.ts`,
 * then its definition here (the `Record` type asks for it).
 */
export interface WidgetDefinition {
  label: string;
  Component: ComponentType;
}

export const STAT_WIDGET_DEFINITIONS: Record<StatWidgetKey, WidgetDefinition> =
  {
    activeVacancies: {
      label: "Búsquedas activas",
      Component: ActiveVacanciesStat,
    },
    activeCandidates: {
      label: "Postulantes activos",
      Component: ActiveCandidatesStat,
    },
    avgDaysOpen: {
      label: "Prom. días de gestión",
      Component: AvgDaysOpenStat,
    },
    myActiveVacancies: {
      label: "Mis búsquedas activas",
      Component: MyActiveVacanciesStat,
    },
    myOverdueTasks: {
      label: "Mis tareas vencidas",
      Component: MyOverdueTasksStat,
    },
    candidatesAddedLast30Days: {
      label: "Candidatos agregados (últ. 30 días)",
      Component: CandidatesAddedStat,
    },
    openOpportunities: {
      label: "Oportunidades abiertas",
      Component: OpenOpportunitiesStat,
    },
    pipelineFee: {
      label: "Fee estimado en pipeline",
      Component: PipelineFeeStat,
    },
  };

export const WIDE_WIDGET_DEFINITIONS: Record<WideWidgetKey, WidgetDefinition> =
  {
    teamPerformance: {
      label: "Rendimiento del equipo",
      Component: TeamPerformanceTable,
    },
    latestVacancies: { label: "Últimas búsquedas", Component: LatestVacancies },
  };

export const RAIL_WIDGET_DEFINITIONS: Record<RailWidgetKey, WidgetDefinition> =
  {
    dueSoonTasks: { label: "Tareas próximas", Component: DueSoonWidget },
    latestCandidates: {
      label: "Últimos candidatos",
      Component: LatestCandidates,
    },
    noNextStepOpportunities: {
      label: "Oportunidades sin próximo paso",
      Component: NoNextStepWidget,
    },
  };
