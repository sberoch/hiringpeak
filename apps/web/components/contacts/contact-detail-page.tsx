"use client";

import { useQuery } from "@tanstack/react-query";
import { BookUser, Edit, FileText, Handshake, Info, Trash } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";

import { Button } from "@workspace/ui/components/button";
import { PageHeading } from "@workspace/ui/components/page-heading";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs";
import { PermissionCode } from "@workspace/shared/enums";
import { hasCommercialAccess } from "@workspace/shared/lib/commercial-access";
import { canManageContacts } from "@workspace/shared/lib/contact-access";
import type { NetworkContact } from "@workspace/shared/types/contact";

import { ContactInteractionsTab } from "@/components/interactions/interaction-lists";
import { usePermissions } from "@/contexts/permission-context";
import { CONTACT_API_KEY, getContactById } from "@/lib/api/contact";
import { ContactAvatar, CopyChip, LinkedinLink } from "./contact-atoms";
import { ContactCaptureSheet } from "./contact-capture-sheet";
import { ContactOpportunitiesTab } from "./contact-opportunities-tab";
import { useCurrentUserId } from "./contact-lookups";
import { NoCommercialAccess } from "./contacts-page";
import { CreateOpportunityDialog } from "./create-opportunity-dialog";
import { SourceBadge } from "./contact-table-columns";
import { DeleteContactDialog } from "./delete-contact-dialog";

/** The Contact page's tabs; a later ticket adds Seguimientos. */
type ContactTab = "resumen" | "interacciones" | "oportunidades";

const CONTACT_TABS: { key: ContactTab; label: string }[] = [
  { key: "resumen", label: "Resumen" },
  { key: "interacciones", label: "Interacciones" },
  { key: "oportunidades", label: "Oportunidades" },
];

/** A Contact's page (commercial access only). */
export function ContactDetailPage({ id }: { id: number }) {
  const { permissionCodes, isLoading } = usePermissions();
  if (isLoading) return null;
  if (!hasCommercialAccess(permissionCodes)) return <NoCommercialAccess />;
  return (
    <ContactDetail
      id={id}
      canManage={canManageContacts(permissionCodes)}
      canCreateOpportunity={permissionCodes.includes(PermissionCode.CRM_MANAGE)}
    />
  );
}

