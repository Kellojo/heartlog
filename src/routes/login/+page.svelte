<script lang="ts">
  import { enhance } from "$app/forms";
  import type { ActionData, PageData } from "./$types";

  let { form, data } = $props<{ form: ActionData; data: PageData }>();
</script>

<div class="min-h-screen flex items-center justify-center bg-neutral-50 p-4">
  <div class="w-full max-w-md">
    <div class="text-center mb-8">
      <div class="flex items-center justify-center gap-2.5">
        <svg class="w-9 h-9" viewBox="0 0 32 32"
          ><path
            d="M16 28c-1 0-2-.5-4-2C5.5 20.6 2.5 15.5 3.6 9.7 3.8 6 6.2 4 8.8 4c3 0 5.6 1.8 7.2 4.6 1.6-2.8 4.2-4.6 7.2-4.6 2.6 0 5 2 5.2 5.7 1.1 5.8-1.9 10.9-8.4 16.3-2 1.5-3 2-4 2Z"
            fill="#e8437c"
          /></svg
        >
        <h1 class="text-3xl font-semibold text-rose-600 tracking-tight">
          Heartlog
        </h1>
      </div>
      <p class="text-gray-400 mt-2 text-sm">Your shared relationship journal</p>
    </div>

    <div class="glass card rounded-2xl p-6">
      {#if data.emailPasswordEnabled}
        <h2 class="text-lg font-medium text-gray-800 mb-5">Log in</h2>

        <form method="post" action="?/signIn" use:enhance class="space-y-4">
          {#if form?.error}
            <div class="bg-red-50 text-red-600 text-sm rounded-xl px-4 py-3">
              {form.error}
            </div>
          {/if}

          <div>
            <label
              class="block text-sm font-medium text-gray-600 mb-1.5"
              for="email">Email</label
            >
            <input
              id="email"
              name="email"
              type="email"
              required
              autocomplete="email"
              class="glass-input w-full rounded-xl px-3 py-2.5 text-sm text-gray-800"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label
              class="block text-sm font-medium text-gray-600 mb-1.5"
              for="password">Password</label
            >
            <input
              id="password"
              name="password"
              type="password"
              required
              autocomplete="current-password"
              class="glass-input w-full rounded-xl px-3 py-2.5 text-sm text-gray-800"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            class="btn-primary w-full text-white font-medium rounded-xl px-4 py-2.5 text-sm cursor-pointer"
          >
            Sign in
          </button>
        </form>
      {/if}

      {#if data.oidcAvailable}
        {#if data.emailPasswordEnabled}
          <div class="relative my-5">
            <div class="absolute inset-0 flex items-center">
              <div class="w-full border-t border-gray-200"></div>
            </div>
            <div class="relative flex justify-center text-xs">
              <span class="bg-white/70 px-3 text-gray-400">or</span>
            </div>
          </div>

          <form method="post" action="?/signInOIDC" use:enhance>
            <button
              type="submit"
              class="w-full bg-gray-800 hover:bg-gray-700 active:scale-[0.98] text-white font-medium rounded-xl px-4 py-2.5 text-sm transition cursor-pointer"
            >
              Continue with {data.oidcProviderName}
            </button>
          </form>
        {:else}
          <div class="text-center py-4">
            <div
              class="w-14 h-14 mx-auto mb-4 rounded-full bg-rose-50 flex items-center justify-center"
            >
              <svg
                class="w-7 h-7 text-rose-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="1.5"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"
                />
              </svg>
            </div>
            <h2 class="text-lg font-medium text-gray-800 mb-1">Welcome back</h2>
            <p class="text-sm text-gray-400 mb-6">
              Sign in with your account to continue
            </p>

            {#if form?.error}
              <div
                class="bg-red-50 text-red-600 text-sm rounded-xl px-4 py-3 mb-4"
              >
                {form.error}
              </div>
            {/if}

            <form method="post" action="?/signInOIDC" use:enhance>
              <button
                type="submit"
                class="w-full bg-gray-800 hover:bg-gray-700 active:scale-[0.98] text-white font-medium rounded-xl px-4 py-2.5 text-sm transition cursor-pointer"
              >
                Continue with {data.oidcProviderName}
              </button>
            </form>
          </div>
        {/if}
      {/if}

      {#if data.emailPasswordEnabled}
        <p class="mt-5 text-center text-sm text-gray-400">
          Don't have an account? <a
            href="/register"
            class="text-rose-500 hover:text-rose-600 font-medium">Register</a
          >
        </p>
      {/if}
    </div>
  </div>
</div>
