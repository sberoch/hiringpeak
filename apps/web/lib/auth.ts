import NextAuth, { type User } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { match } from "path-to-regexp";

import api from "@/lib/api";
import { PAGE_AUTHORIZATION_ACCESS } from "@/lib/consts";
import { parseJwt } from "@/lib/utils";
import type { AuthLogin } from "@workspace/shared/types/auth";

const nextAuth = NextAuth({
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
            origin: "web",
          });
          if (data.access_token) {
            const payload = parseJwt(data.access_token);
            const email =
              (typeof payload.email === "string" ? payload.email : null) ??
              (typeof credentials?.email === "string" ? credentials.email : null) ??
              "";
            return {
              id: String(payload.id),
              name: payload.name,
              email,
              image: null,
              token: data.access_token,
            } as User & { token: string };
          }
          return null;
        } catch (err) {
          console.error(
            "[Auth] - authorize - Error during login",
            JSON.stringify(err)
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
      if (user && "token" in user) {
        token.accessToken = user.token as string;
      }
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string;
      session.userId = parseJwt(token.accessToken as string).id.toString();
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
});

export const { handlers, signIn, signOut, auth } = nextAuth;

export function hasAccessToRoute(route: string, token?: string): boolean {
  if (!token) return false;

  const data = parseJwt(token);

  return PAGE_AUTHORIZATION_ACCESS[route]?.includes(data.role) ?? false;
}

export function getAuthorizedRoute(pathname: string): string | null {
  for (const pattern of Object.keys(PAGE_AUTHORIZATION_ACCESS)) {
    const matcher = match(pattern, { decode: decodeURIComponent });
    const result = matcher(pathname);

    if (result) {
      return pattern;
    }
  }
  return null;
}
