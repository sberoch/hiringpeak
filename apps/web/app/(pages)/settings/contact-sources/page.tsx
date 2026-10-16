import type { Metadata } from "next";
import {
  CrmManageOnly,
  SettingsCard,
} from "@/components/settings/commercial-settings-shared";
import ContactSourcesSettings from "@/components/settings/contact-sources-settings";

export const metadata: Metadata = {
  title: "Orígenes de contacto",
};

export default function ContactSourcesPage() {
  return (
    <CrmManageOnly>
      <SettingsCard
        title="Orígenes de contacto"
        description="De dónde vienen las personas de tu red comercial: el «Origen» de cada contacto. Un origen en uso no se puede eliminar."
      >
        <ContactSourcesSettings />
      </SettingsCard>
    </CrmManageOnly>
  );
}
