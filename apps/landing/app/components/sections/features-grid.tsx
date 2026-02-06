import { Badge } from "@/app/components/badge";
import { Card } from "@/app/components/card";
import { Reveal } from "@/app/components/reveal";
import { cn } from "@workspace/ui/lib/utils";
import Image from "next/image";

const features = [
  {
    type: "large",
    image: "/images/reports.jpeg",
    imageAlt: "Dashboard y reportes",
    badge: "Dashboard",
    title: "Vista completa de tu negocio",
    description:
      "Métricas clave, búsquedas activas, candidatos en pipeline. Todo al instante.",
  },
  {
    type: "small",
    image: "/images/meeting.jpeg",
    imageAlt: "Gestión de clientes",
    title: "Gestión de Clientes",
    description: "Empresas, contactos y búsquedas en un solo lugar.",
  },
  {
    type: "small",
    image: "/images/team.png",
    imageAlt: "Roles y permisos de equipo",
    title: "Roles y Permisos",
    description: "Admin, Manager, Recruiter. Control granular.",
  },
  {
    type: "small",
    image: "/images/idea.png",
    imageAlt: "Insights inteligentes",
    title: "Insights Inteligentes",
    description:
      "Recomendaciones basadas en datos para mejores decisiones.",
  },
  {
    type: "small",
    image: "/images/responsive.png",
    imageAlt: "Acceso desde cualquier dispositivo",
    title: "Mobile Ready",
    description: "Accedé desde cualquier dispositivo.",
  },
];

export function FeaturesGrid() {
  return (
    <section id="funcionalidades" className="relative py-32 bg-canvas">
      <div className="orb orb-dark right-0 top-20 h-[300px] w-[300px] opacity-30" />
      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mb-20 text-center">
          <Reveal>
            <Badge className="mb-6">
              <span className="bg-linear-to-r from-accent to-accent-dark bg-clip-text text-transparent">
                Funcionalidades
              </span>
            </Badge>
            <h2 className="font-display text-4xl font-bold leading-tight tracking-tight text-ink md:text-5xl">
              Todo lo que necesitás, nada que no
            </h2>
          </Reveal>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, i) => (
            <Reveal
              key={feature.title}
              style={{ transitionDelay: `${(i + 1) * 0.1}s` }}
              className={cn(feature.type === "large" ? "lg:col-span-2 lg:row-span-2" : "")}
            >
              <Card
                variant="feature"
                className={cn(
                  feature.type === "large"
                    ? "overflow-hidden rounded-3xl"
                    : "rounded-2xl px-6 py-auto h-full"
                )}
              >
                <div
                  className={
                    feature.type === "large"
                      ? "flex h-full flex-col bg-white p-8"
                      : ""
                  }
                >
                  <div
                    className={
                      feature.type === "large"
                        ? "mb-6 flex flex-1 items-center justify-center"
                        : "mb-4 flex justify-center"
                    }
                  >
                    <Image
                      src={feature.image}
                      alt={feature.imageAlt}
                      width={feature.type === "large" ? 400 : 200}
                      height={feature.type === "large" ? 300 : 96}
                      className={`illustration rounded-xl ${feature.type === "large"
                        ? "h-auto w-full max-w-sm"
                        : "h-24 w-full object-contain"
                        }`}
                    />
                  </div>
                  {feature.type === "large" && (
                    <Badge className="mb-4 w-fit">
                      <span className="text-accent">{feature.badge}</span>
                    </Badge>
                  )}
                  <h3
                    className={`font-display font-bold text-ink ${feature.type === "large" ? "mb-3 text-2xl" : "mb-2 text-xl"
                      }`}
                  >
                    {feature.title}
                  </h3>
                  <p
                    className={
                      feature.type === "large" ? "text-slate" : "text-sm text-slate"
                    }
                  >
                    {feature.description}
                  </p>
                </div>
              </Card>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
