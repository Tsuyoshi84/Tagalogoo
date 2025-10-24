<script setup lang="ts">
import { AlertCircle, RefreshCw } from 'lucide-vue-next'
import { onMounted, ref } from 'vue'
import VocabularyDashboard from '~/components/VocabularyDashboard.vue'

definePageMeta({
	middleware: 'auth',
})

useHead({
	title: 'Vocabulary Learning - Tagalogoo',
	meta: [
		{
			name: 'description',
			content: 'Learn Tagalog vocabulary with spaced repetition flashcards.',
		},
	],
})

const isPageLoading = ref(true)
const pageError = ref<string | null>(null)
const isRetrying = ref(false)

async function initializePage() {
	try {
		isPageLoading.value = true
		pageError.value = null
		await new Promise((resolve) => setTimeout(resolve, 100))
	} catch (error) {
		pageError.value = error instanceof Error ? error.message : 'Failed to load page'
	} finally {
		isPageLoading.value = false
	}
}

async function retryPageLoad() {
	isRetrying.value = true
	await initializePage()
	isRetrying.value = false
}

function navigateToStudy() {
	navigateTo('/vocabulary/study')
}

function navigateToReview() {
	navigateTo('/vocabulary/review')
}

function navigateToStats() {
	navigateTo('/vocabulary/stats')
}

onMounted(() => {
	void initializePage()
})
</script>

<template>
  <div class="min-h-screen bg-base-200">
    <div
      v-if="isPageLoading"
      class="min-h-screen flex items-center justify-center"
    >
      <div class="text-center">
        <div class="loading loading-spinner loading-lg mb-4"></div>
        <p class="text-base-content/70">Loading vocabulary dashboard...</p>
      </div>
    </div>

    <div
      v-else-if="pageError"
      class="min-h-screen flex items-center justify-center p-4"
    >
      <div class="card bg-base-100 shadow-xl max-w-md w-full">
        <div class="card-body text-center">
          <AlertCircle class="w-16 h-16 text-error mx-auto mb-4" />
          <h2 class="card-title justify-center mb-2">Unable to Load Page</h2>
          <p class="text-base-content/70 mb-6">{{ pageError }}</p>

          <div class="card-actions justify-center">
            <button
              type="button"
              class="btn btn-primary"
              :class="{ loading: isRetrying }"
              :disabled="isRetrying"
              @click="retryPageLoad"
            >
              <RefreshCw v-if="!isRetrying" class="w-4 h-4" />
              {{ isRetrying ? "Retrying..." : "Try Again" }}
            </button>

            <NuxtLink to="/" class="btn btn-outline"> Go Home </NuxtLink>
          </div>
        </div>
      </div>
    </div>

    <div v-else>
      <div class="bg-base-100 border-b border-base-300">
        <div class="container mx-auto max-w-6xl px-4 py-3">
          <div class="breadcrumbs text-sm">
            <ul>
              <li>
                <NuxtLink to="/" class="link link-hover"> Home </NuxtLink>
              </li>
              <li>Vocabulary</li>
            </ul>
          </div>
        </div>
      </div>

      <VocabularyDashboard />

      <div class="bg-base-100 border-t border-base-300 mt-8">
        <div class="container mx-auto max-w-6xl px-4 py-6">
          <div class="flex flex-wrap gap-4 justify-center">
            <button
              type="button"
              class="btn btn-outline"
              @click="navigateToStudy"
            >
              Start Studying
            </button>

            <button
              type="button"
              class="btn btn-outline"
              @click="navigateToReview"
            >
              Review Words
            </button>

            <button
              type="button"
              class="btn btn-outline"
              @click="navigateToStats"
            >
              View Statistics
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
