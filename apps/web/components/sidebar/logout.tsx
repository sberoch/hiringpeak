"use client";

import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";

import { REDIRECT_UNAUTHORIZED } from "@/lib/consts";

export function LogoutButton() {
  return (
    <div className="p-4">
      <button
        className="flex items-center gap-3 text-sm w-full px-4 py-3 rounded-lg text-sidebar-foreground/70 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50/60 dark:hover:bg-red-900/20 transition-all duration-200 border border-sidebar-border hover:border-red-200/60 dark:hover:border-red-800/60 hover:shadow-sm group"
        onClick={() => {
          signOut({
            callbackUrl: `${window.location.origin}${REDIRECT_UNAUTHORIZED}`,
          });
        }}
      >
        <LogOut className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
        <span className="font-medium">Cerrar sesión</span>
      </button>
    </div>
  );
}
