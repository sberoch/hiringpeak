"use client";

import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";

import { REDIRECT_UNAUTHORIZED } from "@/lib/consts";

export function LogoutButton() {
  return (
    <div className="px-5 py-1">
      <button
        className="flex items-center gap-2.5 text-[13px] w-full px-3 py-2.5 rounded-lg cursor-pointer text-slate-brand hover:text-red-600 hover:bg-red-50/80 transition-all duration-200 group"
        onClick={() => {
          signOut({
            callbackUrl: `${window.location.origin}${REDIRECT_UNAUTHORIZED}`,
          });
        }}
      >
        <LogOut className="w-4 h-4 group-hover:scale-105 transition-transform duration-200" />
        <span className="font-medium">Cerrar sesión</span>
      </button>
    </div>
  );
}
