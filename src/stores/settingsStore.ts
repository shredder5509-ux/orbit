import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Use environment variable as default — set VITE_ANTHROPIC_API_KEY in .env
const DEFAULT_API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY || ''

interface SettingsState {
  apiKey: string
  setApiKey: (key: string) => void
  clearApiKey: () => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      apiKey: DEFAULT_API_KEY,
      setApiKey: (key) => set({ apiKey: key }),
      clearApiKey: () => set({ apiKey: DEFAULT_API_KEY }),
    }),
    { name: 'orbit-settings' }
  )
)
