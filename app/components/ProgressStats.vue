<script setup lang="ts">
import { BarChart3, Clock, Target, TrendingUp, Trophy, Users } from 'lucide-vue-next'
import { computed, onMounted, ref, watch } from 'vue'
import { useVocabularyData } from '~/composables/useVocabularyData'
import type { CategoryProgress, ProgressStats } from '~/types/vocabulary'

// Props
interface Props {
	/** Optional category ID to filter statistics by specific category */
	categoryId?: string
	/** Time range for filtering statistics */
	timeRange?: 'week' | 'month' | 'year' | 'all'
	/** Whether to show filter controls */
	showFilters?: boolean
}

const props = withDefaults(defineProps<Props>(), {
	categoryId: undefined,
	timeRange: 'month',
})

// Reactive state
const isLoading = ref(true)
const error = ref<string | null>(null)
const progressStats = ref<ProgressStats | null>(null)
const categoryProgress = ref<CategoryProgress[]>([])
const selectedCategory = ref<string>(props.categoryId || 'all')
const selectedTimeRange = ref<'week' | 'month' | 'year' | 'all'>(props.timeRange)

// Composables
const { getProgressStats, getCategoryProgress } = useVocabularyData()

// Computed properties
const filteredCategoryProgress = computed(() => {
	if (selectedCategory.value === 'all') {
		return categoryProgress.value
	}
	return categoryProgress.value.filter((cat) => cat.categoryId === selectedCategory.value)
})

const totalWordsInFilter = computed(() => {
	return filteredCategoryProgress.value.reduce((total, cat) => total + cat.totalWords, 0)
})

const totalLearnedInFilter = computed(() => {
	return filteredCategoryProgress.value.reduce((total, cat) => total + cat.wordsLearned, 0)
})

const totalDueInFilter = computed(() => {
	return filteredCategoryProgress.value.reduce((total, cat) => total + cat.dueWords, 0)
})

const overallCompletionRate = computed(() => {
	if (totalWordsInFilter.value === 0) return 0
	return Math.round((totalLearnedInFilter.value / totalWordsInFilter.value) * 100)
})

const categoryOptions = computed(() => [
	{ value: 'all', label: 'All Categories' },
	...categoryProgress.value.map((cat) => ({
		value: cat.categoryId,
		label: cat.categoryName,
	})),
])

const timeRangeOptions = [
	{ value: 'week', label: 'Last Week' },
	{ value: 'month', label: 'Last Month' },
	{ value: 'year', label: 'Last Year' },
	{ value: 'all', label: 'All Time' },
]

const achievementBadges = computed(() => {
	if (!progressStats.value) return []

	const badges = []
	const stats = progressStats.value

	// Streak achievements
	if (stats.currentStreak >= 7) {
		badges.push({
			title: 'Week Warrior',
			description: '7+ day streak',
			icon: 'streak',
			color: 'badge-warning',
		})
	}
	if (stats.currentStreak >= 30) {
		badges.push({
			title: 'Month Master',
			description: '30+ day streak',
			icon: 'streak',
			color: 'badge-error',
		})
	}

	// Learning achievements
	if (stats.wordsLearned >= 50) {
		badges.push({
			title: 'Vocabulary Builder',
			description: '50+ words learned',
			icon: 'words',
			color: 'badge-success',
		})
	}
	if (stats.wordsLearned >= 200) {
		badges.push({
			title: 'Word Master',
			description: '200+ words learned',
			icon: 'words',
			color: 'badge-primary',
		})
	}

	// Accuracy achievements
	if (stats.averageAccuracy >= 80) {
		badges.push({
			title: 'Accuracy Expert',
			description: '80%+ accuracy',
			icon: 'accuracy',
			color: 'badge-info',
		})
	}

	return badges
})

// Methods
async function loadProgressData() {
	try {
		isLoading.value = true
		error.value = null

		// Load both overall stats and category progress
		const [stats, categories] = await Promise.all([getProgressStats(), getCategoryProgress()])

		progressStats.value = stats
		categoryProgress.value = categories
	} catch (err) {
		error.value = err instanceof Error ? err.message : 'Failed to load progress data'
	} finally {
		isLoading.value = false
	}
}

function getProgressBarColor(percentage: number): string {
	if (percentage >= 80) return 'progress-success'
	if (percentage >= 60) return 'progress-info'
	if (percentage >= 40) return 'progress-warning'
	return 'progress-error'
}

