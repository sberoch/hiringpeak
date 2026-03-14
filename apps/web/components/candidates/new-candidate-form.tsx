"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { File as FileIcon, Upload } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type UseFormReturn } from "react-hook-form";
import { toast } from "sonner";

import {
  candidateFormSchema,
  type CandidateFormSchema,
} from "@/components/candidates/new-candidate.schema";
import { AREAS_API_KEY, getAllAreas } from "@/lib/api/area";
import {
  CANDIDATE_API_KEY,
  checkCandidateExists,
  createCandidate,
} from "@/lib/api/candidate";
import {
  CANDIDATE_FILE_API_KEY,
  createCandidateFile,
} from "@/lib/api/candidate-file";
import {
  CANDIDATE_SOURCE_API_KEY,
  getAllCandidateSources,
} from "@/lib/api/candidate-source";
import { COMMENT_API_KEY, createComment } from "@/lib/api/comment";
import { getAllIndustries, INDUSTRIES_API_KEY } from "@/lib/api/industry";
import { getAllSeniorities, SENIORITY_API_KEY } from "@/lib/api/seniority";
import {
  createCandidateVacancy,
  CANDIDATE_VACANCY_API_KEY,
} from "@/lib/api/candidate-vacancy";
import {
  getCandidateVacancyStatus,
  CANDIDATE_VACANCY_STATUS_API_KEY,
} from "@/lib/api/candidate-vacancy-status";
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
  CreateCandidateDto,
} from "@workspace/shared/types/candidate";

import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@workspace/ui/components/dialog";
import { FileInput, FileUploader } from "@workspace/ui/components/file-upload";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@workspace/ui/components/form";
import { Heading } from "@workspace/ui/components/heading";
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
import { Textarea } from "@workspace/ui/components/textarea";

