import NextAuth, { User } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { match } from "path-to-regexp";

import api from "@/lib/api";
import { PAGE_AUTHORIZATION_ACCESS } from "@/lib/consts";
import { parseJwt } from "@/lib/utils";
import type { AuthLogin } from "@workspace/shared/types/auth";

export const { handlers, signIn, signOut, auth } = NextAuth({
  debug: process.env.NODE_ENV === "development",
  trustHost: true,
  secret: process.env.AUTH_SECRET,
  cookies: {
    sessionToken: {
      name:
        process.env.NODE_ENV === "production"
          ? "__Secure-next-auth.session-token"
          : "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
    callbackUrl: {
      name:
        process.env.NODE_ENV === "production"
          ? "__Secure-next-auth.callback-url"
          : "next-auth.callback-url",
    },
    csrfToken: {
      name:
        process.env.NODE_ENV === "production"
          ? "__Secure-next-auth.csrf-token"
          : "next-auth.csrf-token",
    },
  },

  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: {},
        password: {},
      },
      async authorize(credentials) {
        try {
          const { data } = await api.post<AuthLogin>("/auth/login", {
            email: credentials?.email,
            password: credentials?.password,
            origin: "backoffice",
          });
          if (data.access_token) {
            return {
              token: data.access_token,
            } as User;
          }
          return null;
        } catch (err) {
          console.error(
            "[Auth] - authorize - Error during login",
            JSON.stringify(err),
          );
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      const credentialUser = user as User | undefined;
      if (credentialUser?.token) {
        token.accessToken = credentialUser.token;
        const data = parseJwt(credentialUser.token);
        token.email = data.email;
        token.name = data.name;
      }
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string;
      const data = parseJwt(token.accessToken as string);
      session.userId = data.id.toString();
      if (session.user) {
        session.user.email = token.email as string;
        session.user.name = token.name as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
});

export function hasAccessToRoute(route: string, token?: string): boolean {
  if (!token) return false;
  // All PAGE_AUTHORIZATION_ACCESS routes require SYSTEM_ADMIN.
  // After the multitenancy refactor, internal/backoffice users are identified
  // by having no organizationId (roleId is null for INTERNAL_USERs).
  if (!PAGE_AUTHORIZATION_ACCESS[route]) return true;
  const data = parseJwt(token);
  return data.organizationId == null;
}

export function getAuthorizedRoute(pathname: string): string | null {
  for (const pattern of Object.keys(PAGE_AUTHORIZATION_ACCESS)) {
    const matcher = match(pattern, { decode: decodeURIComponent });
    const result = matcher(pathname);
    if (result) return pattern;
  }
  return null;
}
