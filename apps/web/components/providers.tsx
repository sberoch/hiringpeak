"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { SessionProvider } from "next-auth/react";

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
            enableSystem
            disableTransitionOnChange
            enableColorScheme
          >
            {children}
          </NextThemesProvider>
        </PermissionProvider>
      </QueryProvider>
    </SessionProvider>
  );
}
