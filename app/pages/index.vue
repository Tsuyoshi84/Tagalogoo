<script setup lang="ts">
import { computed } from 'vue'
import { useGoogleAuth } from '~/composables/useGoogleAuth'

const { errorMessage, isAuthenticated, isPending, signOut, user } = useGoogleAuth()

const displayName = computed(() => {
	if (!user.value) {
		return 'Explorer'
	}

	return (
		(user.value.user_metadata?.full_name as string | undefined) ??
		(user.value.email as string | undefined) ??
		'Explorer'
	)
})

const emailAddress = computed(() => {
	if (!user.value) {
		return 'Not signed in'
	}

	return user.value.email ?? 'Unknown email'
})

async function handleSignOut(): Promise<void> {
	await signOut()
}
</script>

<template>
  <main class="flex min-h-screen flex-col items-center justify-center gap-6 bg-slate-900 px-4 py-12 text-slate-100">
    <section class="w-full max-w-xl rounded-3xl border border-slate-700 bg-slate-950/80 p-8 shadow-xl backdrop-blur">
      <header class="flex flex-col gap-2">
        <p class="text-sm uppercase tracking-widest text-emerald-300">Dashboard</p>
        <h1 class="text-3xl font-semibold sm:text-4xl">Welcome back, {{ displayName }}!</h1>
        <p class="text-sm text-slate-300">
          You are authenticated with Supabase. Use the navigation to explore lessons and manage your learning plan.
        </p>
      </header>

      <dl class="mt-6 grid gap-3 text-sm text-slate-200">
        <div class="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-900/70 px-4 py-3">
          <dt class="text-slate-400">Signed in as</dt>
          <dd class="font-medium text-slate-100">{{ emailAddress }}</dd>
        </div>

        <div class="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-900/70 px-4 py-3">
          <dt class="text-slate-400">Session status</dt>
          <dd class="font-medium text-slate-100">{{ isAuthenticated ? 'Active' : 'Pending' }}</dd>
        </div>
      </dl>

      <div class="mt-8 flex flex-wrap items-center gap-3">
        <button
          type="button"
          class="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-500 px-4 py-2.5 font-medium text-slate-100 transition hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:cursor-not-allowed disabled:opacity-60"
          :disabled="isPending"
          @click="handleSignOut"
        >
          Sign out
        </button>

        <NuxtLink
          class="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-emerald-950 shadow hover:bg-emerald-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300"
          to="/login"
        >
          Switch account
        </NuxtLink>
      </div>

      <p
        v-if="errorMessage"
        class="mt-4 rounded-lg border border-red-400 bg-red-900/40 px-3 py-2 text-sm text-red-200"
        role="alert"
      >
        {{ errorMessage }}
      </p>
    </section>
  </main>
</template>
