import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, X, Check } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { useUserStore } from '../stores/userStore'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface HomeworkItem {
  id: string
  title: string
  subject: string
  dueDate: string
  completed: boolean
  createdAt: string
}

interface HomeworkState {
  items: HomeworkItem[]
  addItem: (item: Omit<HomeworkItem, 'id' | 'completed' | 'createdAt'>) => void
  toggleItem: (id: string) => void
  removeItem: (id: string) => void
}

const useHomeworkStore = create<HomeworkState>()(
  persist(
    (set) => ({
      items: [],
      addItem: (item) => set((s) => ({
        items: [{ ...item, id: crypto.randomUUID(), completed: false, createdAt: new Date().toISOString() }, ...s.items],
      })),
      toggleItem: (id) => set((s) => ({
        items: s.items.map((i) => i.id === id ? { ...i, completed: !i.completed } : i),
      })),
      removeItem: (id) => set((s) => ({
        items: s.items.filter((i) => i.id !== id),
      })),
    }),
    { name: 'orbit-homework' }
  )
)

export function HomeworkTrackerPage() {
  const navigate = useNavigate()
  const { addXp } = useUserStore()
  const { items, addItem, toggleItem, removeItem } = useHomeworkStore()
  const [showAdd, setShowAdd] = useState(false)
  const [title, setTitle] = useState('')
  const [subject, setSubject] = useState('')
  const [dueDate, setDueDate] = useState('')

  const today = new Date().toISOString().split('T')[0]
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0]
  const weekEnd = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]

  const overdue = items.filter((i) => !i.completed && i.dueDate < today)
  const dueTomorrow = items.filter((i) => !i.completed && (i.dueDate === today || i.dueDate === tomorrow))
  const thisWeek = items.filter((i) => !i.completed && i.dueDate > tomorrow && i.dueDate <= weekEnd)
  const later = items.filter((i) => !i.completed && i.dueDate > weekEnd)
  const done = items.filter((i) => i.completed).slice(0, 10)

  const handleAdd = () => {
    if (!title.trim() || !dueDate) return
    addItem({ title: title.trim(), subject: subject.trim(), dueDate })
    setTitle(''); setSubject(''); setDueDate('')
    setShowAdd(false)
  }

  const handleToggle = (id: string, wasCompleted: boolean) => {
    toggleItem(id)
    if (!wasCompleted) addXp(5)
  }

  const renderGroup = (label: string, groupItems: HomeworkItem[], urgent = false) => {
    if (groupItems.length === 0) return null
    return (
      <div className="mb-5">
        <p className={`text-[10px] uppercase tracking-wide mb-2 ${urgent ? 'text-error font-medium' : 'text-text-muted'}`}>{label}</p>
        <div className="space-y-1">
          {groupItems.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2.5 py-2 px-1 group"
            >
              <button
                onClick={() => handleToggle(item.id, item.completed)}
                className={`w-4 h-4 rounded border shrink-0 flex items-center justify-center transition-colors ${
                  item.completed ? 'bg-text-primary border-text-primary' : 'border-border hover:border-text-muted'
                }`}
              >
                {item.completed && <Check size={10} className="text-white" />}
              </button>
              <div className="flex-1 min-w-0">
                <p className={`text-[13px] ${item.completed ? 'line-through text-text-muted' : 'text-text-primary'}`}>
                  {item.title}
                </p>
                {item.subject && <p className="text-[10px] text-text-muted">{item.subject}</p>}
              </div>
              {!item.completed && item.dueDate && (
                <span className={`text-[10px] shrink-0 ${
                  item.dueDate <= today ? 'text-error' : item.dueDate <= tomorrow ? 'text-warning' : 'text-text-muted'
                }`}>
                  {item.dueDate === today ? 'Today' : item.dueDate === tomorrow ? 'Tomorrow' : new Date(item.dueDate).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
                </span>
              )}
              {item.completed && <span className="text-[10px] text-text-muted">done</span>}
              <button onClick={() => removeItem(item.id)} className="opacity-0 group-hover:opacity-100 text-text-muted hover:text-error transition-all p-0.5">
                <X size={10} />
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-[680px] mx-auto px-6 py-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate(-1)} className="text-text-muted hover:text-text-primary">
            <ArrowLeft size={16} />
          </button>
          <h1 className="text-base font-semibold text-text-primary">Homework</h1>
        </div>
        <Button variant="secondary" size="sm" onClick={() => setShowAdd(true)}>
          <Plus size={12} /> Add
        </Button>
      </div>

      {items.filter((i) => !i.completed).length === 0 && (
        <div className="text-center py-12 text-[13px] text-text-muted">
          Nothing due. Enjoy the break!
        </div>
      )}

      {renderGroup('OVERDUE', overdue, true)}
      {renderGroup('DUE SOON', dueTomorrow)}
      {renderGroup('THIS WEEK', thisWeek)}
      {renderGroup('LATER', later)}
      {renderGroup('COMPLETED', done)}

      {/* Add modal */}
      <AnimatePresence>
        {showAdd && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/15 px-6"
            onClick={() => setShowAdd(false)}
          >
            <motion.div
              initial={{ y: 10 }} animate={{ y: 0 }} exit={{ y: 10 }}
              className="bg-white border border-border rounded-[var(--radius-xl)] p-5 w-full max-w-sm shadow-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[13px] font-semibold text-text-primary">Add homework</h3>
                <button onClick={() => setShowAdd(false)} className="text-text-muted hover:text-text-primary p-1"><X size={14} /></button>
              </div>
              <div className="space-y-3">
                <Input label="What's due?" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Maths worksheet pg 34" autoFocus />
                <Input label="Subject (optional)" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g. Maths" />
                <Input label="Due date" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="secondary" size="sm" onClick={() => setShowAdd(false)}>Cancel</Button>
                <Button size="sm" disabled={!title.trim() || !dueDate} onClick={handleAdd}>Add</Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
