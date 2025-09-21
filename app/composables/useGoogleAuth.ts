import type { ComputedRef, Ref } from 'vue'
import { computed, ref } from 'vue'
import { useRuntimeConfig, useSupabaseClient, useSupabaseUser } from '#imports'
import { buildGoogleOAuthRedirect, createGoogleOAuthQueryParams } from '~/domain/auth/google'

interface UseGoogleAuthResult {
	readonly signInWithGoogle: () => Promise<void>
	readonly signOut: () => Promise<void>
	readonly isPending: Ref<boolean>
	readonly errorMessage: Ref<string | null>
	readonly isAuthenticated: ComputedRef<boolean>
	readonly user: ReturnType<typeof useSupabaseUser>
}

function toErrorMessage(error: unknown): string {
	if (error instanceof Error) {
		return error.message
	}

	if (typeof error === 'string') {
		return error
	}

	return 'Something went wrong while contacting Google. Please try again.'
}

export function useGoogleAuth(): UseGoogleAuthResult {
	const supabaseClient = useSupabaseClient()
	const user = useSupabaseUser()
	const isPending = ref(false)
	const errorMessage = ref<string | null>(null)
	const runtimeConfig = useRuntimeConfig()

	const isAuthenticated = computed<boolean>(() => user.value !== null)

	async function signInWithGoogle(): Promise<void> {
		if (!import.meta.client) {
			return
		}

		isPending.value = true
		errorMessage.value = null

		try {
			const redirectPath = runtimeConfig.public.supabase?.redirectOptions?.callback as
				| string
				| undefined
			const redirectTo = buildGoogleOAuthRedirect({ origin: window.location.origin, redirectPath })
			const queryParams = createGoogleOAuthQueryParams(runtimeConfig.public.googleOAuthClientId)

			const { error } = await supabaseClient.auth.signInWithOAuth({
				options: {
					flow: 'pkce',
					redirectTo,
					queryParams,
				},
				provider: 'google',
			})

			if (error) {
				throw error
			}
		} catch (error) {
			errorMessage.value = toErrorMessage(error)
		} finally {
			isPending.value = false
		}
	}

	async function signOut(): Promise<void> {
		errorMessage.value = null

		const { error } = await supabaseClient.auth.signOut()

		if (error) {
			errorMessage.value = toErrorMessage(error)
			throw error
		}
	}

	return {
		errorMessage,
		isAuthenticated,
		isPending,
		signInWithGoogle,
		signOut,
		user,
	}
}
