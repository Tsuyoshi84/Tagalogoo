<script setup lang="ts">
import { AlertCircle, ArrowLeft, RotateCcw } from 'lucide-vue-next'
import { computed, onMounted, ref, watch } from 'vue'
import { useVocabularyStudy } from '~/composables/useVocabularyStudy'
import type { StudySessionStats } from '~/types/vocabulary'
import FlashcardComponent from './FlashcardComponent.vue'

interface Props {
	/** Category ID to study */
	categoryId: string
	/** Maximum number of new cards per session */
	maxNewCards?: number
}

interface Emits {
	(e: 'sessionComplete', stats: StudySessionStats): void
	(e: 'sessionCancel'): void
	(e: 'error', error: string): void
}

const props = withDefaults(defineProps<Props>(), {
	maxNewCards: 5,
})

const emit = defineEmits<Emits>()

const {
	currentSession,
	isLoading,
	error,
	startSession,
	submitReview,
	endSession,
	cancelSession,
	getCurrentCard,
	hasMoreCards,
	getSessionProgress,
	getRemainingCardsCount,
} = useVocabularyStudy()

const flashcardRef = ref<InstanceType<typeof FlashcardComponent> | null>(null)
const showReviewButtons = ref(false)
const isSubmittingReview = ref(false)
const reviewStartTime = ref<Date | null>(null)

const currentCard = computed(() => getCurrentCard())
const sessionProgress = computed(() => getSessionProgress())
const remainingCards = computed(() => getRemainingCardsCount())

const progressPercentage = computed(() => {
	if (!sessionProgress.value) return 0
	return Math.round(((sessionProgress.value.current - 1) / sessionProgress.value.total) * 100)
})

const initializeSession = async (): Promise<void> => {
	try {
		await startSession(props.categoryId, props.maxNewCards)
		resetCardState()
	} catch (err) {
		const errorMessage = err instanceof Error ? err.message : 'Failed to start study session'
		emit('error', errorMessage)
	}
}

const resetCardState = (): void => {
	showReviewButtons.value = false
	reviewStartTime.value = new Date()
	flashcardRef.value?.resetCard()
}

const handleCardFlip = (isFlipped: boolean): void => {
	if (isFlipped && !showReviewButtons.value) {
		showReviewButtons.value = true
	}
}

const handleReviewSubmission = async (quality: 1 | 3 | 4 | 5): Promise<void> => {
	if (!currentCard.value || !reviewStartTime.value || isSubmittingReview.value) return

	isSubmittingReview.value = true

	try {
		const responseTime = Math.round((Date.now() - reviewStartTime.value.getTime()) / 1000)

		await submitReview({
			cardId: currentCard.value.id,
			quality,
			responseTime,
		})

		if (!hasMoreCards()) {
			const finalStats = endSession()
			emit('sessionComplete', finalStats)
		} else {
			resetCardState()
		}
	} catch (err) {
		const errorMessage = err instanceof Error ? err.message : 'Failed to submit review'
		emit('error', errorMessage)
	} finally {
		isSubmittingReview.value = false
	}
}

const handleSessionCancel = (): void => {
	cancelSession()
	emit('sessionCancel')
}

const handleRetry = (): void => {
	void initializeSession()
}

onMounted(() => {
	void initializeSession()
})

watch(
	() => props.categoryId,
	() => {
		void initializeSession()
	},
)
</script>

