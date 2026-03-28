import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type TopicStatus = 'untouched' | 'in_progress' | 'mastered' | 'needs_review'

export interface Topic {
  id: string
  name: string
  description: string
  difficulty: number
  estimatedMinutes: number
  status: TopicStatus
}

export interface Subject {
  id: string
  name: string
  colour: string
  topics: Topic[]
  expanded: boolean
}

// Pastel colours for subjects, cycling through
const SUBJECT_COLOURS = [
  '#E8F0FE', // soft blue
  '#E6F7ED', // soft green
  '#FFF8E1', // soft yellow
  '#FDE8EC', // soft pink
  '#F0E6FF', // soft purple
  '#E0F5F2', // soft teal
  '#FFF0E0', // soft orange
  '#FCE4EC', // soft rose
]

interface SubjectState {
  subjects: Subject[]
  isGenerating: boolean
  error: string | null

  setSubjects: (subjects: Subject[]) => void
  toggleExpanded: (subjectId: string) => void
  updateTopicStatus: (subjectId: string, topicId: string, status: TopicStatus) => void
  setGenerating: (generating: boolean) => void
  setError: (error: string | null) => void
  clear: () => void
}

export const useSubjectStore = create<SubjectState>()(
  persist(
    (set) => ({
      subjects: [],
      isGenerating: false,
      error: null,

      setSubjects: (subjects) => set({ subjects, isGenerating: false, error: null }),

      toggleExpanded: (subjectId) =>
        set((state) => ({
          subjects: state.subjects.map((s) =>
            s.id === subjectId ? { ...s, expanded: !s.expanded } : s
          ),
        })),

      updateTopicStatus: (subjectId, topicId, status) =>
        set((state) => ({
          subjects: state.subjects.map((s) =>
            s.id === subjectId
              ? {
                  ...s,
                  topics: s.topics.map((t) =>
                    t.id === topicId ? { ...t, status } : t
                  ),
                }
              : s
          ),
        })),

      setGenerating: (isGenerating) => set({ isGenerating }),
      setError: (error) => set({ error }),
      clear: () => set({ subjects: [], isGenerating: false, error: null }),
    }),
    { name: 'orbit-subjects' }
  )
)

export function getSubjectColour(index: number): string {
  return SUBJECT_COLOURS[index % SUBJECT_COLOURS.length]
}
