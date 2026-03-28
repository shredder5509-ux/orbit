import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, X, FileText, BookOpen, Layers, StickyNote } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useSubjectStore } from '../stores/subjectStore'
import { useNotesStore } from '../stores/notesStore'
import { useFlashcardStore } from '../stores/flashcardStore'
import { useUploadStore } from '../stores/uploadStore'

interface SearchModalProps {
  open: boolean
  onClose: () => void
}

interface SearchResult {
  type: 'topic' | 'note' | 'flashcard' | 'upload'
  title: string
  subtitle: string
  action: () => void
}

export function SearchModal({ open, onClose }: SearchModalProps) {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const subjects = useSubjectStore((s) => s.subjects)
  const notes = useNotesStore((s) => s.notes)
  const decks = useFlashcardStore((s) => s.decks)
  const uploads = useUploadStore((s) => s.uploads)

  useEffect(() => {
    if (open) {
      setQuery('')
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [open])

  // Keyboard shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        if (open) onClose()
        else if (!open) onClose() // Toggle handled by parent
      }
      if (e.key === 'Escape' && open) onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  const results: SearchResult[] = []
  const q = query.toLowerCase().trim()

  if (q.length >= 2) {
    // Topics
    for (const subject of subjects) {
      for (const topic of subject.topics) {
        if (topic.name.toLowerCase().includes(q) || subject.name.toLowerCase().includes(q)) {
          results.push({
            type: 'topic',
            title: topic.name,
            subtitle: subject.name,
            action: () => { navigate('/'); onClose() },
          })
        }
      }
    }

    // Notes
    for (const note of notes) {
      if (note.title.toLowerCase().includes(q) || note.content.toLowerCase().includes(q)) {
        results.push({
          type: 'note',
          title: note.title,
          subtitle: note.subjectName || 'Quick note',
          action: () => { navigate('/notes'); onClose() },
        })
      }
    }

    // Flashcard decks
    for (const deck of decks) {
      if (deck.name.toLowerCase().includes(q)) {
        results.push({
          type: 'flashcard',
          title: deck.name,
          subtitle: `${deck.cards.length} cards`,
          action: () => { navigate('/flashcards'); onClose() },
        })
      }
    }

    // Uploads
    for (const upload of uploads) {
      if (upload.name.toLowerCase().includes(q)) {
        results.push({
          type: 'upload',
          title: upload.name,
          subtitle: upload.type,
          action: () => { navigate('/upload'); onClose() },
        })
      }
    }
  }

  const typeIcons = {
    topic: Layers,
    note: StickyNote,
    flashcard: BookOpen,
    upload: FileText,
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/15 px-4 pt-20"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            className="bg-white dark:bg-dark-surface border border-border dark:border-dark-border rounded-[var(--radius-xl)] w-full max-w-md shadow-xl shadow-black/10 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Search input */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border/50 dark:border-dark-border/50">
              <Search size={16} className="text-text-muted shrink-0" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search topics, notes, flashcards..."
                className="flex-1 text-sm text-text-primary dark:text-dark-text-primary placeholder:text-text-muted bg-transparent focus:outline-none"
              />
              {query && (
                <button onClick={() => setQuery('')} className="text-text-muted hover:text-text-primary">
                  <X size={14} />
                </button>
              )}
              <kbd className="hidden sm:inline text-[9px] text-text-muted border border-border px-1.5 py-0.5 rounded">Esc</kbd>
            </div>

            {/* Results */}
            <div className="max-h-[300px] overflow-y-auto">
              {q.length < 2 ? (
                <div className="px-4 py-6 text-center text-[12px] text-text-muted">
                  Type at least 2 characters to search
                </div>
              ) : results.length === 0 ? (
                <div className="px-4 py-6 text-center text-[12px] text-text-muted">
                  No results for "{query}"
                </div>
              ) : (
                <div className="py-1">
                  {results.slice(0, 10).map((r, i) => {
                    const Icon = typeIcons[r.type]
                    return (
                      <button
                        key={i}
                        onClick={r.action}
                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-accent-light/50 transition-colors text-left"
                      >
                        <Icon size={14} className="text-text-muted shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] text-text-primary truncate">{r.title}</p>
                          <p className="text-[10px] text-text-muted">{r.subtitle}</p>
                        </div>
                        <span className="text-[8px] text-text-muted uppercase bg-border/30 px-1.5 py-0.5 rounded">{r.type}</span>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
