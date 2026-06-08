import type { ReactNode } from "react";
import { Card } from "@/app/components/card";
import { CheckIcon } from "@/app/components/check-icon";
import { Eyebrow } from "@/app/components/eyebrow";
import { LightboxImage } from "@/app/components/lightbox-image";
import { Reveal } from "@/app/components/reveal";

type ProductShowcaseProps = {
  id?: string;
  eyebrow: string;
  title: ReactNode;
  description: string;
  items: string[];
  image: { src: string; alt: string; width: number; height: number };
  /** When true, the image sits on the right and the text on the left. */
  imageRight?: boolean;
  /** Background + glow utilities for the <section>. */
  sectionClassName?: string;
  /** Text color for the eyebrow. */
  accentClassName?: string;
  /** Gradient start color for the eyebrow lines, e.g. "from-accent". */
  lineClassName?: string;
};

export function ProductShowcase({
  id,
  eyebrow,
  title,
  description,
  items,
  image,
  imageRight = false,
  sectionClassName = "gradient-mesh-soft section-glow",
  accentClassName = "text-accent",
  lineClassName = "from-accent",
}: ProductShowcaseProps) {
  return (
    <section id={id} className={`relative py-32 ${sectionClassName}`}>
      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-3">
          <Reveal
            className={`lg:col-span-2 ${imageRight ? "lg:order-last" : ""}`}
          >
            <Card variant="illustration" className="p-3 lg:p-4">
              <LightboxImage
                src={image.src}
                alt={image.alt}
                width={image.width}
                height={image.height}
                className="h-auto w-full rounded-xl border border-border/60"
              />
            </Card>
          </Reveal>

          <Reveal
            className="lg:col-span-1"
            style={{ transitionDelay: "0.1s" }}
          >
            <Eyebrow
              className="mb-6"
              accentClassName={accentClassName}
              lineClassName={lineClassName}
            >
              {eyebrow}
            </Eyebrow>
            <h2 className="font-display mb-6 text-3xl font-bold leading-tight tracking-tight text-ink md:text-4xl">
              {title}
            </h2>
            <p className="text-lg leading-relaxed text-slate">{description}</p>

            <ul className="mt-8 grid gap-4 text-left">
              {items.map((text) => (
                <li key={text} className="flex items-start gap-3 text-slate">
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
