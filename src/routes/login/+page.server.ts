import { fail, redirect } from "@sveltejs/kit";
import type { Actions, PageServerLoad } from "./$types";
import { auth } from "$lib/server/auth";
import { APIError } from "better-auth/api";
import { env } from "$env/dynamic/private";

export const load: PageServerLoad = async (event) => {
  if (event.locals.user) throw redirect(302, "/");
  return { oidcAvailable: !!env.OIDC_ISSUER };
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
    const issuer = env.OIDC_ISSUER;
    const clientId = env.OIDC_CLIENT_ID;
    if (!issuer || !clientId) return fail(400, { error: "OIDC not configured" });

    throw redirect(
      302,
      `${issuer}/authorize?response_type=code&client_id=${clientId}&redirect_uri=${env.ORIGIN}/api/auth/callback/oidc&scope=openid profile email`
    );
  },
};