function formatStudyTime(seconds: number): string {
	const hours = Math.floor(seconds / 3600)
	const minutes = Math.floor((seconds % 3600) / 60)

	if (hours > 0) {
		return `${hours}h ${minutes}m`
	}
	return `${minutes}m`
}

// Watchers
watch([selectedCategory, selectedTimeRange], () => {
	// In a real implementation, this would trigger filtered data loading
	// For now, we just use the existing data with client-side filtering
})

// Lifecycle
onMounted(() => {
	void loadProgressData()
})
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div
      class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
    >
      <div>
        <h2 class="text-2xl font-bold">Learning Statistics</h2>
        <p class="text-base-content/70">Track your progress and achievements</p>
      </div>

      <!-- Filters -->
      <div v-if="props.showFilters" class="flex flex-col sm:flex-row gap-3">
        <div class="form-control">
          <label class="label">
            <span class="label-text">Category</span>
          </label>
          <select
            v-model="selectedCategory"
            class="select select-bordered select-sm"
          >
            <option
              v-for="option in categoryOptions"
              :key="option.value"
              :value="option.value"
            >
              {{ option.label }}
            </option>
          </select>
        </div>

        <div class="form-control">
          <label class="label">
            <span class="label-text">Time Range</span>
          </label>
          <select
            v-model="selectedTimeRange"
            class="select select-bordered select-sm"
          >
            <option
              v-for="option in timeRangeOptions"
              :key="option.value"
              :value="option.value"
            >
              {{ option.label }}
            </option>
          </select>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="flex justify-center items-center py-12">
      <div class="loading loading-spinner loading-lg"></div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="alert alert-error">
      <span>{{ error }}</span>
      <button
        type="button"
        class="btn btn-sm btn-outline"
        @click="loadProgressData"
      >
        Retry
      </button>
    </div>

    <!-- Progress Content -->
    <div v-else class="space-y-6">
      <!-- Key Metrics Cards -->
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <!-- Words Learned -->
        <div class="card bg-base-100 shadow-xl">
          <div class="card-body">
            <div class="flex items-center justify-between">
              <div>
                <h3 class="text-sm font-medium text-base-content/70">
                  Words Learned
                </h3>
                <p class="text-2xl font-bold">
                  {{ totalLearnedInFilter }}
                </p>
                <p class="text-xs text-base-content/50">
                  of {{ totalWordsInFilter }} total
                </p>
              </div>
              <Target class="w-8 h-8 text-primary" />
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
                <p class="text-xs text-base-content/50">days in a row</p>
              </div>
              <TrendingUp class="w-8 h-8 text-success" />
            </div>
          </div>
        </div>

        <!-- Accuracy Rate -->
        <div class="card bg-base-100 shadow-xl">
          <div class="card-body">
            <div class="flex items-center justify-between">
              <div>
                <h3 class="text-sm font-medium text-base-content/70">
                  Accuracy Rate
                </h3>
                <p class="text-2xl font-bold">
                  {{ Math.round(progressStats?.averageAccuracy || 0) }}%
                </p>
                <p class="text-xs text-base-content/50">average score</p>
              </div>
              <BarChart3 class="w-8 h-8 text-info" />
            </div>
          </div>
        </div>

        <!-- Study Time -->
        <div class="card bg-base-100 shadow-xl">
          <div class="card-body">
            <div class="flex items-center justify-between">
              <div>
                <h3 class="text-sm font-medium text-base-content/70">
                  Study Time
                </h3>
                <p class="text-2xl font-bold">
                  {{ formatStudyTime(progressStats?.totalStudyTime || 0) }}
                </p>
                <p class="text-xs text-base-content/50">total time</p>
              </div>
              <Clock class="w-8 h-8 text-warning" />
            </div>
          </div>
        </div>
      </div>

      <!-- Achievement Badges -->
      <div
        v-if="achievementBadges.length > 0"
        class="card bg-base-100 shadow-xl"
      >
        <div class="card-body">
          <h3 class="card-title mb-4">
            <Trophy class="w-5 h-5" />
            Achievements
          </h3>
          <div class="flex flex-wrap gap-3">
            <div
              v-for="badge in achievementBadges"
              :key="badge.title"
              class="tooltip"
              :data-tip="badge.description"
            >
              <div :class="['badge badge-lg', badge.color]">
                {{ badge.title }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Overall Progress -->
      <div class="card bg-base-100 shadow-xl">
        <div class="card-body">
          <h3 class="card-title mb-4">
            <BarChart3 class="w-5 h-5" />
            Overall Progress
          </h3>
          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <span class="text-sm font-medium">Completion Rate</span>
              <span class="text-sm font-bold"
                >{{ overallCompletionRate }}%</span
              >
            </div>
            <progress
              :class="[
                'progress w-full',
                getProgressBarColor(overallCompletionRate),
              ]"
              :value="overallCompletionRate"
              max="100"
            ></progress>
            <div class="grid grid-cols-3 gap-4 text-center">
              <div>
                <p class="text-2xl font-bold text-success">
                  {{ totalLearnedInFilter }}
                </p>
                <p class="text-xs text-base-content/70">Learned</p>
              </div>
              <div>
                <p class="text-2xl font-bold text-warning">
                  {{ totalDueInFilter }}
                </p>
                <p class="text-xs text-base-content/70">Due</p>
              </div>
              <div>
                <p class="text-2xl font-bold text-base-content/50">
                  {{ totalWordsInFilter - totalLearnedInFilter }}
                </p>
                <p class="text-xs text-base-content/70">Remaining</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Category Breakdown -->
      <div class="card bg-base-100 shadow-xl">
        <div class="card-body">
          <h3 class="card-title mb-4">
            <Users class="w-5 h-5" />
            Category Progress
          </h3>
          <div class="space-y-4">
            <div
              v-for="category in filteredCategoryProgress"
              :key="category.categoryId"
              class="space-y-2"
            >
              <div class="flex items-center justify-between">
                <div>
                  <h4 class="font-medium">{{ category.categoryName }}</h4>
                  <p class="text-sm text-base-content/70">
                    {{ category.wordsLearned }} of
                    {{ category.totalWords }} words
                    <span v-if="category.dueWords > 0" class="text-warning">
                      ({{ category.dueWords }} due)
                    </span>
                  </p>
                </div>
                <div class="text-right">
                  <span class="text-sm font-bold">
                    {{ Math.round(category.completionPercentage) }}%
                  </span>
                </div>
              </div>
              <progress
                :class="[
                  'progress w-full',
                  getProgressBarColor(category.completionPercentage),
                ]"
                :value="category.completionPercentage"
                max="100"
              ></progress>
            </div>
          </div>
        </div>
      </div>

      <!-- Detailed Statistics -->
      <div class="grid gap-6 lg:grid-cols-2">
        <!-- Learning Stats -->
        <div class="card bg-base-100 shadow-xl">
          <div class="card-body">
            <h3 class="card-title mb-4">Learning Statistics</h3>
            <div class="space-y-3">
              <div class="flex justify-between">
                <span class="text-base-content/70">Total Words Available</span>
                <span class="font-semibold">{{
                  progressStats?.totalWords || 0
                }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-base-content/70">Words Ever Reviewed</span>
                <span class="font-semibold">{{
                  progressStats?.wordsReviewed || 0
                }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-base-content/70">Words Mastered</span>
                <span class="font-semibold">{{
                  progressStats?.wordsLearned || 0
                }}</span>
              </div>
              <div class="divider"></div>
              <div class="flex justify-between">
                <span class="text-base-content/70">Learning Rate</span>
                <span class="font-semibold">
                  {{
                    progressStats?.totalWords
                      ? Math.round(
                          (progressStats.wordsLearned /
                            progressStats.totalWords) *
                            100
                        )
                      : 0
                  }}%
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Streak Stats -->
        <div class="card bg-base-100 shadow-xl">
          <div class="card-body">
            <h3 class="card-title mb-4">Streak Statistics</h3>
            <div class="space-y-3">
              <div class="flex justify-between">
                <span class="text-base-content/70">Current Streak</span>
                <span class="font-semibold"
                  >{{ progressStats?.currentStreak || 0 }} days</span
                >
              </div>
              <div class="flex justify-between">
                <span class="text-base-content/70">Longest Streak</span>
                <span class="font-semibold"
                  >{{ progressStats?.longestStreak || 0 }} days</span
                >
              </div>
              <div class="flex justify-between">
                <span class="text-base-content/70">Average Accuracy</span>
                <span class="font-semibold"
                  >{{ Math.round(progressStats?.averageAccuracy || 0) }}%</span
                >
              </div>
              <div class="divider"></div>
              <div class="flex justify-between">
                <span class="text-base-content/70">Total Study Time</span>
                <span class="font-semibold">{{
                  formatStudyTime(progressStats?.totalStudyTime || 0)
                }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
