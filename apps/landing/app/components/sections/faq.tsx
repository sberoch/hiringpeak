"use client";

import Image from "next/image";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@workspace/ui/components/accordion";
import { Badge } from "@/app/components/badge";
import { Reveal } from "@/app/components/reveal";
import { cn } from "@workspace/ui/lib/utils";

const faqItems = [
  {
    question: "¿Qué es HiringPeak y para quién está diseñado?",
    answer:
      "HiringPeak es un ATS (Applicant Tracking System) diseñado específicamente para firmas de Executive Search. A diferencia de otros ATS genéricos, está construido para manejar búsquedas de alto nivel, con funcionalidades como perfiles ejecutivos detallados, integración con LinkedIn, y un pipeline visual optimizado para colocaciones C-level.",
  },
  {
    question: "¿Cómo funciona la integración con LinkedIn?",
    answer:
      "Nuestra extensión de Chrome te permite capturar perfiles de ejecutivos directamente desde LinkedIn con un solo click. Se importan automáticamente el nombre, posición actual, foto, email y teléfono cuando están disponibles. Esto elimina la carga manual de datos y acelera tu proceso de sourcing.",
  },
  {
    question: "¿Puedo migrar mis datos desde otro sistema?",
    answer:
      "Sí, ofrecemos migración de datos completa como parte de nuestro proceso de onboarding. Nuestro equipo se encarga de importar tus candidatos, clientes, búsquedas y documentos desde tu sistema anterior, ya sea una planilla de Excel, otro ATS, o cualquier otra herramienta que estés usando.",
  },
  {
    question: "¿Cuántos usuarios pueden acceder a la plataforma?",
    answer:
      "HiringPeak está diseñado para equipos de cualquier tamaño. Ofrecemos planes flexibles que se adaptan a firmas boutique de 2-3 personas hasta operaciones más grandes. Cada plan incluye roles y permisos configurables (Admin, Manager, Recruiter) para que cada miembro tenga el acceso adecuado.",
  },
  {
    question: "¿Qué tipo de soporte ofrecen?",
    answer:
      "Brindamos soporte dedicado 24/7 a todos nuestros clientes. Además del soporte técnico, incluimos capacitación inicial para tu equipo, sesiones de onboarding personalizadas, y acceso a nuestra base de conocimientos con tutoriales y mejores prácticas para Executive Search.",
  },
];

export function FAQ() {
  return (
    <section className="relative overflow-x-hidden py-32 bg-canvas">
      <div className="relative z-10 mx-auto max-w-4xl px-6 lg:px-8">
        <div className="mb-16 text-center">
          <Reveal>
            <Badge className="mb-6">
              <span className="bg-gradient-to-r from-accent to-accent-dark bg-clip-text text-transparent">
                FAQ
              </span>
            </Badge>
            <h2 className="font-display text-4xl font-bold leading-tight tracking-tight text-ink md:text-5xl">
              Preguntas frecuentes
            </h2>
          </Reveal>
        </div>
        <div className="relative z-10 space-y-4">
          <Accordion type="single" collapsible className="space-y-4">
            {faqItems.map((item, i) => (
              <Reveal
                key={item.question}
                style={{ transitionDelay: `${i * 0.1}s` }}
              >
                <AccordionItem
                  value={`item-${i}`}
                  className={cn(
                    "glass-card-strong rounded-2xl overflow-hidden border-0",
                    "data-[state=open]:border-accent/20"
                  )}
                >
                  <AccordionTrigger className="px-8 py-6 text-left font-display text-lg font-semibold text-ink hover:no-underline [&[data-state=open]>svg]:rotate-180">
                    {item.question}
                  </AccordionTrigger>
                  <AccordionContent className="px-8 pb-6">
                    <p className="leading-relaxed text-slate">{item.answer}</p>
                  </AccordionContent>
                </AccordionItem>
              </Reveal>
            ))}
          </Accordion>
        </div>
      </div>
      <Image
        src="/cool_vector.png"
        alt=""
        width={800}
        height={400}
        className="absolute -bottom-20 right-[-10%] z-0 w-[600px] rotate-180 opacity-90 pointer-events-none lg:w-[800px]"
      />
    </section>
  );
}
