<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useDifficultWordsReview } from '../composables/useDifficultWordsReview'
import FlashcardComponent from './FlashcardComponent.vue'

interface Props {
	/** Optional category ID to filter difficult words by category */
	categoryId?: string
}

interface Emits {
	(e: 'close'): void
	(
		e: 'sessionComplete',
		stats: {
			cardsStudied: number
			correctAnswers: number
			accuracy: number
			improvedWords: number
		},
	): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Composables
const {
	currentSession,
	isLoading,
	error,
	startDifficultWordsSession,
	submitDifficultWordReview,
	endSession,
	cancelSession,
	getCurrentCard,
	hasMoreCards,
	getSessionProgress,
	getRemainingCardsCount,
	getImprovedWordsCount,
} = useDifficultWordsReview()

// Local state
const cardFlipped = ref(false)
const isSubmittingReview = ref(false)
const sessionComplete = ref(false)
const sessionStats = ref<{
	cardsStudied: number
	correctAnswers: number
	accuracy: number
	improvedWords: number
} | null>(null)

// Computed properties
const currentCard = computed(() => getCurrentCard())
const progress = computed(() => getSessionProgress())
const remainingCards = computed(() => getRemainingCardsCount())
const improvedWordsCount = computed(() => getImprovedWordsCount())

// Methods
const startNewSession = async () => {
	try {
		sessionComplete.value = false
		sessionStats.value = null
		cardFlipped.value = false
		await startDifficultWordsSession(props.categoryId)
	} catch {
		// Error is already handled by setting error state
	}
}

const retrySession = () => {
	void startNewSession()
}

const handleCardFlip = () => {
	cardFlipped.value = true
}

const submitReview = async (quality: 1 | 3 | 4 | 5) => {
	if (!currentCard.value) return

	isSubmittingReview.value = true
	cardFlipped.value = false

	try {
		await submitDifficultWordReview({
			cardId: currentCard.value.id,
			quality,
			responseTime: 0, // Could track actual response time if needed
		})

		// Check if there are more cards
		if (!hasMoreCards()) {
			// Session complete
			const stats = endSession()
			sessionStats.value = stats
			sessionComplete.value = true
			emit('sessionComplete', stats)
		}
	} catch {
		// Error is already handled by setting error state
	} finally {
		isSubmittingReview.value = false
	}
}

const cancelReviewSession = () => {
	cancelSession()
	emit('close')
}

// Initialize session on mount
onMounted(() => {
	void startNewSession()
})
</script>

<template>
  <div class="difficult-words-review">
    <!-- Loading State -->
    <div v-if="isLoading" class="flex justify-center items-center min-h-64">
      <div class="loading loading-spinner loading-lg"></div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="alert alert-error">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        class="stroke-current shrink-0 h-6 w-6"
        fill="none"
        viewBox="0 0 24 24"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <span>{{ error }}</span>
      <div class="flex gap-2">
        <button
          type="button"
          class="btn btn-sm btn-outline"
          @click="retrySession"
        >
          Retry
        </button>
        <button
          type="button"
          class="btn btn-sm btn-ghost"
          @click="$emit('close')"
        >
          Close
        </button>
      </div>
    </div>

    <!-- Session Complete -->
    <div v-else-if="sessionComplete" class="text-center space-y-6">
      <div class="hero bg-base-200 rounded-lg">
        <div class="hero-content text-center">
          <div class="max-w-md">
            <h1 class="text-3xl font-bold">🎉 Session Complete!</h1>
            <p class="py-6">
              Great work on your difficult words review! You've made progress on
              challenging vocabulary.
            </p>

            <div class="stats stats-vertical lg:stats-horizontal shadow">
              <div class="stat">
                <div class="stat-title">Cards Reviewed</div>
                <div class="stat-value text-primary">
                  {{ sessionStats?.cardsStudied || 0 }}
                </div>
              </div>
              <div class="stat">
                <div class="stat-title">Accuracy</div>
                <div class="stat-value text-secondary">
                  {{ Math.round(sessionStats?.accuracy || 0) }}%
                </div>
              </div>
              <div class="stat">
                <div class="stat-title">Words Improved</div>
                <div class="stat-value text-success">
                  {{ sessionStats?.improvedWords || 0 }}
                </div>
              </div>
            </div>

