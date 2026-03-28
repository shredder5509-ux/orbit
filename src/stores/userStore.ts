import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Curriculum = 'gcse' | 'igcse' | 'a-level' | 'ib' | 'us-middle' | 'us-high' | 'custom'

export const CURRICULUM_LABELS: Record<Curriculum, string> = {
  'gcse': 'UK GCSE',
  'igcse': 'IGCSE (Cambridge International)',
  'a-level': 'UK A-Level',
  'ib': 'IB (International Baccalaureate)',
  'us-middle': 'US Middle School',
  'us-high': 'US High School',
  'custom': 'Custom / Other',
}

export const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] as const
export const PERIODS = [1, 2, 3, 4, 5, 6] as const

export type Timetable = Record<string, string[]>

function emptyTimetable(): Timetable {
  const t: Timetable = {}
  for (const day of DAYS) {
    t[day] = Array(PERIODS.length).fill('')
  }
  return t
}

function extractSubjects(timetable: Timetable): string[] {
  const set = new Set<string>()
  for (const day of DAYS) {
    for (const subject of (timetable[day] || [])) {
      const trimmed = subject.trim()
      if (trimmed) set.add(trimmed)
    }
  }
  return Array.from(set).sort()
}

interface UserState {
  userId: string
  displayName: string
  age: number
  school: string
  curriculum: Curriculum
  timetable: Timetable
  subjects: string[]
  tutorName: string
  tutorAvatarId: string
  dailyGoalMinutes: number
  onboardingComplete: boolean
  xp: number
  level: number
  currentStreak: number
  longestStreak: number
  lastActivityDate: string | null
  freezeAvailable: boolean

  setDisplayName: (name: string) => void
  setAge: (age: number) => void
  setSchool: (school: string) => void
  setCurriculum: (curriculum: Curriculum) => void
  setTimetable: (timetable: Timetable) => void
  setTimetableCell: (day: string, period: number, value: string) => void
  setTutorName: (name: string) => void
  setTutorAvatarId: (id: string) => void
  setDailyGoalMinutes: (minutes: number) => void
  completeOnboarding: () => void
  addXp: (amount: number) => void
}

const LEVEL_THRESHOLDS = [0, 200, 500, 1000, 2000, 3500, 5500, 8000, 12000, 18000]
const LEVEL_NAMES = [
  'Stardust', 'Moonwalker', 'Stargazer', 'Orbiter', 'Astronaut',
  'Pilot', 'Navigator', 'Explorer', 'Voyager', 'Cosmic Scholar',
]

function calculateLevel(xp: number): number {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_THRESHOLDS[i]) return i + 1
  }
  return 1
}

export function getLevelName(level: number): string {
  return LEVEL_NAMES[Math.min(level - 1, LEVEL_NAMES.length - 1)]
}

export function getXpForNextLevel(level: number): number {
  if (level >= LEVEL_THRESHOLDS.length) return Infinity
  return LEVEL_THRESHOLDS[level]
}

export function getXpForCurrentLevel(level: number): number {
  return LEVEL_THRESHOLDS[Math.max(0, level - 1)]
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      userId: '',
      displayName: '',
      age: 13,
      school: '',
      curriculum: 'gcse' as Curriculum,
      timetable: emptyTimetable(),
      subjects: [],
      tutorName: 'Nova',
      tutorAvatarId: 'lavender',
      dailyGoalMinutes: 30,
      onboardingComplete: false,
      xp: 0,
      level: 1,
      currentStreak: 0,
      longestStreak: 0,
      lastActivityDate: null,
      freezeAvailable: true,

      setDisplayName: (name) => set({ displayName: name }),
      setAge: (age) => set({ age }),
      setSchool: (school) => set({ school }),
      setCurriculum: (curriculum) => set({ curriculum }),
      setTimetable: (timetable) => set({ timetable, subjects: extractSubjects(timetable) }),
      setTimetableCell: (day, period, value) =>
        set((state) => {
          const newTimetable = { ...state.timetable }
          const daySlots = [...(newTimetable[day] || Array(PERIODS.length).fill(''))]
          daySlots[period] = value
          newTimetable[day] = daySlots
          return { timetable: newTimetable, subjects: extractSubjects(newTimetable) }
        }),
      setTutorName: (name) => set({ tutorName: name }),
      setTutorAvatarId: (id) => set({ tutorAvatarId: id }),
      setDailyGoalMinutes: (minutes) => set({ dailyGoalMinutes: minutes }),
      completeOnboarding: () => set({ onboardingComplete: true }),
      addXp: (amount) =>
        set((state) => {
          const newXp = state.xp + amount
          const today = new Date().toISOString().split('T')[0]
          const lastDate = state.lastActivityDate
          let streak = state.currentStreak
          let longest = state.longestStreak

          // Update streak
          if (lastDate !== today) {
            if (lastDate) {
              const yesterday = new Date()
              yesterday.setDate(yesterday.getDate() - 1)
              const isYesterday = lastDate === yesterday.toISOString().split('T')[0]
              streak = isYesterday ? streak + 1 : 1
            } else {
              streak = 1
            }
            longest = Math.max(longest, streak)
          }

          return {
            xp: newXp,
            level: calculateLevel(newXp),
            currentStreak: streak,
            longestStreak: longest,
            lastActivityDate: today,
          }
        }),
    }),
    { name: 'orbit-user' }
  )
)
