import Image from "next/image";
import { Metadata } from "next";

import LoginForm from "@/components/auth/form";

export const metadata: Metadata = {
  title: "Conectarse | PRATT FIT",
  description: "Conectarse a su cuenta",
};

export default function LoginPage() {
  return (
    <div className="w-full lg:grid lg:grid-cols-2 min-h-screen h-full">
      <div className="flex items-center justify-center py-12">
        <div className="mx-auto grid w-[350px] gap-6">
          <div className="grid gap-2 text-center">
            <Image
              src="/images/logo-1.svg"
              alt="Logo"
              width="1920"
              height="1080"
              className="h-10 object-contain mb-12"
            />
            <h1 className="text-3xl font-bold">Iniciar sesión</h1>
            <p>Ingrese sus credenciales para acceder a su cuenta</p>
          </div>
          <LoginForm />
        </div>
      </div>
      <div className="hidden bg-muted lg:block relative">
        <div className="absolute inset-0 bg-black/25" />
        <Image
          src="/images/login.svg"
          alt="Image"
          width="1920"
          height="1080"
          className="h-full w-full object-cover"
        />
      </div>
    </div>
  );
}
