<script setup lang="ts">
/**
 * Login page
 */

import { LogOut, Shield } from 'lucide-vue-next'
import { computed, watch } from 'vue'
import { navigateTo } from '#imports'
import { useGoogleAuth } from '~/composables/useGoogleAuth'

const {
	errorMessage,
	isAuthenticated,
	isPending,
	signInWithGoogle,
	signOut,
	user,
} = useGoogleAuth()

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
	<main class="hero min-h-screen bg-base-200">
		<div class="hero-content text-center">
			<div class="max-w-md">
				<div class="flex flex-col items-center gap-4 mb-8">
					<div class="flex items-center gap-2">
						<Shield class="w-8 h-8 text-primary"/>
						<h1 class="text-4xl font-bold">Tagalogoo</h1>
					</div>
					<p class="text-lg opacity-70">
						Use your Google account to access lessons, track progress, and sync
						learning data securely.
					</p>
				</div>

				<div class="card bg-base-100 shadow-xl">
					<div class="card-body">
						<h2 class="card-title justify-center mb-4">Welcome back!</h2>

						<div class="card-actions justify-center">
							<button
								v-if="!isAuthenticated"
								type="button"
								class="btn btn-primary btn-wide"
								:class="{ 'btn-disabled loading': isPending }"
								:disabled="isPending"
								@click="handleGoogleSignIn"
							>
								<span class="w-5 h-5">
									<img
										alt="Google logo"
										class="w-full h-full"
										src="/google-logo.svg"
									>
								</span>
								{{ isPending ? "Connecting…" : "Continue with Google" }}
							</button>

							<button
								v-else
								type="button"
								class="btn btn-outline btn-wide"
								@click="handleSignOut"
							>
								<LogOut class="w-4 h-4"/>
								Sign out {{ displayName }}
							</button>
						</div>

						<div
							v-if="errorMessage"
							class="alert alert-error mt-4"
							role="alert"
						>
							<span>{{ errorMessage }}</span>
						</div>
					</div>
				</div>
			</div>
		</div>
	</main>
</template>
