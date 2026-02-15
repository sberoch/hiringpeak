import NextAuth, { type User } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { match } from "path-to-regexp";

import api from "@/lib/api";
import { PAGE_AUTHORIZATION_ACCESS } from "@/lib/consts";
import { parseJwt } from "@/lib/utils";
import type { AuthLogin } from "@workspace/shared/types/auth";

/** Routes in this map require authentication; no role check (API enforces permissions). */

const loginEnabled = process.env.NEXT_PUBLIC_LOGIN_ENABLED !== "false";
const googleLoginEnabled = process.env.NEXT_PUBLIC_GOOGLE_LOGIN_ENABLED !== "false";
const hasGoogleConfig = Boolean(process.env.AUTH_GOOGLE_ID);

const providers: NextAuth["providers"] = [
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
];

if (loginEnabled && googleLoginEnabled && hasGoogleConfig) {
  providers.push(Google);
}

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

  providers,
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user, account }) {
      if (user && "token" in user) {
        token.accessToken = user.token as string;
      }
      if (account?.provider === "google" && account.id_token) {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL;
        if (baseUrl) {
          try {
            const res = await fetch(`${baseUrl}/auth/google`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ id_token: account.id_token }),
            });
            if (res.ok) {
              const data = (await res.json()) as AuthLogin;
              if (data.access_token) {
                token.accessToken = data.access_token;
              }
            }
          } catch (err) {
            console.error("[Auth] - jwt - Google token exchange failed", err);
          }
        }
      }
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string;
      if (token.accessToken) {
        session.userId = parseJwt(token.accessToken as string).id.toString();
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
});

export const { handlers, signIn, signOut, auth } = nextAuth;

/** True if the route is protected and the user has a valid token. API enforces permissions. */
export function hasAccessToRoute(route: string, token?: string): boolean {
  if (!token) return false;
  return PAGE_AUTHORIZATION_ACCESS[route] !== undefined;
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
