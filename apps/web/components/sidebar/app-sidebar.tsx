import { ComponentProps } from "react";

import { Sidebar } from "@workspace/ui/components/sidebar";
import { AppSidebarContent } from "@/components/sidebar/sidebar-content";
import { auth } from "@/lib/auth";

export async function AppSidebar({ ...props }: ComponentProps<typeof Sidebar>) {
  const session = await auth();
  if (!session?.accessToken) {
    return null;
  }
  return <AppSidebarContent otherProps={props} />;
}
