"use client";

/**
 * THROWAWAY PROTOTYPE ROUTE — /tareas-prototype?variant=A|B|C
 *
 * Plan: three radically different interaction designs for the unbuilt
 * Tareas + Notificaciones feature, switchable via the floating bottom bar.
 * Sits inside the real app shell (sidebar + canvas) on purpose so density
 * and chrome are judged in context. Mock/in-memory data only — NOT wired
 * to any API. Delete this whole folder once a direction is chosen
 * (see NOTES.md for the verdict to capture).
 */

import { Suspense } from "react";

import { PrototypeSwitcher, useVariant } from "./_prototype-switcher";
import { VariantA } from "./_variant-a";
import { VariantB } from "./_variant-b";
import { VariantC } from "./_variant-c";

function PrototypeBody() {
  const variant = useVariant();
  return (
    <>
      {variant === "A" && <VariantA />}
      {variant === "B" && <VariantB />}
      {variant === "C" && <VariantC />}
      <PrototypeSwitcher />
    </>
  );
}

export default function TareasPrototypePage() {
  return (
    <div className="pb-24">
      <Suspense fallback={null}>
        <PrototypeBody />
      </Suspense>
    </div>
  );
}
