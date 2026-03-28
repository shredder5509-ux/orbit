import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface Flashcard {
  id: string
  topicId: string
  front: string
  back: string
  difficulty: 'easy' | 'medium' | 'hard'
  timesReviewed: number
  timesCorrect: number
  lastReviewed: string | null
  nextReview: string | null
  tags: string[]
}

export interface FlashcardDeck {
  id: string
  topicId: string
  subjectName: string
  name: string
  cards: Flashcard[]
  createdAt: string
  lastStudied: string | null
}

interface FlashcardState {
  decks: FlashcardDeck[]

  addDeck: (deck: Omit<FlashcardDeck, 'id' | 'createdAt' | 'lastStudied'>) => string
  removeDeck: (deckId: string) => void
  addCardToDeck: (deckId: string, card: Omit<Flashcard, 'id' | 'timesReviewed' | 'timesCorrect' | 'lastReviewed' | 'nextReview'>) => void
  removeCard: (deckId: string, cardId: string) => void
  updateCardReview: (deckId: string, cardId: string, correct: boolean) => void
  markDeckStudied: (deckId: string) => void
  getDecksByTopic: (topicId: string) => FlashcardDeck[]
  getDueCards: () => { deck: FlashcardDeck; card: Flashcard }[]
  getTotalCards: () => number
  getMasteryPercent: (deckId: string) => number
}

export const useFlashcardStore = create<FlashcardState>()(
  persist(
    (set, get) => ({
      decks: [],

      addDeck: (deck) => {
        const id = crypto.randomUUID()
        set((s) => ({
          decks: [{ ...deck, id, createdAt: new Date().toISOString(), lastStudied: null }, ...s.decks],
        }))
        return id
      },

      removeDeck: (deckId) => {
        set((s) => ({ decks: s.decks.filter((d) => d.id !== deckId) }))
      },

      addCardToDeck: (deckId, card) => {
        set((s) => ({
          decks: s.decks.map((d) =>
            d.id === deckId
              ? { ...d, cards: [...d.cards, { ...card, id: crypto.randomUUID(), timesReviewed: 0, timesCorrect: 0, lastReviewed: null, nextReview: null }] }
              : d
          ),
        }))
      },

      removeCard: (deckId, cardId) => {
        set((s) => ({
          decks: s.decks.map((d) =>
            d.id === deckId ? { ...d, cards: d.cards.filter((c) => c.id !== cardId) } : d
          ),
        }))
      },

      updateCardReview: (deckId, cardId, correct) => {
        const now = new Date()
        set((s) => ({
          decks: s.decks.map((d) =>
            d.id === deckId
              ? {
                  ...d,
                  cards: d.cards.map((c) => {
                    if (c.id !== cardId) return c
                    const reviewed = c.timesReviewed + 1
                    const corrected = c.timesCorrect + (correct ? 1 : 0)
                    // Simple spaced repetition: next review in days based on streak
                    const streak = correct ? Math.min(corrected, 5) : 0
                    const nextDate = new Date(now)
                    nextDate.setDate(nextDate.getDate() + (correct ? Math.pow(2, streak) : 1))
                    return {
                      ...c,
                      timesReviewed: reviewed,
                      timesCorrect: corrected,
                      lastReviewed: now.toISOString(),
                      nextReview: nextDate.toISOString().split('T')[0],
                    }
                  }),
                }
              : d
          ),
        }))
      },

      markDeckStudied: (deckId) => {
        set((s) => ({
          decks: s.decks.map((d) =>
            d.id === deckId ? { ...d, lastStudied: new Date().toISOString() } : d
          ),
        }))
      },

      getDecksByTopic: (topicId) => get().decks.filter((d) => d.topicId === topicId),

      getDueCards: () => {
        const today = new Date().toISOString().split('T')[0]
        const due: { deck: FlashcardDeck; card: Flashcard }[] = []
        for (const deck of get().decks) {
          for (const card of deck.cards) {
            if (!card.nextReview || card.nextReview <= today) {
              due.push({ deck, card })
            }
          }
        }
        return due
      },

      getTotalCards: () => get().decks.reduce((sum, d) => sum + d.cards.length, 0),

      getMasteryPercent: (deckId) => {
        const deck = get().decks.find((d) => d.id === deckId)
        if (!deck || deck.cards.length === 0) return 0
        const mastered = deck.cards.filter((c) => c.timesCorrect >= 3 && c.timesReviewed > 0)
        return Math.round((mastered.length / deck.cards.length) * 100)
      },
    }),
    { name: 'orbit-flashcards' }
  )
)
