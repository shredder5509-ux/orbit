import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface StudyNote {
  id: string
  topicId?: string
  topicName?: string
  subjectName?: string
  title: string
  content: string
  isQuickNote: boolean
  createdAt: string
  updatedAt: string
}

interface NotesState {
  notes: StudyNote[]

  addNote: (note: Omit<StudyNote, 'id' | 'createdAt' | 'updatedAt'>) => string
  updateNote: (id: string, updates: Partial<Pick<StudyNote, 'title' | 'content'>>) => void
  removeNote: (id: string) => void
  getNotesForTopic: (topicId: string) => StudyNote[]
  getQuickNotes: () => StudyNote[]
  searchNotes: (query: string) => StudyNote[]
}

export const useNotesStore = create<NotesState>()(
  persist(
    (set, get) => ({
      notes: [],

      addNote: (note) => {
        const id = crypto.randomUUID()
        const now = new Date().toISOString()
        set((s) => ({
          notes: [{ ...note, id, createdAt: now, updatedAt: now }, ...s.notes],
        }))
        return id
      },

      updateNote: (id, updates) => {
        set((s) => ({
          notes: s.notes.map((n) =>
            n.id === id ? { ...n, ...updates, updatedAt: new Date().toISOString() } : n
          ),
        }))
      },

      removeNote: (id) => {
        set((s) => ({ notes: s.notes.filter((n) => n.id !== id) }))
      },

      getNotesForTopic: (topicId) => get().notes.filter((n) => n.topicId === topicId),

      getQuickNotes: () => get().notes.filter((n) => n.isQuickNote),

      searchNotes: (query) => {
        const q = query.toLowerCase()
        return get().notes.filter(
          (n) =>
            n.title.toLowerCase().includes(q) ||
            n.content.toLowerCase().includes(q) ||
            n.topicName?.toLowerCase().includes(q) ||
            n.subjectName?.toLowerCase().includes(q)
        )
      },
    }),
    { name: 'orbit-notes' }
  )
)
