import { Eyebrow } from "@/app/components/eyebrow";
import { Card } from "@/app/components/card";
import { LightboxImage } from "@/app/components/lightbox-image";
import { Reveal } from "@/app/components/reveal";
import Image from "next/image";

const dashboard = {
  image: "/images/screenshots-from-app/app-dashboard.png",
  imageAlt: "Dashboard con métricas, búsquedas y candidatos",
  badge: "Dashboard",
  title: "Vista completa de tu negocio",
  description:
    "Métricas clave, búsquedas activas, candidatos en pipeline. Todo al instante.",
};

const features = [
  {
    image: "/images/meeting.jpeg",
    imageAlt: "Gestión de clientes",
    title: "Gestión de Clientes",
    description: "Empresas, contactos y búsquedas en un solo lugar.",
  },
  {
    image: "/images/team.png",
    imageAlt: "Roles y permisos de equipo",
    title: "Roles y Permisos",
    description: "Admin, Manager, Recruiter. Control granular.",
  },
  {
    image: "/images/idea.png",
    imageAlt: "Reportes y métricas",
    title: "Reportes y Métricas",
    description: "Informes por búsqueda y por empresa para decidir con datos.",
  },
];

export function FeaturesGrid() {
  return (
    <section id="funcionalidades" className="relative py-32 bg-canvas">
      <div className="orb orb-dark right-0 top-20 h-[300px] w-[300px] opacity-30" />
      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mb-20 text-center">
          <Reveal>
            <Eyebrow className="mb-6">Funcionalidades</Eyebrow>
            <h2 className="font-display text-4xl font-bold leading-tight tracking-tight text-ink md:text-5xl">
              Todo lo que necesitás, nada que no
            </h2>
          </Reveal>
        </div>
        <div className="grid gap-6 lg:grid-cols-4 lg:items-start">
          <Reveal className="lg:col-span-3" style={{ transitionDelay: "0.1s" }}>
            <Card variant="feature" className="overflow-hidden rounded-3xl">
              <div className="flex h-full flex-col bg-white p-8">
                <div className="mb-6">
                  <LightboxImage
                    src={dashboard.image}
                    alt={dashboard.imageAlt}
                    width={1411}
                    height={1096}
                    className="illustration h-auto w-full rounded-xl border border-border/60"
                  />
                </div>
                <Eyebrow className="mb-4">{dashboard.badge}</Eyebrow>
                <h3 className="font-display mb-3 text-2xl font-bold text-ink">
                  {dashboard.title}
                </h3>
                <p className="text-slate">{dashboard.description}</p>
              </div>
            </Card>
          </Reveal>

          <div className="grid gap-6">
            {features.map((feature, i) => (
              <Reveal
                key={feature.title}
                style={{ transitionDelay: `${(i + 2) * 0.1}s` }}
              >
                <Card variant="feature" className="h-full rounded-2xl px-6 py-6">
                  <div className="flex flex-col">
                    <div className="mb-4 flex h-24 items-center justify-center">
                      <Image
                        src={feature.image}
                        alt={feature.imageAlt}
                        width={200}
                        height={160}
                        className="illustration h-24 w-full rounded-lg object-contain"
                      />
                    </div>
                    <h3 className="font-display mb-2 text-xl font-bold text-ink">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-slate">{feature.description}</p>
                  </div>
                </Card>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
