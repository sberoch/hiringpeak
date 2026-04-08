import { CATALOG_TYPE_COLORS, type CatalogTagType } from "@/lib/utils";

interface CatalogBadgeProps {
  label: string;
  type: CatalogTagType;
}

export function CatalogBadge({ label, type }: CatalogBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[11px] font-medium ${CATALOG_TYPE_COLORS[type]}`}
    >
      {label}
    </span>
  );
}
