"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";

import type { PaginatedResponse } from "@workspace/shared/types/api";
import type { ContactSourceWithUsage } from "@workspace/shared/types/contact-source";
import { CONTACT_API_KEY } from "@/lib/api/contact";
import {
  ALL_CONTACT_SOURCES,
  CONTACT_SOURCE_API_KEY,
  createContactSource,
  deleteContactSource,
  getContactSources,
  updateContactSource,
} from "@/lib/api/contact-source";
import { SortableCatalogSettings } from "./commercial-settings-shared";

const QUERY_KEY = [CONTACT_SOURCE_API_KEY, ALL_CONTACT_SOURCES];

/** "Orígenes de contacto": a sortable list, like "Motivos de pérdida". */
export default function ContactSourcesSettings() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => getContactSources(ALL_CONTACT_SOURCES),
  });

  return (
    <SortableCatalogSettings<ContactSourceWithUsage>
      items={data?.items}
      isLoading={isLoading}
      actions={{
        create: (name, sort) => createContactSource({ name, sort }),
        rename: (id, name) => updateContactSource(id, { name }),
        move: (id, sort) => updateContactSource(id, { sort }),
        remove: deleteContactSource,
        // Source names show on Contacts, so refresh those too.
        invalidate: () =>
          Promise.all([
            queryClient.invalidateQueries({
              queryKey: [CONTACT_SOURCE_API_KEY],
            }),
            queryClient.invalidateQueries({ queryKey: [CONTACT_API_KEY] }),
          ]),
        showOrder: (ordered) =>
          queryClient.setQueryData<PaginatedResponse<ContactSourceWithUsage>>(
            QUERY_KEY,
            (current) => current && { ...current, items: ordered },
          ),
        usageOf: (source) => source.contactCount,
      }}
      copy={{
        searchPlaceholder: "Buscar orígenes...",
        noMatch: "No se encontraron orígenes con ese nombre.",
        empty: "Todavía no hay orígenes.",
        created: "Origen creado correctamente",
        updated: "Origen actualizado correctamente",
        deleted: "Origen eliminado correctamente",
        createError: "Error al crear el origen",
        updateError: "Error al actualizar el origen",
        deleteError: "Error al eliminar el origen",
        addTitle: "Agregar origen de contacto",
        addDescription: "Ingresá el nombre del nuevo origen.",
        addPlaceholder: "Ej. Conferencia anual",
        editTitle: "Editar origen de contacto",
        editDescription:
          "Los contactos con este origen muestran el nombre nuevo.",
        usage: { one: "contacto", many: "contactos" },
        inUse: (n, name) =>
          `${n} ${n === 1 ? "contacto tiene" : "contactos tienen"} el origen «${name}». Cambiáselo antes de eliminarlo.`,
        confirmDelete: (name) => `Se eliminará el origen «${name}».`,
      }}
    />
  );
}
