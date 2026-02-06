import { CheckIcon } from "@/app/components/check-icon";
import { Button } from "@/app/components/button";
import { Input } from "@/app/components/input";
import { Label } from "@workspace/ui/components/label";
import { Reveal } from "@/app/components/reveal";
import { submitContact } from "@/app/actions/contact";

const benefits = [
  "Migración de datos incluida",
  "Capacitación para tu equipo",
  "Soporte dedicado 24/7",
];

export function CTASection() {
  return (
    <section
      id="contacto"
      className="relative overflow-hidden py-32 gradient-mesh-dark"
    >
      <div className="absolute left-0 top-0 h-px w-full bg-gradient-to-r from-transparent via-accent/30 to-transparent" />
      <div className="orb orb-blue right-0 top-20 h-[400px] w-[400px] opacity-30" />
      <div className="orb orb-dark bottom-20 left-20 h-[300px] w-[300px] opacity-20" />
      <div className="relative mx-auto max-w-6xl px-6 lg:px-8">
        <div className="grid items-center gap-16 lg:grid-cols-2 lg:gap-24">
          <Reveal>
            <div>
              <div className="mb-6 inline-flex items-center gap-3 text-sm font-semibold uppercase tracking-wide text-accent">
                <span className="h-px w-10 bg-gradient-to-r from-accent to-transparent" />
                Empezá hoy
              </div>
              <h2 className="font-display mb-6 text-4xl font-bold leading-tight tracking-tight text-white md:text-5xl">
                ¿Listo para transformar tu firma?
              </h2>
              <p className="mb-10 text-lg leading-relaxed text-white/70">
                Unite a las firmas de Executive Search que ya dejaron atrás las
                herramientas genéricas.
              </p>
              <ul className="space-y-4">
                {benefits.map((benefit) => (
                  <li
                    key={benefit}
                    className="flex items-center gap-4 text-white/80"
                  >
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-accent">
                      <CheckIcon className="h-3.5 w-3.5 text-white" />
                    </div>
                    {benefit}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
          <form
            action={submitContact}
            className="glass-card-strong rounded-3xl p-8 lg:p-10"
          >
            <h3 className="font-display mb-8 text-2xl font-bold text-ink">
              Solicitá tu demo
            </h3>
            <div className="mb-8 space-y-5">
              <div>
                <Label
                  htmlFor="name"
                  className="mb-2 block text-sm font-medium text-slate"
                >
                  Tu nombre
                </Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Juan Pérez"
                  required
                />
              </div>
              <div>
                <Label
                  htmlFor="company"
                  className="mb-2 block text-sm font-medium text-slate"
                >
                  Nombre de la firma
                </Label>
                <Input
                  id="company"
                  name="company"
                  type="text"
                  placeholder="Tu Firma Executive Search"
                />
              </div>
              <div>
                <Label
                  htmlFor="email"
                  className="mb-2 block text-sm font-medium text-slate"
                >
                  Email corporativo
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="juan@tufirma.com"
                  required
                />
              </div>
            </div>
            <Button type="submit" variant="primary" size="full">
              Solicitar Demo
            </Button>
            <p className="mt-4 text-center text-sm text-muted">
              Te contactamos en menos de 24hs
            </p>
          </form>
        </div>
      </div>
    </section>
  );
}
