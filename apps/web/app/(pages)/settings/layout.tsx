import type { Metadata } from "next";
import { SettingsSidebar } from "@/components/settings/settings-sidebar";
import { Settings } from "lucide-react";
import { PageHeading } from "@workspace/ui/components/page-heading";

export const metadata: Metadata = {
  title: {
    default: "Configuración",
    template: "%s | HiringPeak",
  },
};

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col mb-12">
      <PageHeading
        icon={Settings}
        title="Configuración"
        description="Gestiona las configuraciones del sistema de reclutamiento."
        className="mb-8"
      />

      {/* Sidebar + Content */}
      <div className="flex gap-8">
        <SettingsSidebar />
        <div className="flex-1 min-w-0">{children}</div>
      </div>
    </div>
  );
}