function ContactDetail({
  id,
  canManage,
  canCreateOpportunity,
}: {
  id: number;
  canManage: boolean;
  canCreateOpportunity: boolean;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<ContactTab>("resumen");
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [createOpportunityOpen, setCreateOpportunityOpen] = useState(false);
  const {
    data: contact,
    isLoading,
    isError,
  } = useQuery({
    queryKey: [CONTACT_API_KEY, id],
    queryFn: () => getContactById(id),
  });

  if (isError || (!isLoading && !contact)) {
    return (
      <div className="rounded-2xl border border-brand-border bg-surface p-6">
        <h2 className="text-lg font-bold tracking-tight text-ink">
          Contacto no encontrado
        </h2>
        <p className="mt-1 text-sm text-slate-brand">
          No existe un contacto con este identificador.
        </p>
        <Button asChild className="mt-4">
          <Link href="/contacts">Volver a contactos</Link>
        </Button>
      </div>
    );
  }
  if (!contact) {
    return (
      <div className="h-10 w-72 animate-pulse rounded-xl bg-brand-border-light" />
    );
  }

  return (
    <div className="min-w-0 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="brand-ghost"
            className="h-10 bg-white px-4 text-sm font-medium"
            onClick={() => router.back()}
          >
            ← Volver
          </Button>
          <PageHeading
            icon={BookUser}
            title={contact.name}
            description={[contact.role, contact.company?.name ?? "Sin empresa"]
              .filter(Boolean)
              .join(" · ")}
          />
        </div>
        {(canManage || canCreateOpportunity) && (
          <div className="flex flex-wrap items-center gap-2">
            {canCreateOpportunity && (
              <Button
                size="sm"
                variant="brand-outline"
                className="bg-white"
                onClick={() => setCreateOpportunityOpen(true)}
              >
                <Handshake className="mr-1.5 h-4 w-4" />
                Crear oportunidad
              </Button>
            )}
            {canManage && (
              <>
                <Button
                  size="sm"
                  variant="brand-ghost"
                  className="bg-white"
                  onClick={() => setEditOpen(true)}
                >
                  <Edit className="mr-1.5 h-4 w-4" />
                  Editar
                </Button>
                <Button
                  variant="brand-ghost"
                  size="sm"
                  className="bg-white text-red-600 hover:border-red-200 hover:bg-red-50"
                  onClick={() => setDeleteOpen(true)}
                >
                  <Trash className="mr-1.5 h-4 w-4" />
                  Eliminar
                </Button>
              </>
            )}
          </div>
        )}
      </div>

      <Tabs
        value={tab}
        onValueChange={(value) => setTab(value as ContactTab)}
        className="gap-5"
      >
        <TabsList className="h-auto w-full justify-start gap-1 rounded-none border-b border-brand-border bg-transparent p-0">
          {CONTACT_TABS.map((item) => (
            <TabsTrigger
              key={item.key}
              value={item.key}
              className="-mb-px h-10 flex-none rounded-none border-0 border-b-2 border-transparent bg-transparent px-3 text-sm font-semibold text-slate-brand shadow-none data-[state=active]:border-electric data-[state=active]:bg-transparent data-[state=active]:text-ink data-[state=active]:shadow-none"
            >
              {item.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="resumen">
          <ContactSummary contact={contact} />
        </TabsContent>

        <TabsContent value="interacciones">
          <ContactInteractionsTab contact={contact} />
        </TabsContent>

        <TabsContent value="oportunidades">
          <ContactOpportunitiesTab
            contact={contact}
            canCreate={canCreateOpportunity}
            onCreate={() => setCreateOpportunityOpen(true)}
          />
        </TabsContent>
      </Tabs>

      {canManage && editOpen && (
        <ContactCaptureSheet
          open={editOpen}
          onOpenChange={setEditOpen}
          contact={contact}
        />
      )}
      {canCreateOpportunity && (
        <CreateOpportunityDialog
          contact={contact}
          open={createOpportunityOpen}
          onOpenChange={setCreateOpportunityOpen}
        />
      )}
      <DeleteContactDialog
        contact={deleteOpen ? contact : null}
        onClose={() => setDeleteOpen(false)}
        onDeleted={() => router.push("/contacts")}
      />
    </div>
  );
}

function ContactSummary({ contact }: { contact: NetworkContact }) {
  const me = useCurrentUserId();
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card icon={Info} title="Detalles">
        <div className="mb-4 flex items-center gap-3">
          <ContactAvatar name={contact.name} className="h-12 w-12 text-sm" />
          <div className="min-w-0 space-y-1">
            <CopyChip value={contact.email} kind="email" />
            <CopyChip value={contact.phone} kind="phone" />
            <LinkedinLink url={contact.linkedin} />
          </div>
        </div>
        <div className="space-y-3 text-sm">
          <Row label="Empresa">
            {contact.company ? (
              <Link
                href={`/companies/${contact.company.id}`}
                className="hover:text-electric"
              >
                {contact.company.name}
              </Link>
            ) : (
              <span className="text-muted-brand">Sin empresa</span>
            )}
          </Row>
          <Row label="Cargo">
            {contact.role || <span className="text-muted-brand">—</span>}
          </Row>
          <Row label="Origen">
            <SourceBadge source={contact.source} />
          </Row>
          <Row label="Responsable">
            {contact.owner ? (
              contact.owner.id === me ? (
                "Vos"
              ) : (
                contact.owner.name
              )
            ) : (
              <span className="text-muted-brand">Sin responsable</span>
            )}
          </Row>
          <Row label="Cargado el">
            {new Date(contact.createdAt).toLocaleDateString()}
          </Row>
        </div>
      </Card>

      <Card icon={FileText} title="Descripción">
        {contact.shortDescription ? (
          <div className="whitespace-pre-wrap text-sm leading-relaxed text-slate-brand">
            {contact.shortDescription}
          </div>
        ) : (
          <div className="text-sm italic text-muted-brand">Sin descripción</div>
        )}
      </Card>
    </div>
  );
}

function Card({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof Info;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-brand-border bg-surface p-6">
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-electric/10 text-electric">
          <Icon className="h-3.5 w-3.5" />
        </div>
        <h3 className="text-sm font-semibold text-ink">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <>
      <div className="flex justify-between gap-4">
        <span className="text-muted-brand">{label}</span>
        <span className="text-right font-medium text-ink">{children}</span>
      </div>
      <div className="h-px bg-brand-border-light last:hidden" />
    </>
  );
}
