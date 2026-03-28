import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Search, Trash2, Edit2, X, StickyNote, ChevronLeft } from 'lucide-react'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { PixelScene } from '../components/RetroIllustrations'
import { useNotesStore, type StudyNote } from '../stores/notesStore'

type View = 'list' | 'detail' | 'create'

export function NotesPage() {
  const { notes, addNote, updateNote, removeNote, searchNotes } = useNotesStore()
  const [view, setView] = useState<View>('list')
  const [activeNote, setActiveNote] = useState<StudyNote | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [editTitle, setEditTitle] = useState('')
  const [editContent, setEditContent] = useState('')
  const [isEditing, setIsEditing] = useState(false)

  const filteredNotes = searchQuery ? searchNotes(searchQuery) : notes

  const openNote = (note: StudyNote) => {
    setActiveNote(note)
    setEditTitle(note.title)
    setEditContent(note.content)
    setIsEditing(false)
    setView('detail')
  }

  const startCreate = () => {
    setEditTitle('')
    setEditContent('')
    setActiveNote(null)
    setIsEditing(true)
    setView('create')
  }

  const saveNote = () => {
    if (!editTitle.trim() && !editContent.trim()) return
    const title = editTitle.trim() || `Note — ${new Date().toLocaleDateString()}`
    if (activeNote && view === 'detail') {
      updateNote(activeNote.id, { title, content: editContent })
      setActiveNote({ ...activeNote, title, content: editContent })
    } else {
      addNote({ title, content: editContent, isQuickNote: false })
    }
    setIsEditing(false)
    if (view === 'create') setView('list')
  }

  // Detail view
  if ((view === 'detail' || view === 'create') && (activeNote || view === 'create')) {
    return (
      <div className="max-w-[680px] mx-auto px-6 py-6">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => { setView('list'); setIsEditing(false) }} className="flex items-center gap-1 text-sm text-text-muted hover:text-text-primary transition-colors">
            <ChevronLeft size={16} /> Notes
          </button>
          <div className="flex gap-2">
            {!isEditing && activeNote && (
              <button onClick={() => setIsEditing(true)} className="text-text-muted hover:text-text-primary transition-colors p-1">
                <Edit2 size={14} />
              </button>
            )}
            {isEditing && (
              <Button size="sm" onClick={saveNote}>Save</Button>
            )}
          </div>
        </div>

        {isEditing ? (
          <div className="space-y-3">
            <input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              placeholder="Note title..."
              autoFocus
              className="w-full text-lg font-semibold text-text-primary placeholder:text-text-muted bg-transparent focus:outline-none"
            />
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              placeholder="Write your notes here..."
              rows={16}
              className="w-full text-sm text-text-primary placeholder:text-text-muted bg-transparent focus:outline-none resize-none leading-relaxed"
            />
          </div>
        ) : (
          <div>
            <h1 className="text-lg font-semibold text-text-primary mb-1">{activeNote?.title}</h1>
            {activeNote?.subjectName && (
              <p className="text-[10px] text-text-muted mb-4">{activeNote.subjectName} · {activeNote.topicName}</p>
            )}
            <div className="text-sm text-text-primary leading-relaxed whitespace-pre-wrap">
              {activeNote?.content}
            </div>
          </div>
        )}
      </div>
    )
  }

  // List view
  return (
    <div className="relative max-w-[680px] mx-auto px-6 py-6">
      <PixelScene variant="minimal" />
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-lg font-semibold text-text-primary tracking-tight">Notes</h1>
          <Button variant="pastel" size="sm" onClick={startCreate}>
            <Plus size={12} /> New Note
          </Button>
        </div>

        {/* Search */}
        <div className="flex items-center gap-2 px-3 py-2 border border-border rounded-[var(--radius-md)] mb-4">
          <Search size={14} className="text-text-muted" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notes..."
            className="flex-1 text-sm text-text-primary placeholder:text-text-muted bg-transparent focus:outline-none"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="text-text-muted hover:text-text-primary">
              <X size={12} />
            </button>
          )}
        </div>

        {/* Notes list */}
        {filteredNotes.length === 0 ? (
          <div className="text-center py-10">
            <StickyNote className="mx-auto mb-2 text-text-muted" size={24} />
            <p className="text-sm text-text-muted mb-1">
              {searchQuery ? `No notes matching "${searchQuery}"` : 'No notes yet'}
            </p>
            <p className="text-[11px] text-text-muted">
              {searchQuery ? 'Try a different search' : 'Create notes to help you revise'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredNotes.map((note) => (
              <motion.div
                key={note.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card
                  className="cursor-pointer hover:shadow-sm transition-all group"
                  onClick={() => openNote(note)}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-text-primary truncate">{note.title}</p>
                      <p className="text-[11px] text-text-muted line-clamp-2 leading-relaxed mt-0.5">
                        {note.content.substring(0, 120)}...
                      </p>
                      <p className="text-[9px] text-text-muted mt-1.5">
                        {note.subjectName && `${note.subjectName} · `}
                        {new Date(note.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); removeNote(note.id) }}
                      className="opacity-0 group-hover:opacity-100 text-text-muted hover:text-error transition-all p-1 shrink-0"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
