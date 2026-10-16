"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";

import type { LostReasonWithUsage } from "@workspace/shared/types/opportunity";
import {
  createLostReason,
  deleteLostReason,
  getLostReasons,
  LOST_REASON_API_KEY,
  OPPORTUNITY_API_KEY,
  updateLostReason,
} from "@/lib/api/opportunity";
import { SortableCatalogSettings } from "./commercial-settings-shared";

export default function LostReasonsSettings() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: [LOST_REASON_API_KEY],
    queryFn: getLostReasons,
  });

  return (
    <SortableCatalogSettings<LostReasonWithUsage>
      items={data}
      isLoading={isLoading}
      actions={{
        create: (name) => createLostReason({ name }),
        rename: (id, name) => updateLostReason(id, { name }),
        move: (id, sort) => updateLostReason(id, { sort }),
        remove: deleteLostReason,
        // Lost Reason names show on lost Opportunities, so refresh those too.
        invalidate: () =>
          Promise.all([
            queryClient.invalidateQueries({ queryKey: [LOST_REASON_API_KEY] }),
            queryClient.invalidateQueries({ queryKey: [OPPORTUNITY_API_KEY] }),
          ]),
        showOrder: (ordered) =>
          queryClient.setQueryData([LOST_REASON_API_KEY], ordered),
        usageOf: (reason) => reason.opportunityCount,
      }}
      copy={{
        searchPlaceholder: "Buscar motivos de pérdida...",
        noMatch: "No se encontraron motivos con ese nombre.",
        empty: "Todavía no hay motivos de pérdida.",
        created: "Motivo de pérdida creado correctamente",
        updated: "Motivo de pérdida actualizado correctamente",
        deleted: "Motivo de pérdida eliminado correctamente",
        createError: "Error al crear el motivo de pérdida",
        updateError: "Error al actualizar el motivo de pérdida",
        deleteError: "Error al eliminar el motivo de pérdida",
        addTitle: "Agregar Motivo de Pérdida",
        addDescription: "Ingresá el nombre del nuevo motivo.",
        addPlaceholder: "Ej. Contrataron internamente",
        editTitle: "Editar Motivo de Pérdida",
        editDescription:
          "Las oportunidades perdidas con este motivo muestran el nombre nuevo.",
        usage: { one: "perdida", many: "perdidas" },
        inUse: (n, name) =>
          `${n} ${n === 1 ? "oportunidad perdida usa" : "oportunidades perdidas usan"} «${name}». Reasignalas antes de eliminarlo.`,
        confirmDelete: (name) => `Se eliminará el motivo «${name}».`,
        keepOne: {
          rowTitle: "Tiene que quedar al menos un motivo",
          note: "Es el único motivo: no se puede eliminar. Agregá otro primero.",
        },
      }}
    />
  );
}
