import { fail, redirect } from "@sveltejs/kit";
import type { Actions, PageServerLoad } from "./$types";
import { auth } from "$lib/server/auth";
import { APIError } from "better-auth/api";
import { env } from "$env/dynamic/private";

export const load: PageServerLoad = async (event) => {
  if (event.locals.user) throw redirect(302, "/");
  return { oidcAvailable: !!env.OIDC_ISSUER, oidcProviderName: env.OIDC_PROVIDER_NAME || "OIDC", emailPasswordEnabled: env.EMAIL_PASSWORD_ENABLED !== "false" };
};

export const actions: Actions = {
  signIn: async (event) => {
    const formData = await event.request.formData();
    const email = formData.get("email")?.toString() ?? "";
    const password = formData.get("password")?.toString() ?? "";

    try {
      await auth.api.signInEmail({
        body: { email, password },
        headers: event.request.headers,
      });
    } catch (e) {
      if (e instanceof APIError) {
        return fail(400, { error: e.message || "Sign in failed" });
      }
      return fail(500, { error: "An unexpected error occurred" });
    }

    throw redirect(302, "/");
  },

  signInOIDC: async (event) => {
    if (!env.OIDC_ISSUER || !env.OIDC_CLIENT_ID) return fail(400, { error: "OIDC not configured" });

    try {
      const res = await auth.api.signInSocial({
        body: { provider: "oidc", callbackURL: "/" },
        headers: event.request.headers,
      });
      if (!res.url) return fail(500, { error: "Failed to start OIDC sign in" });
      throw redirect(302, res.url);
    } catch (e) {
      if (e instanceof APIError) {
        return fail(400, { error: e.message || "OIDC sign in failed" });
      }
      throw e;
    }
  },
};