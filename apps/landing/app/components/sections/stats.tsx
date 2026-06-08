"use client";

import { useEffect, useRef, useState } from "react";
import { Reveal } from "@/app/components/reveal";

type Stat = {
  /** Numeric target the count-up animates toward. */
  target: number;
  /** Rendered after the number, e.g. "%" or "x". */
  suffix: string;
  label: string;
  /** Short context line under the label. */
  detail: string;
};

const stats: Stat[] = [
  {
    target: 40,
    suffix: "%",
    label: "Menos tiempo a colocación",
    detail: "Del primer contacto al cierre",
  },
  {
    target: 3,
    suffix: "x",
    label: "Más búsquedas gestionadas",
    detail: "Por reclutador, en paralelo",
  },
  {
    target: 100,
    suffix: "%",
    label: "Visibilidad del pipeline",
    detail: "Cada candidatura, en tiempo real",
  },
  {
    target: 0,
    suffix: "",
    label: "Candidatos perdidos",
    detail: "Nada se cae entre etapas",
  },
];

const easeOutExpo = (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));

function CountUp({
  target,
  suffix,
  active,
}: {
  target: number;
  suffix: string;
  active: boolean;
}) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!active) return;
    if (target === 0) {
      setValue(0);
      return;
    }
    const duration = 1600;
    let raf = 0;
    let start: number | null = null;
    const tick = (now: number) => {
      if (start === null) start = now;
      const progress = Math.min((now - start) / duration, 1);
      setValue(Math.round(easeOutExpo(progress) * target));
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, target]);

  return (
    <span>
      {value}
      {suffix}
    </span>
  );
}

export function Stats() {
  const panelRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const el = panelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setActive(true);
          observer.disconnect();
        }
      },
      { rootMargin: "-120px 0px 0px 0px", threshold: 0 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section className="relative overflow-hidden py-28 gradient-mesh-dark">
      <div className="absolute left-0 top-0 h-px w-full bg-gradient-to-r from-transparent via-accent/30 to-transparent" />
      <div className="absolute bottom-0 left-0 h-px w-full bg-gradient-to-r from-transparent via-accent/30 to-transparent" />
      <div className="orb orb-blue right-20 top-0 h-[300px] w-[300px] opacity-30" />

      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mb-16 text-center">
          <Reveal>
            <p className="mb-4 text-sm font-semibold uppercase tracking-wide text-accent">
              El impacto en tu día a día
            </p>
            <h2 className="font-display text-3xl font-bold text-white md:text-4xl">
              Más colocaciones, menos fricción
            </h2>
          </Reveal>
        </div>

        <Reveal>
          <div
            ref={panelRef}
            className="stat-panel grid grid-cols-1 gap-px overflow-hidden rounded-2xl sm:grid-cols-2 lg:grid-cols-4"
          >
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="stat-cell flex flex-col items-start p-8 lg:p-10"
              >
                <p className="stat-number font-display text-6xl font-bold leading-none tracking-tight lg:text-7xl">
                  <CountUp
                    target={stat.target}
                    suffix={stat.suffix}
                    active={active}
                  />
                </p>
                <p className="mt-5 text-base font-medium text-white">
                  {stat.label}
                </p>
                <p className="mt-1.5 text-sm leading-relaxed text-white/45">
                  {stat.detail}
                </p>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
