<script setup lang="ts">
import { CheckCircle, Clock, LogOut, Mail, RefreshCw, User } from 'lucide-vue-next'
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
	<main class="min-h-screen bg-base-200 p-4">
		<div class="container mx-auto max-w-4xl">
			<!-- Header -->
			<div class="text-center mb-8">
				<div class="badge badge-primary badge-lg mb-4">Dashboard</div>
				<h1 class="text-4xl font-bold mb-2">
					Welcome back, {{ displayName }}!
				</h1>
				<p class="text-base-content/70 max-w-2xl mx-auto">
					You are authenticated with Supabase. Use the navigation to explore
					lessons and manage your learning plan.
				</p>
			</div>

			<!-- Main Content -->
			<div class="grid gap-6 lg:grid-cols-2">
				<!-- User Info Card -->
				<div class="card bg-base-100 shadow-xl">
					<div class="card-body">
						<h2 class="card-title">
							<User class="w-5 h-5" />
							Account Information
						</h2>

						<div class="space-y-4 mt-4">
							<div class="flex items-center gap-3 p-3 bg-base-200 rounded-lg">
								<Mail class="w-4 h-4 text-primary" />
								<div class="flex-1">
									<div class="text-sm opacity-70">Email</div>
									<div class="font-medium">{{ emailAddress }}</div>
								</div>
							</div>

							<div class="flex items-center gap-3 p-3 bg-base-200 rounded-lg">
								<component
									:is="isAuthenticated ? CheckCircle : Clock"
									class="w-4 h-4"
									:class="isAuthenticated ? 'text-success' : 'text-warning'"
								/>
								<div class="flex-1">
									<div class="text-sm opacity-70">Session Status</div>
									<div class="font-medium flex items-center gap-2">
										{{ isAuthenticated ? "Active" : "Pending" }}
										<div
											class="badge badge-sm"
											:class="
												isAuthenticated ? 'badge-success' : 'badge-warning'
											"
										>
											{{ isAuthenticated ? "Connected" : "Loading" }}
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>

				<!-- Quick Actions Card -->
				<div class="card bg-base-100 shadow-xl">
					<div class="card-body">
						<h2 class="card-title">Quick Actions</h2>

						<div class="space-y-3 mt-4">
							<button
								type="button"
								class="btn btn-outline btn-block justify-start"
								:disabled="isPending"
								@click="handleSignOut"
							>
								<LogOut class="w-4 h-4" />
								Sign out
							</button>

							<NuxtLink
								class="btn btn-primary btn-block justify-start"
								:to="{ name: 'login' }"
							>
								<RefreshCw class="w-4 h-4" />
								Switch account
							</NuxtLink>
						</div>

						<!-- Learning Progress Placeholder -->
						<div class="divider">Learning Progress</div>
						<div class="space-y-3">
							<div class="flex justify-between items-center">
								<span class="text-sm">Lessons completed</span>
								<span class="badge badge-neutral">0/10</span>
							</div>
							<progress
								class="progress progress-primary w-full"
								value="0"
								max="100"
							></progress>
						</div>
					</div>
				</div>
			</div>

			<!-- Error Alert -->
			<div v-if="errorMessage" class="alert alert-error mt-6" role="alert">
				<span>{{ errorMessage }}</span>
			</div>
		</div>
	</main>
</template>
