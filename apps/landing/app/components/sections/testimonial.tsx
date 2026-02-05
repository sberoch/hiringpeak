import Image from "next/image";
import { Card } from "@/app/components/card";
import { Reveal } from "@/app/components/reveal";

export function Testimonial() {
  return (
    <section className="relative overflow-hidden py-32 gradient-mesh-soft">
      <div className="orb orb-blue top-1/2 left-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 opacity-20" />
      <div className="relative mx-auto max-w-5xl px-6 lg:px-8">
        <Reveal>
          <Card
            variant="testimonial"
            className="rounded-3xl p-8 md:p-12 lg:p-16"
          >
            <div className="grid items-center gap-12 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <svg
                  className="mb-8 h-12 w-12 text-accent/30"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden
                >
                  <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                </svg>
                <blockquote className="font-display mb-8 text-2xl font-bold leading-snug text-ink md:text-3xl lg:text-4xl">
                  &quot;Por fin una herramienta que entiende cómo trabajamos.
                  HiringPeak nos permitió{" "}
                  <span className="bg-gradient-to-r from-accent to-accent-deeper bg-clip-text text-transparent">
                    duplicar nuestras colocaciones
                  </span>{" "}
                  en 6 meses.&quot;
                </blockquote>
                <div>
                  <p className="text-lg font-semibold text-ink">
                    María González
                  </p>
                  <p className="text-slate">
                    Socia Directora, Executive Search Boutique
                  </p>
                </div>
              </div>
              <div className="lg:col-span-1">
                <div className="flex aspect-square w-full items-center justify-center rounded-2xl border border-accent/10 bg-gradient-to-br from-accent-soft to-accent-soft/50 p-6">
                  <Image
                    src="/images/deal.png"
                    alt="Colocación exitosa"
                    width={400}
                    height={400}
                    className="h-full w-full object-contain illustration"
                  />
                </div>
              </div>
            </div>
          </Card>
        </Reveal>
      </div>
    </section>
  );
}
