"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { File as FileIcon, Upload } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import {
  editCandidateFormSchema,
  type EditCandidateFormSchema,
} from "@/components/candidates/edit-candidate.schema";
import { AREA_API_KEY, getAllAreas } from "@/lib/api/area";
import { CANDIDATE_API_KEY, updateCandidate } from "@/lib/api/candidate";
import {
  CANDIDATE_FILE_API_KEY,
  createCandidateFile,
} from "@/lib/api/candidate-file";
import {
  CANDIDATE_SOURCE_API_KEY,
  getAllCandidateSources,
} from "@/lib/api/candidate-source";
import { getAllIndustries, INDUSTRY_API_KEY } from "@/lib/api/industry";
import { getAllSeniorities, SENIORITY_API_KEY } from "@/lib/api/seniority";
import { CANDIDATE_VACANCY_API_KEY } from "@/lib/api/candidate-vacancy";
import countries from "@/public/assets/countries.json";
import languages from "@/public/assets/languages.json";
import provinces from "@/public/assets/provinces.json";
import {
  generateCandidateFilePath,
  generateCandidateImagePath,
  getPublicUrl,
  uploadFile,
} from "@/lib/firebase/utils";
import type {
  Candidate,
  CandidateFile,
  UpdateCandidateDto,
} from "@workspace/shared/types/candidate";

