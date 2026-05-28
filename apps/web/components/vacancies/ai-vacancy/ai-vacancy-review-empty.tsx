"use client";

import Image from "next/image";

export function AiVacancyReviewEmpty() {
  return (
    <div className="flex min-h-[min(480px,50vh)] flex-col items-center justify-center px-6 py-16 text-center">
      <Image
        src="/images/stat-search.png"
        alt="Exploración de candidatos"
        width={240}
        height={160}
        className="h-auto w-[200px] opacity-90"
      />
      <h2 className="mt-6 text-xl font-semibold text-ink">
        Genera un borrador y empieza a recortar el universo de candidatos.
      </h2>
      <p className="mt-2 max-w-md text-sm leading-6 text-slate-brand">
        Cuanto más contexto pongas en el prompt, mejor será la primera sugerencia. Después podés
        ajustar filtros, corregir texto y confirmar los datos finales.
      </p>
    </div>
  );
}
