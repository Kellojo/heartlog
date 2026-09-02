import { env } from "$env/dynamic/private";
import { betterAuth } from "better-auth/minimal";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { sveltekitCookies } from "better-auth/svelte-kit";
import { getRequestEvent } from "$app/server";
import { db } from "$lib/server/db";
import { openAPI, genericOAuth } from "better-auth/plugins";

export const auth = betterAuth({
  baseURL: env.ORIGIN || "http://localhost:5173",
  secret: env.BETTER_AUTH_SECRET || "change-me-to-a-random-string",
  database: drizzleAdapter(db, { provider: "sqlite" }),
  emailAndPassword: {
    enabled: env.EMAIL_PASSWORD_ENABLED !== "false",
    autoSignIn: true,
  },
  plugins: [
    sveltekitCookies(getRequestEvent),
    ...(env.OIDC_ISSUER
      ? [
          genericOAuth({
            config: [
              {
                providerId: "oidc",
                name: "OIDC",
                discoveryUrl: env.OIDC_ISSUER + "/.well-known/openid-configuration",
                clientId: env.OIDC_CLIENT_ID || "",
                clientSecret: env.OIDC_CLIENT_SECRET || "",
                scopes: ["openid", "profile", "email"],
              },
            ],
          }),
        ]
      : []),
  ],
});