import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { FileInput, FileUploader } from "@workspace/ui/components/file-upload";
import {
  Form,
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

interface EditCandidateFormProps {
  candidate: Candidate;
}

export default function EditCandidateForm({ candidate }: EditCandidateFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [image, setImage] = useState<File | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(
    candidate.image || null
  );
  const [imageUrl, setImageUrl] = useState<string | null>(
    candidate.image || null
  );
  const [files, setFiles] = useState<File[] | null>(null);
  const [fileUrls, setFileUrls] = useState<string[]>([]);
  const [existingFiles, setExistingFiles] = useState<CandidateFile[]>(
    candidate.files || []
  );
  const [ageValue, setAgeValue] = useState<number | null>(null);
  const [hasManuallyChangedImage, setHasManuallyChangedImage] = useState(false);

  const queryClient = useQueryClient();
  const searchParams = useSearchParams();

  const linkedinData = useMemo(() => {
    const pageUrl = searchParams.get("pageUrl");
    const fullName = searchParams.get("fullName");
    const currentPosition = searchParams.get("currentPosition");
    const email = searchParams.get("email");
    const phone = searchParams.get("phone");
    const profilePicture = searchParams.get("profilePicture");

    if (pageUrl && pageUrl.includes("linkedin.com")) {
      return {
        name: fullName || "",
        shortDescription: currentPosition || "",
        email: email || "",
        phone: phone || "",
        linkedin: pageUrl || "",
        profilePicture: profilePicture || null,
      };
    }

    return null;
  }, [searchParams]);

  const { data: areas } = useQuery({
    queryKey: [AREA_API_KEY, { limit: 1e9, page: 1 }],
    queryFn: () => getAllAreas({ limit: 1e9, page: 1 }),
  });

  const { data: industries } = useQuery({
    queryKey: [INDUSTRY_API_KEY, { limit: 1e9, page: 1 }],
    queryFn: () => getAllIndustries({ limit: 1e9, page: 1 }),
  });

  const { data: seniorities } = useQuery({
    queryKey: [SENIORITY_API_KEY, { limit: 1e9, page: 1 }],
    queryFn: () => getAllSeniorities({ limit: 1e9, page: 1 }),
  });

  const { data: sources } = useQuery({
    queryKey: [CANDIDATE_SOURCE_API_KEY, { limit: 1e9, page: 1 }],
    queryFn: () => getAllCandidateSources({ limit: 1e9, page: 1 }),
  });

  const updateCandidateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateCandidateDto }) =>
      updateCandidate(id, data),
    onSuccess: () => {
      queryClient.refetchQueries({
        queryKey: [CANDIDATE_API_KEY],
        exact: false,
      });
      queryClient.refetchQueries({
        queryKey: [CANDIDATE_VACANCY_API_KEY],
        exact: false,
      });
    },
  });

  const createCandidateFileMutation = useMutation({
    mutationFn: createCandidateFile,
    onSuccess: () => {
      queryClient.refetchQueries({
        queryKey: [CANDIDATE_FILE_API_KEY],
        exact: false,
      });
    },
  });

  const form = useForm<EditCandidateFormSchema>({
    resolver: zodResolver(editCandidateFormSchema),
    defaultValues: {
      name: candidate.name,
      email: candidate.email || "",
      linkedin: candidate.linkedin || "",
      shortDescription: candidate.shortDescription || "",
      dateOfBirth: candidate.dateOfBirth || "",
      gender: candidate.gender || "",
      phone: candidate.phone || "",
      address: candidate.address || "",
      seniorities: candidate.seniorities || [],
      areas: candidate.areas || [],
      industries: candidate.industries || [],
      source: candidate.source,
      countries: candidate.countries || [],
      provinces: candidate.provinces || [],
      languages: candidate.languages || [],
    },
  });

  const selectedCountries = form.watch("countries");
  const availableProvinces = provinces
    .filter((p) => selectedCountries.includes(p.country))
    .flatMap((p) => p.provinces);

  useEffect(() => {
    if (candidate.dateOfBirth) {
      const birthDate = new Date(candidate.dateOfBirth);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age -= 1;
      }
      setAgeValue(age);
    }
  }, [candidate.dateOfBirth]);

  useEffect(() => {
    if (linkedinData) {
      if (linkedinData.name) form.setValue("name", linkedinData.name);
      if (linkedinData.email) form.setValue("email", linkedinData.email);
      if (linkedinData.linkedin) form.setValue("linkedin", linkedinData.linkedin);
      if (linkedinData.shortDescription)
        form.setValue("shortDescription", linkedinData.shortDescription);
      if (linkedinData.phone) form.setValue("phone", linkedinData.phone);
    }
  }, [linkedinData, form]);

  useEffect(() => {
    if (linkedinData?.profilePicture && !hasManuallyChangedImage) {
      setImageSrc(linkedinData.profilePicture);
      setImageUrl(linkedinData.profilePicture);
    }
  }, [linkedinData, hasManuallyChangedImage]);

  async function onSubmit(values: EditCandidateFormSchema) {
    setIsLoading(true);

    if (!values.dateOfBirth) delete values.dateOfBirth;

    try {
      let newFileIds: number[] = [];
      if (files && files.length > 0 && fileUrls.length > 0) {
        const fileCreationPromises = files.map(async (file, index) => {
          if (fileUrls[index]) {
            return createCandidateFileMutation.mutateAsync({
              name: file.name,
              url: fileUrls[index],
            });
          }
          return null;
        });

        const createdFiles = await Promise.all(fileCreationPromises);
        newFileIds = createdFiles
          .filter((file): file is CandidateFile => file !== null)
          .map((file) => file.id);
      }

      const allFileIds = [...existingFiles.map((f) => f.id), ...newFileIds];

      const candidateData: UpdateCandidateDto = {
        ...values,
        image: imageUrl || undefined,
        fileIds: allFileIds,
        seniorityIds: values.seniorities.map((s) => s.id),
        areaIds: values.areas.map((a) => a.id),
        industryIds: values.industries.map((i) => i.id),
        sourceId: values.source.id,
      };

      await updateCandidateMutation.mutateAsync({
        id: candidate.id,
        data: candidateData,
      });

      toast.success("Candidato actualizado exitosamente");
      router.push(`/candidates/${candidate.id}`);
    } catch (error) {
      console.error("Error updating candidate:", error);
      toast.error(
        "Error al actualizar el candidato. Por favor, inténtelo de nuevo."
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader className="pb-0">
          <CardTitle>Información del Postulante</CardTitle>
          <CardDescription>
            Modifique los datos del postulante. Los campos con * son
            obligatorios.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2 mt-4">
              <input type="hidden" name="removeAutocomplete" />
              <div className="flex flex-col lg:flex-row gap-3">
                <div className="flex justify-center lg:justify-start">
                  <FileUploader
                    value={image ? [image] : null}
                    onValueChange={async (files) => {
                      setImage(files && files.length > 0 ? files[0] : null);
                      setHasManuallyChangedImage(true);
                      if (files && files.length > 0) {
                        const file = files[0];
                        setImageSrc(URL.createObjectURL(file));
                        try {
                          const uploadedFile = await uploadFile(
                            file,
                            generateCandidateImagePath(file.name)
                          );
                          const publicUrl = await getPublicUrl(uploadedFile.path);
                          setImageUrl(publicUrl);
                        } catch (error) {
                          console.error("Error uploading image:", error);
                          toast.error("Error al subir imagen");
                        }
                      }
                    }}
                    dropzoneOptions={{
                      accept: {
                        "image/jpeg": [".jpg", ".jpeg"],
                        "image/png": [".png"],
                      },
                      maxSize: 5 * 1024 * 1024,
                      multiple: false,
                      maxFiles: 2,
                    }}
                    className="w-full h-full lg:w-48 lg:h-48"
                  >
                    {imageSrc ? (
                      <div className="relative group">
                        <Image
                          src={imageSrc}
                          alt="Imagen del candidato"
                          width={100}
                          height={100}
                          className="w-48 h-48 object-cover rounded-lg"
                          unoptimized={!candidate.image}
                        />
                        <div
                          className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg cursor-pointer"
                          onClick={() => {
                            setImage(null);
                            setImageSrc(null);
                            setHasManuallyChangedImage(true);
                          }}
                        >
                          <span className="text-white font-medium">
                            Cambiar imagen
                          </span>
                        </div>
                      </div>
                    ) : (
                      <FileInput className="min-h-32 h-full flex flex-col items-center justify-center w-full border-2 border-dashed rounded-lg bg-muted/50 hover:bg-muted p-4">
                        <Upload className="w-8 h-8 mb-4 text-muted-foreground" />
                        <p className="mb-2 text-sm text-muted-foreground">
                          Haga clic para cargar
                        </p>
                        <p className="text-xs text-muted-foreground">
                          JPG, PNG (MAX. 5MB)
                        </p>
                      </FileInput>
                    )}
                  </FileUploader>
                </div>

                <div className="flex flex-col w-full gap-2">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-3 gap-y-2">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nombre *</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Nombre completo"
                              {...field}
                              autoComplete="removeAutocomplete"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="linkedin"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Perfil de LinkedIn</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="URL de LinkedIn"
                              type="url"
                              {...field}
                              autoComplete="removeAutocomplete"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="shortDescription"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Descripción</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Trabajo actual / Descripción corta"
                              {...field}
                              autoComplete="removeAutocomplete"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Correo electrónico</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Email"
                              type="email"
                              {...field}
                              autoComplete="removeAutocomplete"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                    <FormField
                      control={form.control}
                      name="dateOfBirth"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Edad</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="1"
                              max="120"
                              placeholder="Edad (años)"
                              value={ageValue || ""}
                              onChange={(e) => {
                                const age = parseInt(e.target.value);
                                setAgeValue(age);
                                if (!isNaN(age)) {
                                  const currentDate = new Date();
                                  const birthYear =
                                    currentDate.getFullYear() - age;
                                  const dateOfBirth = `${birthYear}-01-01`;
                                  field.onChange(dateOfBirth);
                                }
                              }}
                              autoComplete="removeAutocomplete"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="gender"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Género *</FormLabel>
                          <FormControl>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                              autoComplete="removeAutocomplete"
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccione un género" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="male">Masculino</SelectItem>
                                <SelectItem value="female">Femenino</SelectItem>
                                <SelectItem value="other">Otro</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Teléfono</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="+54 11 1234-5678"
                              {...field}
                              autoComplete="removeAutocomplete"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <FormField
                  control={form.control}
                  name="countries"
                  render={({ field }) => (
                    <FormItem className="flex flex-col gap-y-1 pt-1">
                      <FormLabel>País(es) *</FormLabel>
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
                  name="provinces"
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
                  name="languages"
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
              <div className="grid grid-cols-1 lg:grid-cols-6 gap-3">
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem className="lg:col-span-3">
                      <FormLabel>Localidad</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Av. Ejemplo 123, CABA, Argentina"
                          type="text"
                          {...field}
                          autoComplete="removeAutocomplete"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="source"
                  render={({ field }) => (
                    <FormItem className="lg:col-span-3">
                      <FormLabel>Fuente *</FormLabel>
                      <FormControl>
                        <Select
                          onValueChange={(value) => {
                            const selectedId = parseInt(value);
                            const selectedSource = sources?.items.find(
                              (s) => s.id === selectedId
                            );
                            if (selectedSource) {
                              field.onChange(selectedSource);
                            }
                          }}
                          value={field.value?.id?.toString() || ""}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccione una fuente" />
                          </SelectTrigger>
                          <SelectContent>
                            {sources?.items.map((source) => (
                              <SelectItem
                                key={source.id}
                                value={source.id.toString()}
                              >
                                {source.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="seniorities"
                  render={({ field }) => (
                    <FormItem className="lg:col-span-2">
                      <FormLabel>Seniority *</FormLabel>
                      <FormControl>
                        <MultiSelector
                          values={field.value.map((s) => s.name)}
                          onValuesChange={(values) => {
                            const selectedSeniorities =
                              seniorities?.items.filter((s) =>
                                values.includes(s.name)
                              ) || [];
                            field.onChange(selectedSeniorities);
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
                      <FormMessage className="-translate-y-14" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="areas"
                  render={({ field }) => (
                    <FormItem className="lg:col-span-2">
                      <FormLabel>Área *</FormLabel>
                      <FormControl>
                        <MultiSelector
                          values={field.value.map((a) => a.name)}
                          onValuesChange={(values) => {
                            const selectedAreas =
                              areas?.items.filter((a) =>
                                values.includes(a.name)
                              ) || [];
                            field.onChange(selectedAreas);
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
                      <FormMessage className="-translate-y-14" />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="industries"
                  render={({ field }) => (
                    <FormItem className="lg:col-span-2">
                      <FormLabel>Industria *</FormLabel>
                      <FormControl>
                        <MultiSelector
                          values={field.value.map((i) => i.name)}
                          onValuesChange={(values) => {
                            const selectedIndustries =
                              industries?.items.filter((i) =>
                                values.includes(i.name)
                              ) || [];
                            field.onChange(selectedIndustries);
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
                      <FormMessage className="-translate-y-14" />
                    </FormItem>
                  )}
                />
              </div>
              <div className="space-y-2">
                <FormLabel>Archivos (CV, psicotécnico, etc.)</FormLabel>
                <div className="flex flex-wrap gap-4">
                  <FileUploader
                    value={files}
                    onValueChange={async (newFiles) => {
                      setFiles(newFiles);
                      if (newFiles && newFiles.length > 0) {
                        const uploadPromises = newFiles.map(async (file) => {
                          const uploadedFile = await uploadFile(
                            file,
                            generateCandidateFilePath(file.name)
                          );
                          return await getPublicUrl(uploadedFile.path);
                        });

                        try {
                          const urls = await Promise.all(uploadPromises);
                          setFileUrls(urls);
                        } catch (error) {
                          console.error("Error uploading files:", error);
                          toast.error("Error al subir archivos");
                        }
                      } else {
                        setFileUrls([]);
                      }
                    }}
                    dropzoneOptions={{
                      accept: {
                        "application/pdf": [".pdf"],
                        "application/msword": [".doc"],
                        "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
                          [".docx"],
                        "image/jpeg": [".jpg", ".jpeg"],
                        "image/png": [".png"],
                      },
                      maxSize: 10 * 1024 * 1024,
                      multiple: true,
                      maxFiles: 5,
                    }}
                    className="w-full lg:w-44 h-32 flex-shrink-0"
                  >
                    <FileInput className="w-full lg:w-44 h-32 flex flex-col items-center justify-center border-2 border-dashed rounded-lg bg-muted/50 hover:bg-muted p-2">
                      <Upload className="w-6 h-6 mb-2 text-muted-foreground" />
                      <p className="text-xs text-center text-muted-foreground font-semibold">
                        Cargar archivos
                      </p>
                      <p className="text-xs text-center text-muted-foreground">
                        PDF, DOCX, JPG
                      </p>
                    </FileInput>
                  </FileUploader>

                  {existingFiles.map((file, index) => (
                    <div
                      key={`existing-${file.id}`}
                      className="w-full lg:w-44 h-32 flex flex-col items-center justify-center border-2 border-solid rounded-lg bg-background p-2 relative group cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => {
                        if (file.url) {
                          window.open(file.url, "_blank");
                        }
                      }}
                    >
                      <FileIcon className="h-8 w-8 mb-2 text-muted-foreground" />
                      <span className="text-xs text-center font-medium truncate w-full px-1 text-blue-700 hover:text-blue-500">
                        {file.name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Archivo existente
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setExistingFiles(
                            existingFiles.filter((_, i) => i !== index)
                          );
                        }}
                        className="absolute top-1 right-1 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        ×
                      </button>
                    </div>
                  ))}

                  {files && files.length > 0 && (
                    <>
                      {files.map((file, index) => (
                        <div
                          key={`new-${index}`}
                          className="w-full lg:w-44 h-32 flex flex-col items-center justify-center border-2 border-solid rounded-lg bg-background p-2 relative group cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() => {
                            if (fileUrls[index]) {
                              window.open(fileUrls[index], "_blank");
                            }
                          }}
                        >
                          <FileIcon className="h-8 w-8 mb-2 text-muted-foreground" />
                          <span className="text-xs text-center font-medium truncate w-full px-1 text-blue-700 hover:text-blue-500">
                            {file.name}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {(file.size / 1024).toFixed(0)} KB
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              const newFiles = files.filter((_, i) => i !== index);
                              const newUrls = fileUrls.filter((_, i) => i !== index);
                              setFiles(newFiles.length > 0 ? newFiles : null);
                              setFileUrls(newUrls);
                            }}
                            className="absolute top-1 right-1 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </div>
              <div className="flex justify-end space-x-4 pt-4">
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => router.push(`/candidates/${candidate.id}`)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Guardando..." : "Guardar cambios"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
