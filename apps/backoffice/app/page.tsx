import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { REDIRECT_AUTHORIZED, REDIRECT_UNAUTHORIZED } from "@/lib/consts";

export default async function HomePage() {
  const session = await auth();
  if (session?.accessToken) {
    redirect(REDIRECT_AUTHORIZED);
  }
  redirect(REDIRECT_UNAUTHORIZED);
}
