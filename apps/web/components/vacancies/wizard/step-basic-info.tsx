"use client";

import { useQuery } from "@tanstack/react-query";
import type { UseFormReturn } from "react-hook-form";

import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@workspace/ui/components/form";
import { Input } from "@workspace/ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { Textarea } from "@workspace/ui/components/textarea";
import { COMPANIES_API_KEY, getAllCompanies } from "@/lib/api/company";
import { getAllUsers, USERS_API_KEY } from "@/lib/api/user";
import {
  getAllVacancyStatuses,
  VACANCY_STATUS_API_KEY,
} from "@/lib/api/vacancy-status";
import { CompanyStatusEnum } from "@workspace/shared/types/company";
import type { User } from "@workspace/shared/types/user";

import type { VacancyWizardFormSchema } from "./vacancy-wizard.schema";

interface StepBasicInfoProps {
  form: UseFormReturn<VacancyWizardFormSchema>;
  createdByDisabled?: boolean;
}

export function StepBasicInfo({
  form,
  createdByDisabled = false,
}: StepBasicInfoProps) {
  const { data: vacancyStatuses } = useQuery({
    queryKey: [VACANCY_STATUS_API_KEY, { limit: 1e9, page: 1 }],
    queryFn: () => getAllVacancyStatuses({ limit: 1e9, page: 1 }),
  });

  const { data: companies } = useQuery({
    queryKey: [
      COMPANIES_API_KEY,
      { limit: 1e9, page: 1, status: CompanyStatusEnum.ACTIVE },
    ],
    queryFn: () =>
      getAllCompanies({
        limit: 1e9,
        page: 1,
        status: CompanyStatusEnum.ACTIVE,
      }),
  });

  const { data: users } = useQuery({
    queryKey: [USERS_API_KEY, { limit: 1e9, page: 1 }],
    queryFn: () => getAllUsers({ limit: 1e9, page: 1 }),
  });

  const noCompanies = companies && companies.items.length === 0;

  return (
    <div className="space-y-5">
      <FormField
        control={form.control}
        name="company"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Empresa</FormLabel>
            <Select
              onValueChange={(value) => {
                const company = companies?.items.find(
                  (c) => c.id.toString() === value,
                );
                if (company) field.onChange(company);
              }}
              value={field.value?.id?.toString()}
              disabled={!!noCompanies}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      noCompanies
                        ? "No hay empresas activas"
                        : "Seleccione una empresa"
                    }
                  />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {companies?.items.map((company) => (
                  <SelectItem key={company.id} value={company.id.toString()}>
                    {company.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="title"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Título</FormLabel>
            <FormControl>
              <Input placeholder="Título de la vacante" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Estado</FormLabel>
              <Select
                onValueChange={(value) => {
                  const status = vacancyStatuses?.items.find(
                    (s) => s.id.toString() === value,
                  );
                  if (status) field.onChange(status);
                }}
                value={field.value?.id?.toString()}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione un estado" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {vacancyStatuses?.items.map((status) => (
                    <SelectItem key={status.id} value={status.id.toString()}>
                      {status.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="salary"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Compensación</FormLabel>
              <FormControl>
                <Input placeholder="$10,000,000" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="description"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Descripción</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Descripción de la vacante"
                className="min-h-[100px]"
                {...field}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="createdBy"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Generación</FormLabel>
              <Select
                onValueChange={(value) => {
                  const user = users?.items.find(
                    (u: User) => u.id.toString() === value,
                  );
                  if (user) field.onChange(user);
                }}
                value={field.value?.id?.toString()}
                disabled={createdByDisabled}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione un responsable" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {users?.items.map((user: User) => (
                    <SelectItem key={user.id} value={user.id.toString()}>
                      {user.name ?? user.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="assignedTo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ejecución</FormLabel>
              <Select
                onValueChange={(value) => {
                  const user = users?.items.find(
                    (u: User) => u.id.toString() === value,
                  );
                  if (user) field.onChange(user);
                }}
                value={field.value?.id?.toString()}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione un responsable" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {users?.items.map((user: User) => (
                    <SelectItem key={user.id} value={user.id.toString()}>
                      {user.name ?? user.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}