<template>
  <div class="flashcard-study-container min-h-screen bg-base-200">
    <div
      v-if="isLoading && !currentSession"
      class="min-h-screen flex items-center justify-center"
    >
      <div class="text-center">
        <div class="loading loading-spinner loading-lg mb-4"></div>
        <p class="text-base-content/70">Starting study session...</p>
      </div>
    </div>

    <div
      v-else-if="error && !currentSession"
      class="min-h-screen flex items-center justify-center p-4"
    >
      <div class="card bg-base-100 shadow-xl max-w-md w-full">
        <div class="card-body text-center">
          <AlertCircle class="w-16 h-16 text-error mx-auto mb-4" />
          <h2 class="card-title justify-center mb-2">Study Session Error</h2>
          <p class="text-base-content/70 mb-6">{{ error }}</p>

          <div class="card-actions justify-center gap-2">
            <button
              type="button"
              class="btn btn-primary"
              :disabled="isLoading"
              @click="handleRetry"
            >
              <RotateCcw class="w-4 h-4" />
              Try Again
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
      v-else-if="currentSession && currentCard"
      class="container mx-auto max-w-4xl px-4 py-6"
    >
      <div class="bg-base-100 rounded-lg shadow-sm p-4 mb-6">
        <div class="flex items-center justify-between mb-4">
          <button
            type="button"
            class="btn btn-ghost btn-sm"
            @click="handleSessionCancel"
          >
            <ArrowLeft class="w-4 h-4" />
            Exit Study
          </button>

          <div class="text-center">
            <div class="text-sm text-base-content/70">
              Card {{ sessionProgress?.current }} of
              {{ sessionProgress?.total }}
            </div>
            <div class="text-xs text-base-content/50">
              {{ remainingCards }} remaining
            </div>
          </div>

          <div class="text-right">
            <div class="text-sm font-medium">
              {{ Math.round(currentSession.sessionStats.accuracy) }}% accuracy
            </div>
            <div class="text-xs text-base-content/50">
              {{ currentSession.sessionStats.cardsStudied }} studied
            </div>
          </div>
        </div>

        <div class="w-full bg-base-300 rounded-full h-2">
          <div
            class="bg-primary h-2 rounded-full transition-all duration-300"
            :style="{ width: `${progressPercentage}%` }"
          ></div>
        </div>
      </div>

      <div class="mb-8">
        <FlashcardComponent
          ref="flashcardRef"
          :flashcard="currentCard"
          @flip="handleCardFlip"
        />
      </div>

      <div
        v-if="showReviewButtons"
        class="bg-base-100 rounded-lg shadow-sm p-6"
      >
        <h3 class="text-lg font-semibold text-center mb-4">
          How well did you know this word?
        </h3>

        <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
          <button
            type="button"
            class="btn btn-error btn-outline flex-col h-auto py-4"
            :disabled="isSubmittingReview"
            @click="handleReviewSubmission(1)"
          >
            <span class="font-bold">Again</span>
            <span class="text-xs opacity-70">Didn't know</span>
            <span class="text-xs opacity-50">&lt; 1 min</span>
          </button>

          <button
            type="button"
            class="btn btn-warning btn-outline flex-col h-auto py-4"
            :disabled="isSubmittingReview"
            @click="handleReviewSubmission(3)"
          >
            <span class="font-bold">Hard</span>
            <span class="text-xs opacity-70">Difficult</span>
            <span class="text-xs opacity-50">&lt; 6 min</span>
          </button>

          <button
            type="button"
            class="btn btn-success btn-outline flex-col h-auto py-4"
            :disabled="isSubmittingReview"
            @click="handleReviewSubmission(4)"
          >
            <span class="font-bold">Good</span>
            <span class="text-xs opacity-70">Correct</span>
            <span class="text-xs opacity-50">&lt; 10 min</span>
          </button>

          <button
            type="button"
            class="btn btn-info btn-outline flex-col h-auto py-4"
            :disabled="isSubmittingReview"
            @click="handleReviewSubmission(5)"
          >
            <span class="font-bold">Easy</span>
            <span class="text-xs opacity-70">Very easy</span>
            <span class="text-xs opacity-50">4 days</span>
          </button>
        </div>

        <div v-if="isSubmittingReview" class="text-center mt-4">
          <div class="loading loading-spinner loading-sm"></div>
          <span class="text-sm text-base-content/70 ml-2"
            >Saving review...</span
          >
        </div>
      </div>

      <div v-else class="bg-base-100 rounded-lg shadow-sm p-6 text-center">
        <p class="text-base-content/70">
          Study the Tagalog word, then
          <span class="kbd kbd-sm">tap the card</span> to reveal the translation
          and examples.
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.btn.flex-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  min-height: 4rem;
}

.flashcard-study-container * {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.bg-primary {
  transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}
</style>
