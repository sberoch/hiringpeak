import type { Metadata } from "next";
import {
  CrmManageOnly,
  SettingsCard,
} from "@/components/settings/commercial-settings-shared";
import OpportunityStagesSettings from "@/components/settings/opportunity-stages-settings";

export const metadata: Metadata = {
  title: "Etapas de oportunidad",
};

export default function OpportunityStagesPage() {
  return (
    <CrmManageOnly>
      <SettingsCard
        title="Etapas de oportunidad"
        description="Las etapas por las que avanza una oportunidad. Exactamente una es la ganada y una la perdida; esas dos siempre van al final."
      >
        <OpportunityStagesSettings />
      </SettingsCard>
    </CrmManageOnly>
  );
}
