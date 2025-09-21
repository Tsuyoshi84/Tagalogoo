<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { navigateTo, useSupabaseClient, useSupabaseCookieRedirect, useSupabaseUser } from '#imports'

const supabaseClient = useSupabaseClient()
const route = useRoute()
const redirectInfo = useSupabaseCookieRedirect()
const user = useSupabaseUser()

const statusMessage = ref(
	'Please keep this tab open while we securely finish the Google sign-in flow.',
)
const errorMessage = ref<string | null>(null)
const isExchangingSession = ref(false)

function decodeProviderError(rawError: unknown): string {
	if (typeof rawError !== 'string') {
		return 'The Google sign-in request was cancelled. Please try again.'
	}

	try {
		return decodeURIComponent(rawError)
	} catch {
		return rawError
	}
}

watch(
	user,
	async (currentUser) => {
		if (!currentUser || errorMessage.value) {
			return
		}

		statusMessage.value = 'Success! Redirecting you to the app…'

		const redirectPath = redirectInfo.pluck()
		const targetLocation =
			typeof redirectPath === 'string' && redirectPath.length > 0 ? redirectPath : '/'

		await navigateTo(targetLocation, { replace: true })
	},
	{ immediate: true },
)

onMounted(async () => {
	if (user.value) {
		return
	}

	const providerError = route.query.error_description

	if (providerError) {
		errorMessage.value = decodeProviderError(
			Array.isArray(providerError) ? providerError[0] : providerError,
		)
		statusMessage.value = 'We could not complete the login process.'
		return
	}

	const hasCode = typeof route.query.code === 'string'

	if (!hasCode) {
		errorMessage.value = 'Missing Google authorization code. Please initiate the login flow again.'
		statusMessage.value = 'We could not complete the login process.'
		return
	}

	isExchangingSession.value = true

	try {
		const { error } = await supabaseClient.auth.exchangeCodeForSession(window.location.href)

		if (error) {
			throw error
		}
	} catch (error) {
		errorMessage.value = decodeProviderError(error instanceof Error ? error.message : error)
		statusMessage.value = 'We could not complete the login process.'
	} finally {
		isExchangingSession.value = false
	}
})
</script>

<template>
  <main class="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-950 px-4 py-12 text-slate-100">
    <div class="w-full max-w-md rounded-xl border border-slate-700 bg-slate-900 px-6 py-8 text-center shadow-lg">
      <h1 class="text-2xl font-semibold">Finishing sign in…</h1>
      <p class="mt-3 text-sm text-slate-300">{{ statusMessage }}</p>
      <p
        v-if="errorMessage"
        class="mt-4 rounded-lg border border-red-400 bg-red-900/40 px-3 py-2 text-sm text-red-200"
        role="alert"
      >
        {{ errorMessage }}
      </p>
      <p v-else-if="isExchangingSession" class="mt-4 text-xs uppercase tracking-wide text-slate-500">
        Requesting session from Supabase…
      </p>
    </div>
  </main>
</template>
