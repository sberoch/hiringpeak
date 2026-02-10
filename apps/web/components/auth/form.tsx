"use client";

import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@workspace/ui/components/form";
import { LoadingSpinner } from "@workspace/ui/components/loading-spinner";
import { REDIRECT_AUTHORIZED } from "@/lib/consts";

const formSchema = z.object({
  email: z
    .string({
      required_error: "El correo electrónico es requerido",
    })
    .email({ message: "El correo electrónico no es válido" }),
  password: z
    .string({
      required_error: "La contraseña es requerida",
    })
    .min(6, { message: "La contraseña debe tener al menos 6 caracteres" }),
});

type FormValues = z.infer<typeof formSchema>;

type LoginFormProps = {
  showGoogleButton?: boolean;
};

export default function LoginForm({ showGoogleButton = false }: LoginFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const router = useRouter();
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: FormValues) => {
    setIsLoading(true);
    const res = await signIn("credentials", { ...data, redirect: false });
    if (res?.error) {
      toast.error("El usuario o la contraseña no coinciden");
      setIsLoading(false);
      return;
    }
    setIsLoading(false);
    router.push(REDIRECT_AUTHORIZED);
  };

  const onGoogleSignIn = () => {
    setIsGoogleLoading(true);
    signIn("google", { callbackUrl: REDIRECT_AUTHORIZED });
  };

  return (
    <div className="grid gap-4">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="admin@example.com"
                    disabled={isLoading}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contraseña</FormLabel>
                <FormControl>
                  <Input {...field} type="password" disabled={isLoading} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <div className="flex items-center">
                <LoadingSpinner className="mr-2 h-4 w-4" />
                Conectando...
              </div>
            ) : (
              "Conectarse"
            )}
          </Button>
        </form>
      </Form>
      {showGoogleButton && (
        <>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                or
              </span>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            className="w-full"
            disabled={isLoading || isGoogleLoading}
            onClick={onGoogleSignIn}
          >
            {isGoogleLoading ? (
              <div className="flex items-center">
                <LoadingSpinner className="mr-2 h-4 w-4" />
                Conectando con Google...
              </div>
            ) : (
              "Login with Google"
            )}
          </Button>
        </>
      )}
    </div>
  );
}