export default function NewCandidateForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [image, setImage] = useState<File | undefined | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [files, setFiles] = useState<File[] | null>(null);
  const [fileUrls, setFileUrls] = useState<string[]>([]);
  const [ageValue, setAgeValue] = useState<number | null>(null);
  const [isDuplicateCandidate, setIsDuplicateCandidate] = useState(false);
  const [duplicateCandidate, setDuplicateCandidate] =
    useState<Candidate | null>(null);
  const [isCheckingDuplicate, setIsCheckingDuplicate] = useState(false);
  const [isCommentFocused, setIsCommentFocused] = useState(false);
  const [hasManuallyChangedImage, setHasManuallyChangedImage] = useState(false);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);

  const session = useSession();
  const queryClient = useQueryClient();

  const vacancyId = searchParams.get("vacancyId");
  const returnTo = searchParams.get("returnTo");

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
    queryKey: [AREAS_API_KEY, { limit: 1e9, page: 1 }],
    queryFn: () => getAllAreas({ limit: 1e9, page: 1 }),
  });

  const { data: industries } = useQuery({
    queryKey: [INDUSTRIES_API_KEY, { limit: 1e9, page: 1 }],
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

  const { data: candidateVacancyStatus } = useQuery({
    queryKey: [CANDIDATE_VACANCY_STATUS_API_KEY, { limit: 1e9, page: 1 }],
    queryFn: () => getCandidateVacancyStatus({ limit: 1e9, page: 1 }),
    enabled: !!vacancyId,
  });

  const createCandidateMutation = useMutation({
    mutationFn: createCandidate,
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

  const createCommentMutation = useMutation({
    mutationFn: createComment,
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: [COMMENT_API_KEY], exact: false });
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

  const createCandidateVacancyMutation = useMutation({
    mutationFn: createCandidateVacancy,
    onSuccess: () => {
      queryClient.refetchQueries({
        queryKey: [CANDIDATE_VACANCY_API_KEY],
        exact: false,
      });
    },
  });

  const getDefaultValues = (): Partial<CandidateFormSchema> => {
    const baseDefaults = {
      name: "",
      email: "",
      linkedin: "",
      shortDescription: "",
      dateOfBirth: "",
      gender: "",
      phone: "",
      seniorities: [],
      areas: [],
      industries: [],
      countries: [countries.find((c) => c.code === "ar")?.name || ""],
      provinces: [],
      languages: [],
      firstComment: "",
    };

    if (linkedinData) {
      return {
        ...baseDefaults,
        name: linkedinData.name,
        email: linkedinData.email,
        linkedin: linkedinData.linkedin,
        shortDescription: linkedinData.shortDescription,
        phone: linkedinData.phone,
      };
    }

    return baseDefaults;
  };

  const form: UseFormReturn<CandidateFormSchema> = useForm<CandidateFormSchema>({
    resolver: zodResolver(candidateFormSchema),
    defaultValues: getDefaultValues(),
  });

  const selectedCountries = form.watch("countries");
  const availableProvinces = provinces
    .filter((p) => selectedCountries.includes(p.country))
    .flatMap((p) => p.provinces);

  useEffect(() => {
    if (linkedinData && sources?.items && !form.getValues("source")) {
      const linkedinSource = sources.items.find(
        (source) => source.name.toLowerCase() === "linkedin"
      );
      if (linkedinSource) {
        form.setValue("source", linkedinSource);
      }
    }
  }, [sources, linkedinData, form]);

  useEffect(() => {
    if (
      linkedinData?.profilePicture &&
      !imageUrl &&
      !image &&
      !hasManuallyChangedImage
    ) {
      setImageUrl(linkedinData.profilePicture);
    }
  }, [linkedinData, imageUrl, image, hasManuallyChangedImage]);

  useEffect(() => {
    const checkForDuplicate = async () => {
      if (linkedinData?.name && linkedinData.name.trim()) {
        setIsCheckingDuplicate(true);
        try {
          const { exists, candidate } = await checkCandidateExists(
            linkedinData.name
          );
          if (exists && candidate) {
            setIsDuplicateCandidate(true);
            setDuplicateCandidate(candidate);
            setShowDuplicateModal(true);
          }
        } catch (error) {
          console.error("Error checking duplicate candidate:", error);
        } finally {
          setIsCheckingDuplicate(false);
        }
      }
    };

    checkForDuplicate();
  }, [linkedinData]);

  async function onSubmit(values: CandidateFormSchema) {
    if (!session.data?.userId) {
      toast.error("No se pudo obtener la información del usuario");
      return;
    }

    setIsLoading(true);

    try {
      let fileIds: number[] = [];
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
        fileIds = createdFiles
          .filter((file): file is CandidateFile => file !== null)
          .map((file) => file.id);
      }

      if (!values.dateOfBirth) delete values.dateOfBirth;

      const candidateData: CreateCandidateDto = {
        ...values,
        image: imageUrl || undefined,
        fileIds,
        seniorityIds: values.seniorities.map((s) => s.id),
        areaIds: values.areas.map((a) => a.id),
        industryIds: values.industries.map((i) => i.id),
        sourceId: values.source.id,
        isInCompanyViaPratt: false,
        stars: 0,
      };

      const newCandidate = await createCandidateMutation.mutateAsync(
        candidateData
      );

      if (values.firstComment && values.firstComment.trim()) {
        await createCommentMutation.mutateAsync({
          candidateId: newCandidate.id,
          userId: parseInt(session.data.userId),
          comment: values.firstComment,
        });
      }

      if (vacancyId && candidateVacancyStatus?.items.length) {
        const initialStatus =
          candidateVacancyStatus.items.find((status) => status.isInitial) ??
          candidateVacancyStatus.items[0]!;

        await createCandidateVacancyMutation.mutateAsync({
          candidateId: newCandidate.id,
          vacancyId: parseInt(vacancyId),
          candidateVacancyStatusId: initialStatus.id,
          notes: "",
        });
      }

      toast.success("Candidato creado exitosamente");

      if (returnTo) {
        router.push(returnTo);
      } else {
        router.push(`/candidates/${newCandidate.id}`);
      }
    } catch (error) {
      console.error("Error creating candidate:", error);
      toast.error(
        "Error al crear el candidato. Por favor, inténtelo de nuevo."
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Heading>Nuevo Postulante</Heading>

      <Card>
        <CardHeader className="pb-0">
          <CardTitle>Información del Postulante</CardTitle>
          <CardDescription>
            Ingrese los datos del nuevo candidato. Los campos con * son
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
                        try {
                          const file = files[0];
                          if (!file) return;
                          const uploadedFile = await uploadFile(
                            file,
                            generateCandidateImagePath(file.name)
                          );
                          const publicUrl = await getPublicUrl(uploadedFile.path);
                          setImageUrl(publicUrl);
                        } catch (error) {
                          console.error("Error uploading image:", error);
                          toast.error("Error al subir la imagen");
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
                    className="w-full h-full lg:w-[196px] lg:h-[196px]"
                  >
                    {image || imageUrl ? (
                      <div className="relative group">
                        <Image
                          src={imageUrl || (image ? URL.createObjectURL(image) : "")}
                          alt="Imagen del candidato"
                          width={400}
                          height={400}
                          className="w-full h-full lg:w-[196px] lg:h-[196px] object-cover rounded-lg"
                        />
                        <div
                          className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg cursor-pointer mt-1"
                          onClick={() => {
                            setImage(null);
                            setImageUrl(null);
                            setHasManuallyChangedImage(true);
                          }}
                        >
                          <span className="text-white font-medium">Cambiar imagen</span>
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

                <div className="flex flex-col w-full gap-3">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              placeholder="Nombre completo"
                              {...field}
                              autoComplete="removeAutocomplete"
                              onBlur={async (e) => {
                                field.onBlur();
                                const name = e.target.value.trim();
                                if (name) {
                                  setIsCheckingDuplicate(true);
                                  setIsDuplicateCandidate(false);
                                  try {
                                    const { exists, candidate } =
                                      await checkCandidateExists(name);
                                    setIsDuplicateCandidate(exists);
                                    setDuplicateCandidate(candidate);
                                  } catch (error) {
                                    console.error(
                                      "Error checking duplicate candidate:",
                                      error
                                    );
                                  } finally {
                                    setIsCheckingDuplicate(false);
                                  }
                                }
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                          {isDuplicateCandidate && !isCheckingDuplicate && (
                            <p className="text-sm text-amber-600">
                              ⚠️ Ya existe un candidato con este nombre.
                              {duplicateCandidate && (
                                <Link
                                  href={`/candidates/${duplicateCandidate.id}`}
                                  className="underline ml-2"
                                  target="_blank"
                                >
                                  Ver perfil.
                                </Link>
                              )}
                            </p>
                          )}
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="linkedin"
                      render={({ field }) => (
                        <FormItem>
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
                          <FormControl>
                            <Input
                              type="number"
                              min="1"
                              max="120"
                              placeholder="Edad (años)"
                              value={ageValue || ""}
                              autoComplete="removeAutocomplete"
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
                                <SelectItem value="none">
                                  No especificado
                                </SelectItem>
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
                          <FormControl>
                            <Input
                              placeholder="Teléfono"
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
                      name="countries"
                      render={({ field }) => (
                        <FormItem className="flex flex-col gap-y-1">
                          <FormControl>
                            <MultiSelector
                              values={field.value}
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
                </div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-6 gap-3">
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem className="lg:col-span-3">
                      <FormControl>
                        <Input
                          placeholder="Zona/Barrio"
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
                          autoComplete="removeAutocomplete"
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

              <FormField
                control={form.control}
                name="firstComment"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea
                        placeholder="Comentarios"
                        {...field}
                        autoComplete="removeAutocomplete"
                        className={`transition-all duration-200 ${isCommentFocused ? "min-h-64" : "min-h-24"
                          }`}
                        onFocus={() => setIsCommentFocused(true)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-1">
                <FormLabel className="ml-[2px]">
                  Archivos (CV, psicotécnico, etc.)
                </FormLabel>
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
                  {files && files.length > 0 && (
                    <>
                      {files.map((file, index) => (
                        <div
                          key={index}
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
                              const newFiles = files.filter(
                                (_, i) => i !== index
                              );
                              const newUrls = fileUrls.filter(
                                (_, i) => i !== index
                              );
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
                  onClick={() => form.reset(getDefaultValues())}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Creando..." : "Crear postulante"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Dialog open={showDuplicateModal} onOpenChange={setShowDuplicateModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Candidato existente</DialogTitle>
            <DialogDescription>
              Ya existe un candidato con el nombre &quot;{linkedinData?.name}
              &quot;. Puede ver el perfil existente o editar el candidato con la
              información actualizada de LinkedIn.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 sm:gap-0">
            <Button variant="outline" asChild>
              <Link
                href={`/candidates/${duplicateCandidate?.id}`}
                target="_blank"
              >
                Ver perfil
              </Link>
            </Button>
            <Button asChild>
              <Link
                href={`/candidates/${duplicateCandidate?.id}/edit?${new URLSearchParams({
                  ...(searchParams.get("pageUrl") && {
                    pageUrl: searchParams.get("pageUrl")!,
                  }),
                  ...(searchParams.get("fullName") && {
                    fullName: searchParams.get("fullName")!,
                  }),
                  ...(searchParams.get("currentPosition") && {
                    currentPosition: searchParams.get("currentPosition")!,
                  }),
                  ...(searchParams.get("email") && {
                    email: searchParams.get("email")!,
                  }),
                  ...(searchParams.get("phone") && {
                    phone: searchParams.get("phone")!,
                  }),
                  ...(searchParams.get("profilePicture") && {
                    profilePicture: searchParams.get("profilePicture")!,
                  }),
                }).toString()}`}
              >
                Editar candidato
              </Link>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
