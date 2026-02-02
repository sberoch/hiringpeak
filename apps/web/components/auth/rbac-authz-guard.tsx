"use client";

import { useMemo, type ReactNode } from "react";
import { useSession } from "next-auth/react";

import { parseJwt } from "@/lib/utils";
import type { UserRoleEnum } from "@workspace/shared/types/user";

interface RBACGuardProps {
  visibleTo: UserRoleEnum[];
  children: ReactNode;
}

export const RBACAuthzGuard = ({
  visibleTo,
  children,
}: RBACGuardProps): ReactNode => {
  const session = useSession();
  const hasAccess = useMemo(() => {
    if (session.status !== "authenticated" || !session.data?.accessToken) {
      return false;
    }
    return visibleTo.includes(parseJwt(session.data?.accessToken)?.role);
  }, [session.status, session.data?.accessToken, visibleTo]);
  if (!hasAccess) {
    return null;
  }

  return children;
};
