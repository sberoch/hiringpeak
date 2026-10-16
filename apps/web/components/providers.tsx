"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { SessionProvider } from "next-auth/react";

import { Toaster } from "@workspace/ui/components/sonner";

import QueryProvider from "@/providers/query-provider";
import { PermissionProvider } from "@/contexts/permission-context";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <QueryProvider>
        <PermissionProvider>
          <NextThemesProvider
            attribute="class"
            defaultTheme="light"
            forcedTheme="light"
            disableTransitionOnChange
            enableColorScheme
          >
            {children}
            <Toaster
              toastOptions={{
                classNames: {
                  toast:
                    "!bg-white !text-ink !border-brand-border [&[data-type=error]_[data-icon]]:!text-red-600",
                  icon: "!text-electric",
                  description: "!text-slate-brand",
                },
              }}
            />
          </NextThemesProvider>
        </PermissionProvider>
      </QueryProvider>
    </SessionProvider>
  );
}
