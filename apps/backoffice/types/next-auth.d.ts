import "next-auth";

declare module "next-auth" {
  interface User {
    token?: string;
  }
  interface Session {
    accessToken?: string;
    userId?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string;
    email?: string;
    name?: string;
  }
}
