<script setup lang="ts">
import { AlertCircle, ArrowLeft, Award, BarChart3, RefreshCw, TrendingUp } from 'lucide-vue-next'
import { computed, onMounted, ref } from 'vue'
import FlashcardStudy from '~/components/FlashcardStudy.vue'
import { useVocabularyData } from '~/composables/useVocabularyData'
import type { Category, StudySessionStats } from '~/types/vocabulary'

definePageMeta({
	middleware: 'auth',
})

const route = useRoute()
const router = useRouter()
const categoryId = computed(() => route.params.categoryId as string)

useHead({
	title: 'Study Session - Tagalogoo',
	meta: [
		{
			name: 'description',
			content: 'Study Tagalog vocabulary with spaced repetition flashcards.',
		},
	],
})

const { getCategoryById } = useVocabularyData()

const isPageLoading = ref(true)
const pageError = ref<string | null>(null)
const category = ref<Category | null>(null)
const sessionStats = ref<StudySessionStats | null>(null)
const showResults = ref(false)
const isRetrying = ref(false)

const accuracyColor = computed(() => {
	if (!sessionStats.value) return 'text-base-content'
	const accuracy = sessionStats.value.accuracy
	if (accuracy >= 90) return 'text-success'
	if (accuracy >= 70) return 'text-warning'
	return 'text-error'
})

const performanceMessage = computed(() => {
	if (!sessionStats.value) return ''
	const accuracy = sessionStats.value.accuracy
	if (accuracy >= 90) return "Excellent work! You're mastering these words."
	if (accuracy >= 70) return 'Good job! Keep practicing to improve.'
	return 'Keep studying! Practice makes perfect.'
})

const sessionDurationFormatted = computed(() => {
	if (!sessionStats.value) return '0:00'
	const seconds = sessionStats.value.sessionDuration
	const minutes = Math.floor(seconds / 60)
	const remainingSeconds = seconds % 60
	return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
})

const initializePage = async (): Promise<void> => {
	try {
		isPageLoading.value = true
		pageError.value = null

		if (!categoryId.value || typeof categoryId.value !== 'string') {
			throw new Error('Invalid category ID')
		}

		const categoryData = await getCategoryById(categoryId.value)
		if (!categoryData) {
			throw new Error('Category not found')
		}

		category.value = categoryData
	} catch (error) {
		pageError.value = error instanceof Error ? error.message : 'Failed to load study session'
	} finally {
		isPageLoading.value = false
	}
}

const handleSessionComplete = (stats: StudySessionStats): void => {
	sessionStats.value = stats
	showResults.value = true
}

const handleSessionCancel = (): void => {
	void router.push('/vocabulary')
}

const handleSessionError = (error: string): void => {
	pageError.value = error
}

const handleRetryPage = async (): Promise<void> => {
	isRetrying.value = true
	await initializePage()
	isRetrying.value = false
}

const handleStudyAgain = (): void => {
	sessionStats.value = null
	showResults.value = false
}

const handleGoToDashboard = (): void => {
	void router.push('/vocabulary')
}

