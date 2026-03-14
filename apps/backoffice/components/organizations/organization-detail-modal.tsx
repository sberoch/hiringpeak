"use client";

import { useQuery } from "@tanstack/react-query";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table";
import { Skeleton } from "@workspace/ui/components/skeleton";
import {
  ORGANIZATIONS_API_KEY,
  getOrganizationDetail,
} from "@/lib/api/organization";

interface OrganizationDetailModalProps {
  organizationId: number | null;
  onClose: () => void;
}

export function OrganizationDetailModal({
  organizationId,
  onClose,
}: OrganizationDetailModalProps) {
  const isOpen = organizationId != null;

  const { data: org, isLoading } = useQuery({
    queryKey: [ORGANIZATIONS_API_KEY, "detail", organizationId],
    queryFn: () => getOrganizationDetail(organizationId!),
    enabled: isOpen,
  });

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isLoading ? (
              <Skeleton className="h-7 w-48" />
            ) : (
              org?.name ?? "Detalle de organización"
            )}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : org ? (
          <div className="space-y-6">
            <section>
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Usuarios
              </h3>
              {org.users.length > 0 ? (
                <div className="rounded-md border border-gray-200 dark:border-gray-700 overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Email</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {org.users.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">
                            {user.name}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {user.email}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground py-3">
                  No hay usuarios en esta organización.
                </p>
              )}
            </section>

            <section>
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Metadata
              </h3>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                <div>
                  <dt className="text-muted-foreground">ID</dt>
                  <dd className="font-medium">{org.id}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Creado</dt>
                  <dd className="font-medium">
                    {org.createdAt
                      ? new Date(org.createdAt).toLocaleString()
                      : "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Actualizado</dt>
                  <dd className="font-medium">
                    {org.updatedAt
                      ? new Date(org.updatedAt).toLocaleString()
                      : "—"}
                  </dd>
                </div>
              </dl>
            </section>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
