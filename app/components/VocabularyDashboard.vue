<script setup lang="ts">
import { BookOpen, Calendar, Clock, Target, TrendingUp } from 'lucide-vue-next'
import { computed, onMounted, ref } from 'vue'
import CategoryCard from '~/components/CategoryCard.vue'
import { useVocabularyData } from '~/composables/useVocabularyData'
import type { CategoryProgress, ProgressStats } from '~/types/vocabulary'

// Reactive state
const isLoading = ref(true)
const error = ref<string | null>(null)
const categoryProgress = ref<CategoryProgress[]>([])
const progressStats = ref<ProgressStats | null>(null)

// Composables
const { getCategoryProgress, getProgressStats } = useVocabularyData()

// Computed properties
const totalDueCards = computed(() => {
	return categoryProgress.value.reduce((total, category) => total + category.dueWords, 0)
})

const hasCategories = computed(() => {
	return categoryProgress.value.length > 0
})

// Methods
async function loadDashboardData() {
	try {
		isLoading.value = true
		error.value = null

		// Load both category progress and overall stats in parallel
		const [categories, stats] = await Promise.all([getCategoryProgress(), getProgressStats()])

		categoryProgress.value = categories
		progressStats.value = stats
	} catch (err) {
		error.value = err instanceof Error ? err.message : 'Failed to load dashboard data'
	} finally {
		isLoading.value = false
	}
}

function navigateToCategory(categoryId: string) {
	navigateTo(`/vocabulary/study/${categoryId}`)
}

function navigateToReview() {
	navigateTo('/vocabulary/review')
}

function navigateToStats() {
	navigateTo('/vocabulary/stats')
}

// Lifecycle
onMounted(() => {
	void loadDashboardData()
})
</script>

<template>
  <div class="min-h-screen bg-base-200 p-4">
    <div class="container mx-auto max-w-6xl">
      <!-- Header -->
      <div class="text-center mb-8">
        <div class="badge badge-primary badge-lg mb-4">Vocabulary Learning</div>
        <h1 class="text-4xl font-bold mb-2">Your Learning Dashboard</h1>
        <p class="text-base-content/70 max-w-2xl mx-auto">
          Track your progress, review vocabulary, and continue your Tagalog
          learning journey.
        </p>
      </div>

      <!-- Loading State -->
      <div v-if="isLoading" class="flex justify-center items-center py-12">
        <div class="loading loading-spinner loading-lg"></div>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="alert alert-error mb-6">
        <span>{{ error }}</span>
        <button
          type="button"
          class="btn btn-sm btn-outline"
          @click="loadDashboardData"
        >
          Retry
        </button>
      </div>

      <!-- Dashboard Content -->
      <div v-else class="space-y-8">
        <!-- Progress Overview Cards -->
        <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <!-- Total Words Learned -->
          <div class="card bg-base-100 shadow-xl">
            <div class="card-body">
              <div class="flex items-center justify-between">
                <div>
                  <h3 class="text-sm font-medium text-base-content/70">
                    Words Learned
                  </h3>
                  <p class="text-2xl font-bold">
                    {{ progressStats?.wordsLearned || 0 }}
                  </p>
                </div>
                <BookOpen class="w-8 h-8 text-primary" />
              </div>
            </div>
          </div>

          <!-- Current Streak -->
          <div class="card bg-base-100 shadow-xl">
            <div class="card-body">
              <div class="flex items-center justify-between">
                <div>
                  <h3 class="text-sm font-medium text-base-content/70">
                    Current Streak
                  </h3>
                  <p class="text-2xl font-bold">
                    {{ progressStats?.currentStreak || 0 }}
                  </p>
                </div>
                <TrendingUp class="w-8 h-8 text-success" />
              </div>
            </div>
          </div>

          <!-- Due Cards -->
          <div class="card bg-base-100 shadow-xl">
            <div class="card-body">
              <div class="flex items-center justify-between">
                <div>
                  <h3 class="text-sm font-medium text-base-content/70">
                    Due for Review
                  </h3>
                  <p class="text-2xl font-bold">{{ totalDueCards }}</p>
                </div>
                <Clock class="w-8 h-8 text-warning" />
              </div>
            </div>
          </div>

          <!-- Average Accuracy -->
          <div class="card bg-base-100 shadow-xl">
            <div class="card-body">
              <div class="flex items-center justify-between">
                <div>
                  <h3 class="text-sm font-medium text-base-content/70">
                    Accuracy
                  </h3>
                  <p class="text-2xl font-bold">
                    {{ Math.round(progressStats?.averageAccuracy || 0) }}%
                  </p>
                </div>
                <Target class="w-8 h-8 text-info" />
              </div>
            </div>
          </div>
        </div>

        <!-- Quick Actions -->
        <div class="card bg-base-100 shadow-xl">
          <div class="card-body">
            <h2 class="card-title mb-4">Quick Actions</h2>
            <div class="grid gap-3 md:grid-cols-3">
              <button
                type="button"
                class="btn btn-primary btn-lg"
                :disabled="totalDueCards === 0"
                @click="navigateToReview"
              >
                <Calendar class="w-5 h-5" />
                Review Due Cards ({{ totalDueCards }})
              </button>

              <button
                type="button"
                class="btn btn-outline btn-lg"
                @click="navigateToStats"
              >
                <TrendingUp class="w-5 h-5" />
                View Statistics
              </button>

              <button
                type="button"
                class="btn btn-outline btn-lg"
                @click="loadDashboardData"
              >
                <Clock class="w-5 h-5" />
                Refresh Data
              </button>
            </div>
          </div>
        </div>

        <!-- Categories Grid -->
        <div class="card bg-base-100 shadow-xl">
          <div class="card-body">
            <h2 class="card-title mb-6">Vocabulary Categories</h2>

            <!-- Empty State -->
            <div v-if="!hasCategories" class="text-center py-12">
              <BookOpen class="w-16 h-16 mx-auto text-base-content/30 mb-4" />
              <h3 class="text-lg font-semibold mb-2">
                No Categories Available
              </h3>
              <p class="text-base-content/70 mb-4">
                Vocabulary categories will appear here once they're added to the
                system.
              </p>
            </div>

            <!-- Categories Grid -->
            <div v-else class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <CategoryCard
                v-for="category in categoryProgress"
                :key="category.categoryId"
                :category="category"
                @click="navigateToCategory"
                @study="navigateToCategory"
              />
            </div>
          </div>
        </div>

        <!-- Study Streak Info -->
        <div v-if="progressStats" class="card bg-base-100 shadow-xl">
          <div class="card-body">
            <h2 class="card-title mb-4">Learning Statistics</h2>
            <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div class="stat">
                <div class="stat-title">Total Words</div>
                <div class="stat-value text-primary">
                  {{ progressStats.totalWords }}
                </div>
                <div class="stat-desc">Available to learn</div>
              </div>

              <div class="stat">
                <div class="stat-title">Words Reviewed</div>
                <div class="stat-value text-secondary">
                  {{ progressStats.wordsReviewed }}
                </div>
                <div class="stat-desc">Ever studied</div>
              </div>

              <div class="stat">
                <div class="stat-title">Longest Streak</div>
                <div class="stat-value text-accent">
                  {{ progressStats.longestStreak }}
                </div>
                <div class="stat-desc">Days in a row</div>
              </div>

              <div class="stat">
                <div class="stat-title">Study Time</div>
                <div class="stat-value text-info">
                  {{ Math.round((progressStats.totalStudyTime || 0) / 60) }}
                </div>
                <div class="stat-desc">Minutes total</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
