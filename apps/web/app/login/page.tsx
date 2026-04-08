import Image from "next/image";
import { Metadata } from "next";

import LoginForm from "@/components/auth/form";

export const metadata: Metadata = {
  title: "Iniciar sesión",
  description: "Conectarse a su cuenta",
};

export default function LoginPage() {
  const loginEnabled = process.env.NEXT_PUBLIC_LOGIN_ENABLED !== "false";

  return (
    <div className="gradient-mesh-hero relative flex min-h-screen items-center justify-center overflow-hidden font-sans">
      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%230066ff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      {/* Blur orbs */}
      <div className="orb orb-blue -right-40 top-20 h-[500px] w-[500px] opacity-60" />
      <div className="orb orb-dark -left-20 bottom-20 h-[400px] w-[400px] opacity-40" />
      <div className="orb orb-soft top-1/2 left-1/3 h-[300px] w-[300px] opacity-50" />

      {/* Cool vector */}
      <Image
        src="/images/cool_vector.png"
        alt=""
        width={800}
        height={400}
        className="pointer-events-none absolute left-[-15%] top-10 w-[800px] opacity-50 lg:w-[800px]"
        priority
      />

      {/* Card */}
      <div className="relative z-10 w-full max-w-[440px] mx-4 animate-[fade-up_800ms_cubic-bezier(0.16,1,0.3,1)_forwards]">
        <div className="rounded-2xl p-10 sm:p-12 bg-surface border border-brand-border shadow-[0_4px_6px_-1px_rgba(0,0,0,0.03),0_20px_40px_-12px_rgba(0,0,0,0.06)]">
          {/* Logo */}
          <div className="mb-10 flex items-center gap-1">
            <Image
              src="/images/logo.png"
              alt="HiringPeak"
              width={56}
              height={56}
              className="h-10 w-10 object-contain"
              priority
            />
            <span className="text-xl font-bold tracking-tight text-ink">
              HiringPeak
            </span>
          </div>

          {/* Heading */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight leading-tight text-ink">
              Iniciar sesión
            </h1>
            {loginEnabled ? (
              <p className="mt-3 text-base leading-relaxed text-slate-brand">
                Ingrese sus credenciales para acceder a su cuenta
              </p>
            ) : (
              <p className="mt-3 text-base leading-relaxed text-muted-brand">
                El inicio de sesión está deshabilitado
              </p>
            )}
          </div>

          {/* Form */}
          {loginEnabled ? <LoginForm /> : null}
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-sm text-muted-brand">
          &copy; {new Date().getFullYear()} HiringPeak
        </p>
      </div>
    </div>
  );
}
