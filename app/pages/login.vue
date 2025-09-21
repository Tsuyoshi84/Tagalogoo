<script setup lang="ts">
import { computed, watch } from 'vue'
import { navigateTo } from '#imports'
import { useGoogleAuth } from '~/composables/useGoogleAuth'

const { errorMessage, isAuthenticated, isPending, signInWithGoogle, signOut, user } =
	useGoogleAuth()

watch(
	isAuthenticated,
	async (loggedIn) => {
		if (loggedIn) {
			await navigateTo('/')
		}
	},
	{ immediate: true },
)

const displayName = computed(() => {
	if (!user.value) {
		return ''
	}

	return (
		(user.value.user_metadata?.full_name as string | undefined) ??
		(user.value.email as string | undefined) ??
		'Account'
	)
})

async function handleGoogleSignIn(): Promise<void> {
	await signInWithGoogle()
}

async function handleSignOut(): Promise<void> {
	await signOut()
}
</script>

<template>
	<main
		class="flex min-h-screen flex-col items-center justify-center gap-6 bg-slate-900 px-4 py-12 text-slate-100"
	>
		<section class="flex max-w-md flex-col items-center gap-4 text-center">
			<h1 class="text-3xl font-semibold sm:text-4xl">Sign in to Tagalogoo</h1>
			<p class="text-base text-slate-300">
				Use your Google account to access lessons, track progress, and sync
				learning data securely with Supabase Auth.
			</p>
		</section>

		<section class="flex w-full max-w-sm flex-col items-stretch gap-3">
			<button
				v-if="!isAuthenticated"
				type="button"
				class="inline-flex items-center justify-center gap-3 rounded-lg bg-white px-4 py-3 font-medium text-slate-900 shadow transition hover:bg-slate-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:cursor-not-allowed disabled:opacity-60"
				:disabled="isPending"
				@click="handleGoogleSignIn"
			>
				<span class="h-6 w-6">
					<img alt="Google logo" class="h-full w-full" src="/google-logo.svg" />
				</span>
				<span>{{ isPending ? "Connecting…" : "Continue with Google" }}</span>
			</button>

			<button
				v-else
				type="button"
				class="inline-flex items-center justify-center gap-3 rounded-lg border border-slate-500 px-4 py-3 font-medium text-slate-100 transition hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
				@click="handleSignOut"
			>
				Sign out {{ displayName }}
			</button>

			<p
				v-if="errorMessage"
				class="rounded-lg border border-red-400 bg-red-900/40 px-3 py-2 text-sm text-red-200"
				role="alert"
			>
				{{ errorMessage }}
			</p>
		</section>
	</main>
</template>
