import { Reveal } from "@/app/components/reveal";

const stats = [
  { value: "40%", label: "Menos tiempo a colocación" },
  { value: "3x", label: "Más búsquedas gestionadas" },
  { value: "100%", label: "Visibilidad del pipeline" },
  { value: "0", label: "Candidatos perdidos" },
];

export function Stats() {
  return (
    <section className="relative overflow-hidden py-28 gradient-mesh-dark">
      <div className="absolute left-0 top-0 h-px w-full bg-gradient-to-r from-transparent via-accent/30 to-transparent" />
      <div className="absolute bottom-0 left-0 h-px w-full bg-gradient-to-r from-transparent via-accent/30 to-transparent" />
      <div className="orb orb-blue right-20 top-0 h-[300px] w-[300px] opacity-30" />
      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mb-16 text-center">
          <Reveal>
            <p className="mb-4 text-sm font-semibold uppercase tracking-wide text-accent">
              Resultados comprobados
            </p>
            <h2 className="font-display text-3xl font-bold text-white md:text-4xl">
              Números que hablan por sí solos
            </h2>
          </Reveal>
        </div>
        <div className="grid grid-cols-2 gap-8 lg:grid-cols-4 lg:gap-12">
          {stats.map((stat, i) => (
            <Reveal
              key={stat.label}
              className="glass-card cursor-default rounded-2xl p-8 text-center"
              style={{
                background: "rgba(255, 255, 255, 0.05)",
                borderColor: "rgba(255, 255, 255, 0.1)",
                transitionDelay: `${i * 0.1}s`,
              }}
            >
              <p className="stat-number font-display mb-2 text-5xl font-bold tracking-tight lg:text-6xl">
                {stat.value}
              </p>
              <p className="text-sm font-medium text-white/60">{stat.label}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
