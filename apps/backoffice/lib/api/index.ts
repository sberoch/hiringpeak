import axios from "axios";
import { getSession } from "next-auth/react";

import { auth } from "../auth";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

const accessSession = () => {
  const mode = typeof window === "undefined" ? "server" : "client";
  if (mode === "server") {
    return auth();
  }
  return getSession();
};

api.interceptors.request.use(async (config) => {
  const session = await accessSession();

  if (session?.accessToken) {
    config.headers.Authorization = `Bearer ${session.accessToken}`;
  }

  return config;
});

export default api;
