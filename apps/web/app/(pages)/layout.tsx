import { AppSidebar } from "@/components/sidebar/app-sidebar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@workspace/ui/components/sidebar";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="relative w-full min-w-0 bg-canvas">
        <SidebarTrigger className="absolute top-3 left-3 z-30 text-slate-brand hover:text-ink transition-colors" />
        <div className="p-6">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
