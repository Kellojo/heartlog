import { fail, redirect } from "@sveltejs/kit";
import type { Actions, PageServerLoad } from "./$types";
import { auth } from "$lib/server/auth";
import { APIError } from "better-auth/api";
import { env } from "$env/dynamic/private";

export const load: PageServerLoad = async (event) => {
  if (event.locals.user) throw redirect(302, "/");
  if (env.EMAIL_PASSWORD_ENABLED === "false") throw redirect(302, "/login");
  return {};
};

export const actions: Actions = {
  signUp: async (event) => {
    const formData = await event.request.formData();
    const name = formData.get("name")?.toString() ?? "";
    const email = formData.get("email")?.toString() ?? "";
    const password = formData.get("password")?.toString() ?? "";

    if (password.length < 8) {
      return fail(400, { error: "Password must be at least 8 characters" });
    }

    try {
      await auth.api.signUpEmail({
        body: { email, password, name },
        headers: event.request.headers,
      });
    } catch (e) {
      if (e instanceof APIError) {
        return fail(400, { error: e.message || "Registration failed" });
      }
      return fail(500, { error: "An unexpected error occurred" });
    }

    throw redirect(302, "/");
  },
};