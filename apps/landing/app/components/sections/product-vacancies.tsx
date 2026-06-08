import { ProductShowcase } from "@/app/components/sections/product-showcase";

const items = [
  "El estado y el avance de cada búsqueda",
  "Detalle y candidatos en una sola vista",
  "Creá y duplicá vacantes en segundos",
];

export function ProductVacancies() {
  return (
    <ProductShowcase
      eyebrow="Gestión de Vacantes"
      title="Todas tus búsquedas en un solo lugar"
      description="El listado completo de tus búsquedas con su estado, candidatos y detalle. Abrí cualquier vacante y mirá todo su proceso sin cambiar de pantalla."
      items={items}
      image={{
        src: "/images/screenshots-from-app/app-vacancies.png",
        alt: "Listado de vacantes con el detalle de una búsqueda seleccionada",
        width: 1422,
        height: 1019,
      }}
    />
  );
}
