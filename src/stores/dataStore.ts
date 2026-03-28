import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ReviewSchedule } from '../services/spacedRepetition'
import { createInitialSchedule, calculateNextReview, getTopicsDueForReview } from '../services/spacedRepetition'

// Badge definitions
export const BADGE_DEFS = {
  first_orbit: { name: 'First Orbit', desc: 'Master your first topic', icon: '🌟' },
  solar_system: { name: 'Solar System', desc: 'Master 5 topics in one subject', icon: '☀️' },
  galaxy_brain: { name: 'Galaxy Brain', desc: 'Master 10 topics across any subjects', icon: '🌌' },
  streak_comet: { name: 'Streak Comet', desc: '30-day streak', icon: '☄️' },
  deep_diver: { name: 'Deep Diver', desc: '2+ hours on a single topic', icon: '🤿' },
  comeback_kid: { name: 'Comeback Kid', desc: 'Master a bookmarked topic', icon: '💪' },
  speed_of_light: { name: 'Speed of Light', desc: '3 checkpoints in one day', icon: '⚡' },
  polymath: { name: 'Polymath', desc: 'Master topics in 3+ subjects', icon: '🧠' },
  week_warrior: { name: 'Week Warrior', desc: '7-day streak', icon: '🔥' },
  century: { name: 'Century', desc: '100-day streak', icon: '💯' },
} as const

export type BadgeId = keyof typeof BADGE_DEFS

export interface EarnedBadge {
  id: BadgeId
  earnedAt: string
}

export interface CompletedSession {
  id: string
  topicId: string
  subjectName: string
  topicName: string
  mode: string
  startedAt: string
  endedAt: string
  durationMinutes: number
  xpEarned: number
  checkpointScore?: { correct: number; total: number }
  gradeScore?: number
}

export interface Deadline {
  id: string
  title: string
  subject: string
  dueDate: string
  createdAt: string
}

export interface StudyNote {
  id: string
  topicId: string
  topicName: string
  subjectName: string
  content: string
  createdAt: string
}

interface DataState {
  // Completed sessions history
  completedSessions: CompletedSession[]
  addCompletedSession: (session: CompletedSession) => void

  // Badges
  badges: EarnedBadge[]
  earnBadge: (id: BadgeId) => boolean // returns true if newly earned
  hasBadge: (id: BadgeId) => boolean
  checkAndAwardBadges: () => BadgeId[] // returns newly earned badges

  // Review schedules
  reviewSchedules: ReviewSchedule[]
  addReviewSchedule: (topicId: string) => void
  updateReviewSchedule: (topicId: string, quality: number) => void
  getDueReviews: () => ReviewSchedule[]

  // Deadlines
  deadlines: Deadline[]
  addDeadline: (d: Omit<Deadline, 'id' | 'createdAt'>) => void
  removeDeadline: (id: string) => void

  // Study notes
  notes: StudyNote[]
  addNote: (note: Omit<StudyNote, 'id' | 'createdAt'>) => void
  removeNote: (id: string) => void
  getNotesForTopic: (topicId: string) => StudyNote[]

  // Daily goal tracking
  studyMinutesToday: number
  dailyGoalStreak: number
  lastGoalDate: string
  addStudyMinutes: (mins: number) => void
  checkDailyGoal: (goalMinutes: number) => boolean

  // Topic time tracking
  topicStudyTime: Record<string, number> // topicId → total minutes

  // Schema version for migrations
  _version: number
}

export const useDataStore = create<DataState>()(
  persist(
    (set, get) => ({
      completedSessions: [],
      badges: [],
      reviewSchedules: [],
      deadlines: [],
      notes: [],
      studyMinutesToday: 0,
      dailyGoalStreak: 0,
      lastGoalDate: '',
      topicStudyTime: {},
      _version: 1,

      addCompletedSession: (session) => {
        set((s) => ({
          completedSessions: [session, ...s.completedSessions].slice(0, 200),
        }))
      },

      earnBadge: (id) => {
        if (get().hasBadge(id)) return false
        set((s) => ({
          badges: [...s.badges, { id, earnedAt: new Date().toISOString() }],
        }))
        return true
      },

      hasBadge: (id) => get().badges.some((b) => b.id === id),

      checkAndAwardBadges: () => {
        const state = get()
        const newBadges: BadgeId[] = []
        const sessions = state.completedSessions

        // First Orbit — any mastered topic
        if (sessions.length >= 1 && !state.hasBadge('first_orbit')) {
          if (state.earnBadge('first_orbit')) newBadges.push('first_orbit')
        }

        // Speed of Light — 3 checkpoints in one day
        const today = new Date().toISOString().split('T')[0]
        const todaySessions = sessions.filter((s) => s.endedAt.startsWith(today) && s.checkpointScore)
        if (todaySessions.length >= 3 && !state.hasBadge('speed_of_light')) {
          if (state.earnBadge('speed_of_light')) newBadges.push('speed_of_light')
        }

        // Galaxy Brain — 10 topics mastered
        if (sessions.length >= 10 && !state.hasBadge('galaxy_brain')) {
          if (state.earnBadge('galaxy_brain')) newBadges.push('galaxy_brain')
        }

        // Polymath — sessions in 3+ subjects
        const uniqueSubjects = new Set(sessions.map((s) => s.subjectName))
        if (uniqueSubjects.size >= 3 && !state.hasBadge('polymath')) {
          if (state.earnBadge('polymath')) newBadges.push('polymath')
        }

        // Deep Diver — 2+ hours on a single topic
        const topicTime = state.topicStudyTime
        for (const mins of Object.values(topicTime)) {
          if (mins >= 120 && !state.hasBadge('deep_diver')) {
            if (state.earnBadge('deep_diver')) newBadges.push('deep_diver')
            break
          }
        }

        return newBadges
      },

      addReviewSchedule: (topicId) => {
        const existing = get().reviewSchedules.find((r) => r.topicId === topicId)
        if (existing) return
        set((s) => ({
          reviewSchedules: [...s.reviewSchedules, createInitialSchedule(topicId)],
        }))
      },

      updateReviewSchedule: (topicId, quality) => {
        set((s) => ({
          reviewSchedules: s.reviewSchedules.map((r) =>
            r.topicId === topicId ? calculateNextReview(quality, r) : r
          ),
        }))
      },

      getDueReviews: () => getTopicsDueForReview(get().reviewSchedules),

      addDeadline: (d) => {
        set((s) => ({
          deadlines: [...s.deadlines, { ...d, id: crypto.randomUUID(), createdAt: new Date().toISOString() }],
        }))
      },

      removeDeadline: (id) => {
        set((s) => ({ deadlines: s.deadlines.filter((d) => d.id !== id) }))
      },

      addNote: (note) => {
        set((s) => ({
          notes: [{ ...note, id: crypto.randomUUID(), createdAt: new Date().toISOString() }, ...s.notes],
        }))
      },

      removeNote: (id) => {
        set((s) => ({ notes: s.notes.filter((n) => n.id !== id) }))
      },

      getNotesForTopic: (topicId) => get().notes.filter((n) => n.topicId === topicId),

      addStudyMinutes: (mins) => {
        const today = new Date().toISOString().split('T')[0]
        set((s) => ({
          studyMinutesToday: s.lastGoalDate === today ? s.studyMinutesToday + mins : mins,
          lastGoalDate: today,
        }))
      },

      checkDailyGoal: (goalMinutes) => {
        const today = new Date().toISOString().split('T')[0]
        const s = get()
        if (s.lastGoalDate !== today) return false
        return s.studyMinutesToday >= goalMinutes
      },
    }),
    { name: 'orbit-data' }
  )
)
