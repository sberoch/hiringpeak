import Image from "next/image";
import { Card } from "@/app/components/card";
import { CheckIcon } from "@/app/components/check-icon";
import { Reveal } from "@/app/components/reveal";

const items = [
  "Sistema de rating de 5 estrellas",
  "Gestión de documentos (CVs, informes)",
  "Notas y comentarios colaborativos",
];

export function ProductProfiles() {
  return (
    <section className="relative py-32 bg-canvas">
      <div className="orb orb-soft -left-40 top-1/2 h-[400px] w-[400px] -translate-y-1/2 opacity-40" />
      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid items-center gap-16 lg:grid-cols-2 lg:gap-24">
          <Reveal className="relative">
            <Image
              src="/images/notes-nobg.png"
              alt=""
              width={80}
              height={80}
              className="absolute -bottom-4 -left-6 z-10 hidden w-14 lg:block lg:w-20"
            />
            <Card variant="illustration" className="p-6 lg:p-8">
              <Image
                src="/images/ideal_candidate.jpeg"
                alt="Perfil de candidato ejecutivo"
                width={800}
                height={600}
                className="h-auto w-full rounded-xl illustration"
              />
            </Card>
          </Reveal>
          <Reveal style={{ transitionDelay: "0.15s" }}>
            <div className="mb-6 inline-flex items-center gap-3 text-sm font-semibold uppercase tracking-wide text-accent-dark">
              <span className="h-px w-10 bg-gradient-to-r from-accent-dark to-transparent" />
              Perfiles Ejecutivos
            </div>
            <h2 className="font-display mb-6 text-4xl font-bold leading-tight tracking-tight text-ink md:text-5xl">
              Conocé a tus candidatos en profundidad
            </h2>
            <p className="mb-8 text-lg leading-relaxed text-slate">
              Perfiles completos con ratings, documentos adjuntos, notas de
              equipo, historial de comunicación y toda la información para
              evaluar talento ejecutivo.
            </p>
            <ul className="space-y-4">
              {items.map((text) => (
                <li key={text} className="flex items-start gap-4 text-slate">
                  <div className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-lg bg-accent">
                    <CheckIcon className="h-3.5 w-3.5 text-white" />
                  </div>
                  <span>{text}</span>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
