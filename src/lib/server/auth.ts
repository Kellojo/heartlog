import { env } from "$env/dynamic/private";
import { betterAuth } from "better-auth/minimal";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { sveltekitCookies } from "better-auth/svelte-kit";
import { getRequestEvent } from "$app/server";
import { db } from "$lib/server/db";
import { openAPI } from "better-auth/plugins";

export const auth = betterAuth({
  baseURL: env.ORIGIN || "http://localhost:5173",
  secret: env.BETTER_AUTH_SECRET || "change-me-to-a-random-string",
  database: drizzleAdapter(db, { provider: "sqlite" }),
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
  },
  socialProviders: env.OIDC_ISSUER
    ? {
        oidc: {
          issuer: env.OIDC_ISSUER,
          clientId: env.OIDC_CLIENT_ID || "",
          clientSecret: env.OIDC_CLIENT_SECRET || "",
        },
      }
    : undefined,
  plugins: [sveltekitCookies(getRequestEvent)],
});