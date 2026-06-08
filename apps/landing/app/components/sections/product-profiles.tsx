import { ProductShowcase } from "@/app/components/sections/product-showcase";

const items = [
  "Calificá cada candidato",
  "CVs e informes siempre a mano",
  "Notas y comentarios del equipo en cada perfil",
];

export function ProductProfiles() {
  return (
    <ProductShowcase
      eyebrow="Perfiles Ejecutivos"
      title="Conocé a tus candidatos en profundidad"
      description="Perfiles completos con calificación por estrellas, CVs y documentos adjuntos y las notas de tu equipo. Toda la información que necesitás para evaluar talento ejecutivo con criterio."
      items={items}
      imageRight
      image={{
        src: "/images/screenshots-from-app/app-candidates.png",
        alt: "Base de candidatos con calificación, áreas e industrias",
        width: 1415,
        height: 1013,
      }}
      sectionClassName="bg-canvas"
      accentClassName="text-accent-dark"
      lineClassName="from-accent-dark"
    />
  );
}
