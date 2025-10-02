# Requirements Document

## Introduction

The **Vocabulary & Flashcards** feature provides users with an interactive system for learning and practicing Tagalog vocabulary through digital flashcards. It implements a **spaced repetition system (SRS)** to help learners retain words efficiently. User progress is tracked and synced via Supabase so learners can continue seamlessly across devices.

---

## Requirements

### Requirement 1 — Flashcard Study

**User Story:** As a Tagalog learner, I want to study vocabulary using digital flashcards so that I can learn new words and phrases interactively.

#### Acceptance Criteria

1. WHEN a user navigates to the Vocabulary section THEN the system SHALL display available categories (e.g., "Basic Greetings", "Food & Dining", "Family").
2. WHEN a user selects a category THEN the system SHALL present flashcards one at a time.
3. WHEN a flashcard is displayed THEN the system SHALL show the Tagalog word/phrase on the front.
4. WHEN a user taps/clicks the flashcard THEN the system SHALL flip to show the English translation and example sentence.
5. WHEN a user completes viewing a flashcard THEN the system SHALL provide review buttons: **Again, Hard, Good, Easy**.
6. WHEN the user taps a review button THEN the system SHALL update the card’s next review interval using the SRS algorithm.

---

### Requirement 2 — Spaced Repetition Scheduling

**User Story:** As a learner, I want the system to adapt to my learning pace so that I can focus on challenging words.

#### Acceptance Criteria

1. WHEN a user reviews a flashcard THEN the system SHALL record the review outcome (quality score).
2. WHEN calculating next due date THEN the system SHALL use a simplified SM-2 algorithm:
   - **Again → quality=1 (due immediately)**
   - **Hard → quality=3 (shorter interval)**
   - **Good → quality=4 (normal interval)**
   - **Easy → quality=5 (longer interval)**
3. WHEN a user returns to study THEN the system SHALL prioritize cards that are due (current date ≥ `next_due`).
4. IF a card is consistently answered correctly THEN the system SHALL increase its interval length.
5. IF a card is repeatedly missed THEN the system SHALL shorten its interval and increase its lapse counter.

---

### Requirement 3 — Categories & Decks

**User Story:** As a learner, I want vocabulary to be organized by topic so that I can study systematically.

#### Acceptance Criteria

1. WHEN a user accesses the vocabulary section THEN the system SHALL display categories such as "Greetings", "Food", "Family".
2. WHEN a user selects a category THEN the system SHALL show all words/examples in that category.
3. WHEN a user starts a deck THEN the system SHALL show total cards and progress (e.g., “5 of 20 learned”).
4. WHEN a user completes a deck THEN the system SHALL show a summary screen (cards learned, accuracy).

---

### Requirement 4 — Audio Playback

**User Story:** As a learner, I want to hear correct pronunciation so that I can learn proper speaking skills.

#### Acceptance Criteria

1. WHEN a flashcard is shown AND an audio file exists THEN the system SHALL display a play button.
2. WHEN a user taps the play button THEN the system SHALL play the Tagalog word/phrase audio.
3. WHEN audio is playing THEN the system SHALL provide visual feedback (e.g., waveform, progress bar).
4. WHEN no audio file exists THEN the system SHALL show only text without audio controls.
5. IF audio fails to load THEN the system SHALL show an error message and hide the audio button.

---

### Requirement 5 — Difficult Words Review

**User Story:** As a learner, I want to practice my most difficult words so that I can focus extra effort on them.

#### Acceptance Criteria

1. WHEN a user taps “Review Difficult Words” THEN the system SHALL show cards marked “Again” or frequently missed.
2. WHEN practicing difficult words THEN the system SHALL update stats and remove a word from this list after consistent correct answers.
3. WHEN viewing history THEN the system SHALL display recent sessions including accuracy and time spent.

---

### Requirement 6 — Progress Tracking & Sync

**User Story:** As a learner, I want my progress to be saved automatically so that I can continue across devices and offline.

#### Acceptance Criteria

1. WHEN a user completes a review THEN the system SHALL persist progress in Supabase (`reviews`, `stats_daily`).
2. WHEN a user signs in on another device THEN the system SHALL load their saved state and due cards.
3. WHEN a user is offline THEN the system SHALL cache study actions locally (IndexedDB).
4. WHEN the connection is restored THEN the system SHALL sync cached actions with Supabase.
5. IF sync fails THEN the system SHALL show a retry option.
6. WHEN a user logs in via **Google OAuth** THEN the system SHALL associate progress with their Supabase profile.

---