            <div class="flex gap-4 justify-center mt-6">
              <button
                type="button"
                class="btn btn-primary"
                @click="startNewSession"
              >
                Review Again
              </button>
              <button
                type="button"
                class="btn btn-outline"
                @click="$emit('close')"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Active Session -->
    <div v-else-if="currentSession && currentCard" class="space-y-6">
      <!-- Progress Header -->
      <div class="flex justify-between items-center">
        <div class="flex items-center gap-4">
          <h2 class="text-2xl font-bold">Difficult Words Review</h2>
          <div class="badge badge-warning">
            {{ currentCard.category?.name }}
          </div>
        </div>
        <button
          type="button"
          class="btn btn-ghost btn-sm"
          @click="cancelReviewSession"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      <!-- Progress Bar -->
      <div class="w-full">
        <div class="flex justify-between text-sm mb-2">
          <span>Progress</span>
          <span>{{ progress?.current || 0 }} / {{ progress?.total || 0 }}</span>
        </div>
        <progress
          class="progress progress-primary w-full"
          :value="progress?.percentage || 0"
          max="100"
        ></progress>
      </div>

      <!-- Session Stats -->
      <div class="stats stats-horizontal shadow w-full">
        <div class="stat">
          <div class="stat-title">Reviewed</div>
          <div class="stat-value text-sm">
            {{ currentSession.sessionStats.cardsStudied }}
          </div>
        </div>
        <div class="stat">
          <div class="stat-title">Accuracy</div>
          <div class="stat-value text-sm">
            {{ Math.round(currentSession.sessionStats.accuracy) }}%
          </div>
        </div>
        <div class="stat">
          <div class="stat-title">Improved</div>
          <div class="stat-value text-sm text-success">
            {{ improvedWordsCount }}
          </div>
        </div>
        <div class="stat">
          <div class="stat-title">Remaining</div>
          <div class="stat-value text-sm">{{ remainingCards }}</div>
        </div>
      </div>

      <!-- Difficulty Indicator -->
      <div class="alert alert-warning">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="stroke-current shrink-0 h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
          />
        </svg>
        <div>
          <h3 class="font-bold">Challenging Word</h3>
          <div class="text-xs">
            <span v-if="currentCard.review">
              Lapses: {{ currentCard.review.lapses }} | Ease:
              {{ currentCard.review.ease?.toFixed(1) }}
            </span>
          </div>
        </div>
      </div>

      <!-- Flashcard -->
      <FlashcardComponent :flashcard="currentCard" @flip="handleCardFlip" />

      <!-- Review Buttons -->
      <div v-if="cardFlipped" class="flex gap-2 justify-center">
        <button
          type="button"
          class="btn btn-error flex-1 max-w-24"
          :disabled="isSubmittingReview"
          @click="submitReview(1)"
        >
          <span class="text-xs">Again</span>
        </button>
        <button
          type="button"
          class="btn btn-warning flex-1 max-w-24"
          :disabled="isSubmittingReview"
          @click="submitReview(3)"
        >
          <span class="text-xs">Hard</span>
        </button>
        <button
          type="button"
          class="btn btn-success flex-1 max-w-24"
          :disabled="isSubmittingReview"
          @click="submitReview(4)"
        >
          <span class="text-xs">Good</span>
        </button>
        <button
          type="button"
          class="btn btn-info flex-1 max-w-24"
          :disabled="isSubmittingReview"
          @click="submitReview(5)"
        >
          <span class="text-xs">Easy</span>
        </button>
      </div>

      <!-- Loading overlay for review submission -->
      <div
        v-if="isSubmittingReview"
        class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      >
        <div class="loading loading-spinner loading-lg"></div>
      </div>
    </div>

    <!-- No Difficult Words -->
    <div v-else class="hero bg-base-200 rounded-lg min-h-64">
      <div class="hero-content text-center">
        <div class="max-w-md">
          <h1 class="text-3xl font-bold">🌟 Excellent!</h1>
          <p class="py-6">
            You don't have any difficult words to review right now. Keep up the
            great work with your regular study sessions!
          </p>
          <button type="button" class="btn btn-primary" @click="$emit('close')">
            Continue Learning
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.difficult-words-review {
  @apply max-w-2xl mx-auto p-4;
}

.stats {
  @apply bg-base-100;
}

.progress {
  @apply h-2;
}

.alert {
  @apply text-sm;
}
</style>