const handleViewProgress = (): void => {
	void router.push('/vocabulary/progress')
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
        <p class="text-base-content/70">Loading study session...</p>
      </div>
    </div>

    <div
      v-else-if="pageError"
      class="min-h-screen flex items-center justify-center p-4"
    >
      <div class="card bg-base-100 shadow-xl max-w-md w-full">
        <div class="card-body text-center">
          <AlertCircle class="w-16 h-16 text-error mx-auto mb-4" />
          <h2 class="card-title justify-center mb-2">
            Unable to Load Study Session
          </h2>
          <p class="text-base-content/70 mb-6">{{ pageError }}</p>

          <div class="card-actions justify-center gap-2">
            <button
              type="button"
              class="btn btn-primary"
              :class="{ loading: isRetrying }"
              :disabled="isRetrying"
              @click="handleRetryPage"
            >
              <RefreshCw v-if="!isRetrying" class="w-4 h-4" />
              {{ isRetrying ? "Retrying..." : "Try Again" }}
            </button>

            <button
              type="button"
              class="btn btn-outline"
              @click="handleSessionCancel"
            >
              <ArrowLeft class="w-4 h-4" />
              Go Back
            </button>
          </div>
        </div>
      </div>
    </div>

    <div
      v-else-if="showResults && sessionStats"
      class="min-h-screen flex items-center justify-center p-4"
    >
      <div class="card bg-base-100 shadow-xl max-w-2xl w-full">
        <div class="card-body">
          <div class="text-center mb-6">
            <Award class="w-16 h-16 text-primary mx-auto mb-4" />
            <h2 class="card-title justify-center text-2xl mb-2">
              Session Complete!
            </h2>
            <p class="text-base-content/70">{{ performanceMessage }}</p>
          </div>

          <div v-if="category" class="bg-base-200 rounded-lg p-4 mb-6">
            <h3 class="font-semibold text-lg">{{ category.name }}</h3>
            <p v-if="category.description" class="text-base-content/70 text-sm">
              {{ category.description }}
            </p>
          </div>

          <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div class="stat bg-base-200 rounded-lg">
              <div class="stat-figure text-primary">
                <BarChart3 class="w-8 h-8" />
              </div>
              <div class="stat-title text-xs">Cards Studied</div>
              <div class="stat-value text-primary text-2xl">
                {{ sessionStats.cardsStudied }}
              </div>
            </div>

            <div class="stat bg-base-200 rounded-lg">
              <div class="stat-figure" :class="accuracyColor">
                <TrendingUp class="w-8 h-8" />
              </div>
              <div class="stat-title text-xs">Accuracy</div>
              <div class="stat-value text-2xl" :class="accuracyColor">
                {{ Math.round(sessionStats.accuracy) }}%
              </div>
            </div>

            <div class="stat bg-base-200 rounded-lg">
              <div class="stat-figure text-secondary">
                <Award class="w-8 h-8" />
              </div>
              <div class="stat-title text-xs">New Cards</div>
              <div class="stat-value text-secondary text-2xl">
                {{ sessionStats.newCardsLearned }}
              </div>
            </div>

            <div class="stat bg-base-200 rounded-lg">
              <div class="stat-title text-xs">Duration</div>
              <div class="stat-value text-accent text-2xl">
                {{ sessionDurationFormatted }}
              </div>
            </div>
          </div>

          <div class="bg-base-200 rounded-lg p-4 mb-6">
            <h4 class="font-semibold mb-3">Session Summary</h4>
            <div class="space-y-2 text-sm">
              <div class="flex justify-between">
                <span>Correct answers:</span>
                <span class="font-medium"
                  >{{ sessionStats.correctAnswers }} /
                  {{ sessionStats.cardsStudied }}</span
                >
              </div>
              <div class="flex justify-between">
                <span>New words learned:</span>
                <span class="font-medium">{{
                  sessionStats.newCardsLearned
                }}</span>
              </div>
              <div class="flex justify-between">
                <span>Study time:</span>
                <span class="font-medium">{{ sessionDurationFormatted }}</span>
              </div>
            </div>
          </div>

          <div class="card-actions justify-center gap-3">
            <button
              type="button"
              class="btn btn-primary"
              @click="handleStudyAgain"
            >
              <RefreshCw class="w-4 h-4" />
              Study Again
            </button>

            <button
              type="button"
              class="btn btn-secondary"
              @click="handleViewProgress"
            >
              <BarChart3 class="w-4 h-4" />
              View Progress
            </button>

            <button
              type="button"
              class="btn btn-outline"
              @click="handleGoToDashboard"
            >
              <ArrowLeft class="w-4 h-4" />
              Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="category && !showResults">
      <div class="bg-base-100 border-b border-base-300">
        <div class="container mx-auto max-w-6xl px-4 py-3">
          <div class="breadcrumbs text-sm">
            <ul>
              <li>
                <NuxtLink to="/" class="link link-hover">Home</NuxtLink>
              </li>
              <li>
                <NuxtLink to="/vocabulary" class="link link-hover"
                  >Vocabulary</NuxtLink
                >
              </li>
              <li>{{ category.name }}</li>
            </ul>
          </div>
        </div>
      </div>

      <FlashcardStudy
        :category-id="categoryId"
        :max-new-cards="5"
        @session-complete="handleSessionComplete"
        @session-cancel="handleSessionCancel"
        @error="handleSessionError"
      />
    </div>
  </div>
</template>

<style scoped>
.stat {
  padding: 1rem;
  min-height: auto;
}

.stat-value {
  font-size: 1.5rem;
  line-height: 1.2;
}

.stat-title {
  font-size: 0.75rem;
  opacity: 0.7;
}

.stat-figure {
  margin-bottom: 0.5rem;
}

@media (max-width: 768px) {
  .grid-cols-4 {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .stat-value {
    font-size: 1.25rem;
  }
}

.card {
  animation: slideUp 0.5s ease-out;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
