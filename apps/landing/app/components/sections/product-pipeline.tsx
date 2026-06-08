import { ProductShowcase } from "@/app/components/sections/product-showcase";

const items = [
  "Etapas que configurás según cada búsqueda",
  "El estado y el progreso de cada candidato, de un vistazo",
  "Tu equipo trabajando sobre la misma información, en tiempo real",
];

export function ProductPipeline() {
  return (
    <ProductShowcase
      id="producto"
      eyebrow="Pipeline Visual"
      title="Toda tu búsqueda, de un vistazo"
      description="Un tablero con las etapas que vos definís para cada búsqueda. Movés candidatos de una etapa a la otra y seguís en tiempo real cómo avanza tu equipo."
      items={items}
      image={{
        src: "/images/screenshots-from-app/app-vacancy-detail.png",
        alt: "Tablero de candidatos por etapa de una vacante",
        width: 1414,
        height: 1028,
      }}
    />
  );
}
