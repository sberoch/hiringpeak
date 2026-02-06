"use client";

import { useRouter } from "next/navigation";

import { Heading } from "@workspace/ui/components/heading";
import { UserForm } from "@/components/users/user-form";

export default function NewUser() {
  const router = useRouter();
  function onSubmit() {
    router.push("/users");
  }

  return (
    <div className="container flex flex-col">
      <Heading>Nuevo usuario</Heading>
      <div className="max-w-2xl mt-8">
        <UserForm onSubmit={onSubmit} />
      </div>
    </div>
  );
}
