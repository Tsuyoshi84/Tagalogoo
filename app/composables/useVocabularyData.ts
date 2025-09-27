import type { Database } from '../../types/database.types'
import type {
	Category,
	CategoryProgress,
	FlashcardData,
	ProgressStats,
	Review,
	ReviewInsert,
	ReviewUpdate,
	Word,
} from '../types/vocabulary'

/**
 * Composable for vocabulary data access operations using Supabase client
 */
export function useVocabularyData() {
	const supabase = useSupabaseClient<Database>()
	const user = useSupabaseUser()

	/**
	 * Fetch all categories with optional word counts
	 */
	const getCategories = async (includeWordCount = false): Promise<Category[]> => {
		if (includeWordCount) {
			const { data, error } = await supabase
				.from('categories')
				.select(`
					*,
					words(count)
				`)
				.order('sort_order', { ascending: true })

			if (error) {
				throw new Error(`Failed to fetch categories: ${error.message}`)
			}

			return data.map((category) => ({
				...category,
				wordCount: category.words?.[0]?.count || 0,
			}))
		} else {
			const { data, error } = await supabase
				.from('categories')
				.select('*')
				.order('sort_order', { ascending: true })

			if (error) {
				throw new Error(`Failed to fetch categories: ${error.message}`)
			}

			return data.map((category) => ({
				...category,
				wordCount: 0,
			}))
		}
	}

	/**
	 * Fetch a single category by ID
	 */
	const getCategoryById = async (categoryId: string): Promise<Category | null> => {
		const { data, error } = await supabase
			.from('categories')
			.select('*')
			.eq('id', categoryId)
			.single()

		if (error) {
			if (error.code === 'PGRST116') return null // Not found
			throw new Error(`Failed to fetch category: ${error.message}`)
		}

		return data
	}

	/**
	 * Fetch words for a specific category with examples
	 */
	const getWordsByCategory = async (categoryId: string): Promise<Word[]> => {
		const { data, error } = await supabase
			.from('words')
			.select(`
				*,
				examples(*),
				categories(*)
			`)
			.eq('category_id', categoryId)
			.order('created_at', { ascending: true })

		if (error) {
			throw new Error(`Failed to fetch words: ${error.message}`)
		}

		return data.map((word) => ({
			...word,
			examples: word.examples || [],
			category: word.categories,
		}))
	}

	/**
	 * Fetch due cards for study session with joined data
	 */
	const getDueCards = async (categoryId?: string): Promise<FlashcardData[]> => {
		if (!user.value?.id) {
			throw new Error('User must be authenticated to fetch due cards')
		}

		let query = supabase
			.from('words')
			.select(`
				*,
				examples(*),
				categories(*),
				reviews!inner(*)
			`)
			.eq('reviews.user_id', user.value.id)
			.lte('reviews.next_due', new Date().toISOString().split('T')[0])

		if (categoryId) {
			query = query.eq('category_id', categoryId)
		}

		const { data, error } = await query.order('reviews.next_due', { ascending: true })

		if (error) {
			throw new Error(`Failed to fetch due cards: ${error.message}`)
		}

		return data.map((item) => ({
			...item,
			examples: item.examples || [],
			category: item.categories,
			review: item.reviews?.[0],
		}))
	}

	/**
	 * Fetch new cards (words without reviews) for a category
	 */
	const getNewCards = async (categoryId: string, limit = 10): Promise<FlashcardData[]> => {
		if (!user.value?.id) {
			throw new Error('User must be authenticated to fetch new cards')
		}

		const { data, error } = await supabase
			.from('words')
			.select(`
				*,
				examples(*),
				categories(*)
			`)
			.eq('category_id', categoryId)
			.not(
				'id',
				'in',
				`(
				SELECT word_id FROM reviews WHERE user_id = '${user.value.id}'
			)`,
			)
			.limit(limit)
			.order('created_at', { ascending: true })

		if (error) {
			throw new Error(`Failed to fetch new cards: ${error.message}`)
		}

		return data.map((word) => ({
			...word,
			examples: word.examples || [],
			category: word.categories,
		}))
	}

	/**
	 * Get user's review for a specific word
	 */
	const getUserReview = async (wordId: string): Promise<Review | null> => {
		if (!user.value?.id) return null

		const { data, error } = await supabase
			.from('reviews')
			.select('*')
			.eq('user_id', user.value.id)
			.eq('word_id', wordId)
			.single()

		if (error) {
			if (error.code === 'PGRST116') return null // Not found
			throw new Error(`Failed to fetch review: ${error.message}`)
		}

		return data
	}

	/**
	 * Create a new review record for a word
	 */
	const createReview = async (
		wordId: string,
		reviewData: Partial<ReviewInsert> = {},
	): Promise<Review> => {
		if (!user.value?.id) {
			throw new Error('User must be authenticated to create review')
		}

		const newReview: ReviewInsert = {
			user_id: user.value.id,
			word_id: wordId,
			ease: 2.5,
			interval_days: 0,
			reps: 0,
			lapses: 0,
			next_due: new Date().toISOString().split('T')[0],
			...reviewData,
		}

		const { data, error } = await supabase.from('reviews').insert(newReview).select().single()

		if (error) {
			throw new Error(`Failed to create review: ${error.message}`)
		}

		return data
	}

	/**
	 * Update an existing review record
	 */
	const updateReview = async (wordId: string, updates: ReviewUpdate): Promise<Review> => {
		if (!user.value?.id) {
			throw new Error('User must be authenticated to update review')
		}

		const { data, error } = await supabase
			.from('reviews')
			.update(updates)
			.eq('user_id', user.value.id)
			.eq('word_id', wordId)
			.select()
			.single()

		if (error) {
			throw new Error(`Failed to update review: ${error.message}`)
		}

		return data
	}

	/**
	 * Get category progress for the current user
	 */
	const getCategoryProgress = async (categoryId?: string): Promise<CategoryProgress[]> => {
		if (!user.value?.id) {
			throw new Error('User must be authenticated to fetch progress')
		}

		// This would typically be a database function or view for better performance
		// For now, we'll use multiple queries
		let categoriesQuery = supabase
			.from('categories')
			.select(`
				id,
				name,
				words(count)
			`)
			.order('sort_order', { ascending: true })

		if (categoryId) {
			categoriesQuery = categoriesQuery.eq('id', categoryId)
		}

		const { data: categories, error: categoriesError } = await categoriesQuery

		if (categoriesError) {
			throw new Error(`Failed to fetch category progress: ${categoriesError.message}`)
		}

		const progress: CategoryProgress[] = []

		for (const category of categories) {
			const totalWords = category.words?.[0]?.count || 0

			// Get word IDs for this category first
			const { data: categoryWords, error: wordsError } = await supabase
				.from('words')
				.select('id')
				.eq('category_id', category.id)

			if (wordsError) {
				throw new Error(`Failed to fetch category words: ${wordsError.message}`)
			}

			const wordIds = categoryWords.map((w) => w.id)

			// Get learned words (words with reviews that have reps > 0)
			const { count: learnedCount, error: learnedError } = await supabase
				.from('reviews')
				.select('*', { count: 'exact', head: true })
				.eq('user_id', user.value.id)
				.gt('reps', 0)
				.in('word_id', wordIds)

			if (learnedError) {
				throw new Error(`Failed to fetch learned words: ${learnedError.message}`)
			}

			// Get due words
			const { count: dueCount, error: dueError } = await supabase
				.from('reviews')
				.select('*', { count: 'exact', head: true })
				.eq('user_id', user.value.id)
				.lte('next_due', new Date().toISOString().split('T')[0])
				.in('word_id', wordIds)

			if (dueError) {
				throw new Error(`Failed to fetch due words: ${dueError.message}`)
			}

			const wordsLearned = learnedCount || 0
			const dueWords = dueCount || 0
			const completionPercentage = totalWords > 0 ? (wordsLearned / totalWords) * 100 : 0

			progress.push({
				categoryId: category.id,
				categoryName: category.name,
				totalWords,
				wordsLearned,
				dueWords,
				completionPercentage,
			})
		}

		return progress
	}

	/**
	 * Get overall progress statistics for the current user
	 */
	const getProgressStats = async (): Promise<ProgressStats> => {
		if (!user.value?.id) {
			throw new Error('User must be authenticated to fetch progress stats')
		}

		// Get total words count
		const { count: totalWords, error: totalWordsError } = await supabase
			.from('words')
			.select('*', { count: 'exact', head: true })

		if (totalWordsError) {
			throw new Error(`Failed to fetch total words: ${totalWordsError.message}`)
		}

		// Get learned words count (reviews with reps > 0)
		const { count: wordsLearned, error: learnedError } = await supabase
			.from('reviews')
			.select('*', { count: 'exact', head: true })
			.eq('user_id', user.value.id)
			.gt('reps', 0)

		if (learnedError) {
			throw new Error(`Failed to fetch learned words: ${learnedError.message}`)
		}

		// Get reviewed words count (all reviews)
		const { count: wordsReviewed, error: reviewedError } = await supabase
			.from('reviews')
			.select('*', { count: 'exact', head: true })
			.eq('user_id', user.value.id)

		if (reviewedError) {
			throw new Error(`Failed to fetch reviewed words: ${reviewedError.message}`)
		}

		// Get daily stats for streak and accuracy calculation
		const { data: dailyStats, error: statsError } = await supabase
			.from('daily_stats')
			.select('*')
			.eq('user_id', user.value.id)
			.order('date', { ascending: false })
			.limit(30) // Last 30 days

		if (statsError) {
			throw new Error(`Failed to fetch daily stats: ${statsError.message}`)
		}

		// Calculate streaks and averages
		let currentStreak = 0
		let longestStreak = 0
		let totalCorrect = 0
		let totalStudied = 0
		let totalStudyTime = 0

		const _today = new Date().toISOString().split('T')[0]
		const checkDate = new Date()

		// Calculate current streak
		for (const stat of dailyStats) {
			const statDate = stat.date
			const expectedDate = checkDate.toISOString().split('T')[0]

			if (statDate === expectedDate && (stat.cards_studied || 0) > 0) {
				currentStreak++
				checkDate.setDate(checkDate.getDate() - 1)
			} else {
				break
			}
		}

		// Calculate longest streak and totals
		let tempStreak = 0
		for (const stat of dailyStats) {
			if ((stat.cards_studied || 0) > 0) {
				tempStreak++
				longestStreak = Math.max(longestStreak, tempStreak)
			} else {
				tempStreak = 0
			}

			totalCorrect += stat.correct_answers || 0
			totalStudied += stat.cards_studied || 0
			totalStudyTime += stat.session_duration_seconds || 0
		}

		const averageAccuracy = totalStudied > 0 ? (totalCorrect / totalStudied) * 100 : 0

		return {
			totalWords: totalWords || 0,
			wordsLearned: wordsLearned || 0,
			wordsReviewed: wordsReviewed || 0,
			currentStreak,
			longestStreak,
			averageAccuracy,
			totalStudyTime,
		}
	}

	return {
		// Category operations
		getCategories,
		getCategoryById,

		// Word operations
		getWordsByCategory,
		getDueCards,
		getNewCards,

		// Review operations
		getUserReview,
		createReview,
		updateReview,

		// Progress operations
		getCategoryProgress,
		getProgressStats,
	}
}
