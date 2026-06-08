"use client";

import Image from "next/image";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@workspace/ui/components/accordion";
import { Eyebrow } from "@/app/components/eyebrow";
import { Reveal } from "@/app/components/reveal";
import { cn } from "@workspace/ui/lib/utils";

const faqItems = [
  {
    question: "¿Qué es HiringPeak y para quién es?",
    answer:
      "Es un ATS pensado exclusivamente para firmas de executive search. A diferencia de los ATS genéricos, está hecho para cómo trabajás vos: cazás talento pasivo, evaluás perfiles ejecutivos a fondo y le entregás un shortlist a tu cliente. Captura desde LinkedIn, perfiles detallados, pipeline visual e informes listos para enviar.",
  },
  {
    question: "¿Cómo funciona la integración con LinkedIn?",
    answer:
      "Con nuestra extensión de Chrome capturás el perfil de un ejecutivo directamente desde LinkedIn, con un click. Se importan automáticamente nombre, posición actual y foto, además de email y teléfono cuando están disponibles. Te ahorrás la carga manual y sumás candidatos a tu base en segundos.",
  },
  {
    question: "¿Puedo migrar mis datos desde otro sistema?",
    answer:
      "Sí, y va incluida en el onboarding. Nuestro equipo importa tus candidatos, clientes, búsquedas y documentos desde donde los tengas hoy: una planilla de Excel, otro ATS o la herramienta que uses. Arrancás con todo tu historial cargado, sin empezar de cero.",
  },
  {
    question: "¿Para equipos de qué tamaño sirve?",
    answer:
      "Funciona igual para una boutique de 2 o 3 personas que para un equipo más grande. Incluye roles y permisos configurables (Administrador, Manager, Recruiter) para que cada uno vea y haga exactamente lo que le corresponde.",
  },
  {
    question: "¿Qué tipo de soporte ofrecen?",
    answer:
      "Soporte dedicado para todos los clientes. Sumamos capacitación inicial para tu equipo, sesiones de onboarding personalizadas y acceso a tutoriales y buenas prácticas de executive search, para que le saques provecho desde el primer día.",
  },
];

export function FAQ() {
  return (
    <section className="relative overflow-x-hidden py-32 bg-canvas">
      <div className="relative z-10 mx-auto max-w-4xl px-6 lg:px-8">
        <div className="mb-16 text-center">
          <Reveal>
            <Eyebrow className="mb-6">FAQ</Eyebrow>
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
                    "data-[state=open]:border-accent/20",
                  )}
                >
                  <AccordionTrigger className="cursor-pointer px-8 py-6 text-left font-display text-lg font-semibold text-ink hover:no-underline [&[data-state=open]>svg]:rotate-180">
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
