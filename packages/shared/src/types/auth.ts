import type { UserRoleEnum } from "./user.js";

export type AuthLogin = {
  access_token: string;
};

export type AuthTokenData = {
  active: boolean;
  iat: number;
  id: number;
  role: UserRoleEnum;
  name: string;
};
