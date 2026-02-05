import Image from "next/image";
import { Badge } from "@/app/components/badge";
import { Card } from "@/app/components/card";
import { Reveal } from "@/app/components/reveal";

const features = [
  {
    image: "/images/lkn_extension.jpeg",
    imageAlt: "Extensión de LinkedIn",
    title: "Extensión de LinkedIn",
    description:
      "Capturá perfiles de ejecutivos con un click. Nombre, posición, foto, email y teléfono—todo automático.",
  },
  {
    image: "/images/search.png",
    imageAlt: "Filtros avanzados de búsqueda",
    title: "Filtros Avanzados",
    description:
      "Seniority, industria, geografía, idiomas. Encontrá al ejecutivo perfecto en segundos.",
  },
];

export function LinkedInSection() {
  return (
    <section className="relative py-32 gradient-mesh-soft section-glow">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mb-20 text-center">
          <Reveal>
            <Badge className="mb-6">
              <span className="bg-gradient-to-r from-accent to-accent-dark bg-clip-text text-transparent">
                Sourcing Inteligente
              </span>
            </Badge>
            <h2 className="font-display mx-auto max-w-3xl text-4xl font-bold leading-tight tracking-tight text-ink md:text-5xl lg:text-6xl">
              De LinkedIn a tu base de datos
              <span className="bg-gradient-to-r from-accent to-accent-deeper bg-clip-text text-transparent">
                {" "}
                en un click
              </span>
            </h2>
          </Reveal>
        </div>
        <div className="grid gap-8 md:grid-cols-2">
          {features.map((feature, i) => (
            <Reveal
              key={feature.title}
              style={{ transitionDelay: i === 1 ? "0.15s" : undefined }}
            >
              <Card
                variant="feature"
                className="overflow-hidden rounded-3xl border-0"
              >
                <div className="flex aspect-[4/3] items-center justify-center bg-white p-6">
                  <Image
                    src={feature.image}
                    alt={feature.imageAlt}
                    width={600}
                    height={450}
                    className="h-full w-full rounded-xl object-contain illustration"
                  />
                </div>
                <div className="p-8">
                  <h3 className="font-display mb-3 text-2xl font-bold text-ink">
                    {feature.title}
                  </h3>
                  <p className="text-slate">{feature.description}</p>
                </div>
              </Card>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
