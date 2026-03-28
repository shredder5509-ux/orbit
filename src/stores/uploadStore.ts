import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface UploadItem {
  id: string
  type: 'photo' | 'pdf' | 'text' | 'link'
  name: string
  content: string
  status: 'processing' | 'ready' | 'error'
  createdAt: number
  topics?: string[]
}

interface UploadState {
  uploads: UploadItem[]
  addUpload: (upload: Omit<UploadItem, 'id' | 'status' | 'createdAt'>) => void
  removeUpload: (id: string) => void
  updateUpload: (id: string, updates: Partial<UploadItem>) => void
}

export const useUploadStore = create<UploadState>()(
  persist(
    (set) => ({
      uploads: [],

      addUpload: (upload) =>
        set((state) => ({
          uploads: [
            {
              ...upload,
              id: crypto.randomUUID(),
              status: 'processing',
              createdAt: Date.now(),
            },
            ...state.uploads,
          ],
        })),

      removeUpload: (id) =>
        set((state) => ({
          uploads: state.uploads.filter((u) => u.id !== id),
        })),

      updateUpload: (id, updates) =>
        set((state) => ({
          uploads: state.uploads.map((u) =>
            u.id === id ? { ...u, ...updates } : u
          ),
        })),
    }),
    { name: 'orbit-uploads' }
  )
)
