import type { Metadata } from "next";
import {
  CrmManageOnly,
  SettingsCard,
} from "@/components/settings/commercial-settings-shared";
import LostReasonsSettings from "@/components/settings/lost-reasons-settings";

export const metadata: Metadata = {
  title: "Motivos de pérdida",
};

export default function LostReasonsPage() {
  return (
    <CrmManageOnly>
      <SettingsCard
        title="Motivos de pérdida"
        description="Por qué se perdió una oportunidad. Al pasarla a la etapa perdida hay que elegir uno, por eso la lista nunca puede quedar vacía."
      >
        <LostReasonsSettings />
      </SettingsCard>
    </CrmManageOnly>
  );
}
