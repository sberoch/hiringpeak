import { Metadata } from "next";

import LoginForm from "@/components/auth/form";

export const metadata: Metadata = {
  title: "Backoffice | Iniciar sesión",
  description: "Iniciar sesión en el backoffice",
};

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center py-12">
      <div className="mx-auto grid w-[350px] gap-6">
        <div className="grid gap-2 text-center">
          <h1 className="text-3xl font-bold">Backoffice</h1>
          <p className="text-muted-foreground">
            Ingrese sus credenciales para acceder
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
