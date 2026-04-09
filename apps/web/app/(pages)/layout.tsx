import { AppSidebar } from "@/components/sidebar/app-sidebar";
import {
  SidebarInset,
  SidebarProvider
} from "@workspace/ui/components/sidebar";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="relative w-full min-w-0 bg-canvas">
        <div className="p-6">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
