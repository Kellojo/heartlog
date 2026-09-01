<script lang="ts">
  import { enhance } from "$app/forms";
  import type { ActionData } from "./$types";

  let { form } = $props<{ form: ActionData }>();
</script>

<div class="min-h-screen flex items-center justify-center bg-neutral-50 p-4">
  <div class="w-full max-w-md">
    <div class="text-center mb-8">
      <div class="flex items-center justify-center gap-2.5">
        <svg class="w-9 h-9" viewBox="0 0 32 32"><path d="M16 28c-1 0-2-.5-4-2C5.5 20.6 2.5 15.5 3.6 9.7 3.8 6 6.2 4 8.8 4c3 0 5.6 1.8 7.2 4.6 1.6-2.8 4.2-4.6 7.2-4.6 2.6 0 5 2 5.2 5.7 1.1 5.8-1.9 10.9-8.4 16.3-2 1.5-3 2-4 2Z" fill="#e8437c"/></svg>
        <h1 class="text-3xl font-semibold text-rose-600 tracking-tight">heartlog</h1>
      </div>
      <p class="text-gray-400 mt-2 text-sm">Create your account</p>
    </div>

    <div class="glass rounded-2xl p-6">
      <h2 class="text-lg font-medium text-gray-800 mb-5">Register</h2>

      <form method="post" action="?/signUp" use:enhance class="space-y-4">
        {#if form?.error}
          <div class="bg-red-50 text-red-600 text-sm rounded-xl px-4 py-3">{form.error}</div>
        {/if}

        <div>
          <label class="block text-sm font-medium text-gray-600 mb-1.5" for="name">Name</label>
          <input
            id="name"
            name="name"
            type="text"
            required
            class="glass-input w-full rounded-xl px-3 py-2.5 text-sm text-gray-800"
            placeholder="Your name"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-600 mb-1.5" for="email">Email</label>
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
          <label class="block text-sm font-medium text-gray-600 mb-1.5" for="password">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autocomplete="new-password"
            minlength="8"
            class="glass-input w-full rounded-xl px-3 py-2.5 text-sm text-gray-800"
            placeholder="Min 8 characters"
          />
        </div>

        <button
          type="submit"
          class="btn-primary w-full text-white font-medium rounded-xl px-4 py-2.5 text-sm cursor-pointer"
        >
          Create account
        </button>
      </form>

      <p class="mt-5 text-center text-sm text-gray-400">
        Already have an account? <a href="/login" class="text-rose-500 hover:text-rose-600 font-medium">Log in</a>
      </p>
    </div>
  </div>
</div>
