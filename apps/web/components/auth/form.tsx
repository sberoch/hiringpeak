"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { forwardRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { REDIRECT_AUTHORIZED } from "@/lib/consts";

const formSchema = z.object({
  email: z.email({ error: "El correo electrónico no es válido" }),
  password: z.string({ error: "La contraseña es requerida" }),
});

type FormValues = z.infer<typeof formSchema>;

const BrandInput = forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & {
    label: string;
    error?: string;
  }
>(function BrandInput({ label, id, error, onFocus, onBlur, ...props }, ref) {
  const [focused, setFocused] = useState(false);

  return (
    <div className="grid gap-2">
      <label htmlFor={id} className="text-sm font-semibold text-ink">
        {label}
      </label>
      <input
        ref={ref}
        id={id}
        className={[
          "w-full rounded-xl bg-canvas px-4 py-3.5 text-base text-ink outline-none placeholder:text-muted-brand transition-all duration-200",
          "border",
          error
            ? "border-red-500"
            : focused
              ? "border-electric shadow-[0_0_0_4px_rgba(0,102,255,0.1)]"
              : "border-brand-border",
        ].join(" ")}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        {...props}
      />
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
});

export default function LoginForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const router = useRouter();
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: FormValues) => {
    setServerError(null);
    setIsLoading(true);
    const res = await signIn("credentials", { ...data, redirect: false });
    if (res?.error) {
      setServerError("El usuario o la contraseña no coinciden");
      setIsLoading(false);
      return;
    }
    setIsLoading(false);
    router.push(REDIRECT_AUTHORIZED);
  };

  const errors = form.formState.errors;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-5">
      <BrandInput
        label="Email"
        id="email"
        type="email"
        placeholder="correo@ejemplo.com"
        disabled={isLoading}
        error={errors.email?.message}
        {...form.register("email", { onChange: () => setServerError(null) })}
      />

      <BrandInput
        label="Contraseña"
        id="password"
        type="password"
        disabled={isLoading}
        error={errors.password?.message}
        {...form.register("password", { onChange: () => setServerError(null) })}
      />

      {/* Server error */}
      {serverError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {serverError}
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={isLoading}
        className="mt-2 w-full cursor-pointer rounded-xl bg-electric py-4 px-8 text-base font-semibold text-white transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-0.5 hover:bg-electric-light hover:shadow-[0_12px_32px_-8px_rgba(0,102,255,0.4)] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-none"
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <svg
              className="h-4 w-4 animate-spin"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            Conectando...
          </span>
        ) : (
          "Conectarse"
        )}
      </button>
    </form>
  );
}
