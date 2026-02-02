"use client";

import AreasSettings from "@/components/settings/areas-settings";
import CandidateVacancyStatusesSettings from "@/components/settings/candidate-vacancy-statuses-settings";
import IndustriesSettings from "@/components/settings/industries-settings";
import SenioritiesSettings from "@/components/settings/seniorities-settings";
import SourcesSettings from "@/components/settings/sources-settings";
import VacancyStatusesSettings from "@/components/settings/vacancy-statuses-settings";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Heading } from "@workspace/ui/components/heading";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@workspace/ui/components/tabs";

const tabsConfig = [
  {
    id: "areas",
    label: "Áreas",
    title: "Áreas",
    description: "Gestiona las áreas disponibles para los postulantes.",
    component: AreasSettings,
  },
  {
    id: "seniorities",
    label: "Seniority",
    title: "Seniority",
    description: "Gestiona los seniorities disponibles para los postulantes.",
    component: SenioritiesSettings,
  },
  {
    id: "industries",
    label: "Industrias",
    title: "Industrias",
    description: "Gestiona las industrias disponibles.",
    component: IndustriesSettings,
  },
  {
    id: "sources",
    label: "Fuentes",
    title: "Fuentes",
    description: "Gestiona las fuentes de reclutamiento disponibles.",
    component: SourcesSettings,
  },
  {
    id: "vacancy-statuses",
    label: "Estados de vacante",
    title: "Estados de Vacante",
    description: "Gestiona los estados disponibles para las vacantes.",
    component: VacancyStatusesSettings,
  },
  {
    id: "vacancy-candidate-statuses",
    label: "Estados de candidato",
    title: "Estados de Candidato",
    description:
      "Gestiona los estados disponibles para los candidatos en una vacante.",
    component: CandidateVacancyStatusesSettings,
  },
];

export default function SettingsPage() {
  return (
    <div className="container flex flex-col mb-12">
      <div className="mb-8">
        <Heading>Configuración</Heading>
        <p className="text-muted-foreground">
          Gestiona las configuraciones del sistema de reclutamiento.
        </p>
      </div>

      <Tabs defaultValue={tabsConfig[0].id} className="w-full">
        <TabsList className="grid w-full h-fit grid-cols-2 lg:grid-cols-3 mb-8">
          {tabsConfig.map((tab) => (
            <TabsTrigger key={tab.id} value={tab.id}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {tabsConfig.map((tab) => {
          const Component = tab.component;
          return (
            <TabsContent key={tab.id} value={tab.id}>
              <Card>
                <CardHeader>
                  <CardTitle>{tab.title}</CardTitle>
                  <CardDescription>{tab.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Component />
                </CardContent>
              </Card>
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}
