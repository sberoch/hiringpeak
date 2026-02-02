"use client";

import { useRouter } from "next/navigation";

import { CompanyForm } from "@/components/companies/company-form";
import { Heading } from "@workspace/ui/components/heading";

export default function NewCompany() {
  const router = useRouter();

  function onSubmit() {
    router.push("/companies");
  }

  return (
    <div className="container flex flex-col">
      <Heading>Nueva empresa</Heading>
      <div className="max-w-2xl mt-8">
        <CompanyForm onSubmit={onSubmit} />
      </div>
    </div>
  );
}
