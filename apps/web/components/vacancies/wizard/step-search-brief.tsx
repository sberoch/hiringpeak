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
  MultiSelector,
  MultiSelectorContent,
  MultiSelectorInput,
  MultiSelectorItem,
  MultiSelectorList,
  MultiSelectorTrigger,
} from "@workspace/ui/components/multi-select";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { AREAS_API_KEY, getAllAreas } from "@/lib/api/area";
import { getAllIndustries, INDUSTRIES_API_KEY } from "@/lib/api/industry";
import { getAllSeniorities, SENIORITY_API_KEY } from "@/lib/api/seniority";
import countries from "@/public/assets/countries.json";
import languages from "@/public/assets/languages.json";
import provinces from "@/public/assets/provinces.json";

import type { VacancyWizardFormSchema } from "./vacancy-wizard.schema";

interface StepSearchBriefProps {
  form: UseFormReturn<VacancyWizardFormSchema>;
}

export function StepSearchBrief({ form }: StepSearchBriefProps) {
  const { data: seniorities } = useQuery({
    queryKey: [SENIORITY_API_KEY, { limit: 1e9, page: 1 }],
    queryFn: () => getAllSeniorities({ limit: 1e9, page: 1 }),
  });

  const { data: areas } = useQuery({
    queryKey: [AREAS_API_KEY, { limit: 1e9, page: 1 }],
    queryFn: () => getAllAreas({ limit: 1e9, page: 1 }),
  });

  const { data: industries } = useQuery({
    queryKey: [INDUSTRIES_API_KEY, { limit: 1e9, page: 1 }],
    queryFn: () => getAllIndustries({ limit: 1e9, page: 1 }),
  });

  const selectedCountriesRaw = form.watch("filters.countries");
  const selectedCountries =
    selectedCountriesRaw && selectedCountriesRaw.length > 0
      ? selectedCountriesRaw
      : ["Argentina"];
  const availableProvinces = provinces
    .filter((p) => selectedCountries.includes(p.country))
    .flatMap((p) => p.provinces);

  return (
    <div className="space-y-5">
      <p className="text-sm text-slate-brand">
        Definí el perfil del candidato que buscás. Todos los campos son
        opcionales.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <FormField
          control={form.control}
          name="filters.seniorities"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Seniority</FormLabel>
              <FormControl>
                <MultiSelector
                  values={field.value?.map((s) => s.name) ?? []}
                  onValuesChange={(values) => {
                    const selected = values
                      .map(
                        (name) =>
                          seniorities?.items.find((s) => s.name === name) ??
                          null,
                      )
                      .filter((a): a is NonNullable<typeof a> => !!a);
                    field.onChange(selected);
                  }}
                >
                  <MultiSelectorTrigger>
                    <MultiSelectorInput placeholder="Seleccione seniorities" />
                  </MultiSelectorTrigger>
                  <MultiSelectorContent>
                    <MultiSelectorList className="bg-white">
                      {seniorities?.items.map((seniority) => (
                        <MultiSelectorItem
                          key={seniority.id}
                          value={seniority.name}
                          className="bg-white my-1"
                        >
                          {seniority.name}
                        </MultiSelectorItem>
                      ))}
                    </MultiSelectorList>
                  </MultiSelectorContent>
                </MultiSelector>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="filters.areas"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Áreas</FormLabel>
              <FormControl>
                <MultiSelector
                  values={field.value?.map((a) => a.name) ?? []}
                  onValuesChange={(values) => {
                    const selected = values
                      .map(
                        (name) =>
                          areas?.items.find((a) => a.name === name) ?? null,
                      )
                      .filter((a): a is NonNullable<typeof a> => !!a);
                    field.onChange(selected);
                  }}
                >
                  <MultiSelectorTrigger>
                    <MultiSelectorInput placeholder="Seleccione áreas" />
                  </MultiSelectorTrigger>
                  <MultiSelectorContent>
                    <MultiSelectorList className="bg-white">
                      {areas?.items.map((area) => (
                        <MultiSelectorItem
                          key={area.id}
                          value={area.name}
                          className="bg-white my-1"
                        >
                          {area.name}
                        </MultiSelectorItem>
                      ))}
                    </MultiSelectorList>
                  </MultiSelectorContent>
                </MultiSelector>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="filters.industries"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Industrias</FormLabel>
              <FormControl>
                <MultiSelector
                  values={field.value?.map((i) => i.name) ?? []}
                  onValuesChange={(values) => {
                    const selected = values
                      .map(
                        (name) =>
                          industries?.items.find((i) => i.name === name) ??
                          null,
                      )
                      .filter((a): a is NonNullable<typeof a> => !!a);
                    field.onChange(selected);
                  }}
                >
                  <MultiSelectorTrigger>
                    <MultiSelectorInput placeholder="Seleccione industrias" />
                  </MultiSelectorTrigger>
                  <MultiSelectorContent>
                    <MultiSelectorList className="bg-white">
                      {industries?.items.map((industry) => (
                        <MultiSelectorItem
                          key={industry.id}
                          value={industry.name}
                          className="bg-white my-1"
                        >
                          {industry.name}
                        </MultiSelectorItem>
                      ))}
                    </MultiSelectorList>
                  </MultiSelectorContent>
                </MultiSelector>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <FormField
          control={form.control}
          name="filters.countries"
          render={({ field }) => (
            <FormItem>
              <FormLabel>País(es)</FormLabel>
              <FormControl>
                <MultiSelector
                  values={field.value ?? []}
                  onValuesChange={field.onChange}
                >
                  <MultiSelectorTrigger>
                    <MultiSelectorInput placeholder="Seleccione países" />
                  </MultiSelectorTrigger>
                  <MultiSelectorContent>
                    <MultiSelectorList className="bg-white">
                      {countries.map((country) => (
                        <MultiSelectorItem
                          key={country.name}
                          value={country.name}
                          className="bg-white my-1"
                        >
                          {country.name}
                        </MultiSelectorItem>
                      ))}
                    </MultiSelectorList>
                  </MultiSelectorContent>
                </MultiSelector>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="filters.provinces"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Provincia(s)</FormLabel>
              <FormControl>
                <MultiSelector
                  values={field.value ?? []}
                  onValuesChange={field.onChange}
                >
                  <MultiSelectorTrigger>
                    <MultiSelectorInput placeholder="Seleccione provincias" />
                  </MultiSelectorTrigger>
                  <MultiSelectorContent>
                    <MultiSelectorList className="bg-white">
                      {availableProvinces.map((province) => (
                        <MultiSelectorItem
                          key={province}
                          value={province}
                          className="bg-white my-1"
                        >
                          {province}
                        </MultiSelectorItem>
                      ))}
                    </MultiSelectorList>
                  </MultiSelectorContent>
                </MultiSelector>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="filters.languages"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Idioma(s)</FormLabel>
              <FormControl>
                <MultiSelector
                  values={field.value ?? []}
                  onValuesChange={field.onChange}
                >
                  <MultiSelectorTrigger>
                    <MultiSelectorInput placeholder="Seleccione idiomas" />
                  </MultiSelectorTrigger>
                  <MultiSelectorContent>
                    <MultiSelectorList className="bg-white">
                      {languages.map((language) => (
                        <MultiSelectorItem
                          key={language.name}
                          value={language.name}
                          className="bg-white my-1"
                        >
                          {language.name}
                        </MultiSelectorItem>
                      ))}
                    </MultiSelectorList>
                  </MultiSelectorContent>
                </MultiSelector>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="filters.minStars"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Calificación mínima</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min="0"
                  max="5"
                  step="0.5"
                  placeholder="Ej: 3.5"
                  value={field.value ?? ""}
                  onChange={(e) => {
                    const value =
                      e.target.value === ""
                        ? null
                        : Number(e.target.value);
                    field.onChange(value);
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="filters.gender"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Género</FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value || "none"}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione un género" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="none">Sin preferencia</SelectItem>
                  <SelectItem value="male">Masculino</SelectItem>
                  <SelectItem value="female">Femenino</SelectItem>
                  <SelectItem value="other">Otro</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="filters.minAge"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Edad mínima</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min="18"
                  placeholder="Ej: 25"
                  value={field.value ?? ""}
                  onChange={(e) => {
                    const value =
                      e.target.value === ""
                        ? null
                        : Number(e.target.value);
                    field.onChange(value);
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="filters.maxAge"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Edad máxima</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min="18"
                  placeholder="Ej: 45"
                  value={field.value ?? ""}
                  onChange={(e) => {
                    const value =
                      e.target.value === ""
                        ? null
                        : Number(e.target.value);
                    field.onChange(value);
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}
