import Image from "next/image";
import { Card } from "@/app/components/card";
import { CheckIcon } from "@/app/components/check-icon";
import { Reveal } from "@/app/components/reveal";

const items = [
  "Etapas personalizables por búsqueda",
  "Indicadores visuales de estado y progreso",
  "Actualización colaborativa en tiempo real",
];

export function ProductPipeline() {
  return (
    <section
      id="producto"
      className="relative py-32 gradient-mesh-soft section-glow"
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid items-center gap-16 lg:grid-cols-2 lg:gap-24">
          <Reveal className="order-2 lg:order-1">
            <div className="mb-6 inline-flex items-center gap-3 text-sm font-semibold uppercase tracking-wide text-accent">
              <span className="h-px w-10 bg-gradient-to-r from-accent to-transparent" />
              Pipeline Visual
            </div>
            <h2 className="font-display mb-6 text-4xl font-bold leading-tight tracking-tight text-ink md:text-5xl">
              Toda tu búsqueda,
              <br />
              de un vistazo
            </h2>
            <p className="mb-8 text-lg leading-relaxed text-slate">
              Tablero Kanban drag-and-drop con etapas 100% personalizables.
              Arrastrá candidatos entre etapas, ve el progreso de tu equipo en
              tiempo real.
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
          <Reveal className="order-1 lg:order-2 relative" style={{ transitionDelay: "0.15s" }}>
            <Card variant="illustration" className="p-6 lg:p-8">
              <Image
                src="/images/kanban.jpeg"
                alt="Pipeline visual Kanban"
                width={800}
                height={600}
                className="h-auto w-full rounded-xl illustration"
              />
            </Card>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
