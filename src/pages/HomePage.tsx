import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, ChevronDown, ChevronRight, Clock, Loader2, BookOpen, ArrowRight, X, FileText, ClipboardList, Target, Focus, Layers, StickyNote, GraduationCap, Zap, PenTool, Calculator, CheckSquare, Quote, MessageSquare, GitCompare, Brain, Globe, Beaker, Briefcase, Camera, ShoppingBag, Users as UsersIcon, Swords, Timer, Map, Heart, FileBarChart, Archive, Castle, Play, AlertCircle, HelpCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { RetroPlanet } from '../components/RetroPlanet'
import { PixelScene, PixelSword, PixelShield, PixelScroll } from '../components/RetroIllustrations'
import { useUserStore } from '../stores/userStore'
import { useSubjectStore, getSubjectColour } from '../stores/subjectStore'
import { useSettingsStore } from '../stores/settingsStore'
import { useUploadStore } from '../stores/uploadStore'
import { generateSubjectTopics } from '../services/claudeApi'
import type { SessionMode } from '../stores/sessionStore'
import { useThemeStore } from '../stores/themeStore'
import { GuidedTour } from '../components/GuidedTour'
import { BrainBreak } from '../components/BrainBreak'

interface ModePickerProps {
  subjectName: string
  topicName: string
  topicDescription: string
  onSelect: (mode: SessionMode) => void
  onClose: () => void
}

const modeConfig: { mode: SessionMode; icon: typeof FileText; label: string; desc: string; pastel: string }[] = [
  { mode: 'homework', icon: FileText, label: 'Homework', desc: 'Learn step by step', pastel: '#E8F0FE' },
  { mode: 'test', icon: ClipboardList, label: 'Test Revision', desc: 'Quick exam review', pastel: '#FFF8E1' },
  { mode: 'project', icon: Target, label: 'Project', desc: 'Work through a project', pastel: '#E6F7ED' },
]

function ModePicker({ subjectName, topicName, topicDescription, onSelect, onClose }: ModePickerProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/15 px-4 pb-4 sm:items-center sm:pb-0"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="bg-white dark:bg-dark-surface border border-border dark:border-dark-border rounded-[var(--radius-xl)] p-5 w-full max-w-sm shadow-lg shadow-black/5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-sm font-semibold text-text-primary dark:text-dark-text-primary">{topicName}</h3>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary transition-colors p-1">
            <X size={14} />
          </button>
        </div>
        <p className="text-[11px] text-text-muted mb-4">{subjectName}</p>

        <div className="space-y-2">
          {modeConfig.map(({ mode, icon: Icon, label, desc, pastel }) => (
            <motion.button
              key={mode}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelect(mode)}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-[var(--radius-md)] transition-all text-left group"
              style={{ backgroundColor: pastel + '60' }}
            >
              <div className="w-8 h-8 rounded-[var(--radius-sm)] flex items-center justify-center" style={{ backgroundColor: pastel }}>
                <Icon size={14} className="text-text-primary" strokeWidth={1.5} />
              </div>
              <div className="flex-1">
                <p className="text-[13px] text-text-primary dark:text-dark-text-primary font-medium">{label}</p>
                <p className="text-[10px] text-text-muted">{desc}</p>
              </div>
              <ArrowRight size={12} className="text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
            </motion.button>
          ))}
        </div>
      </motion.div>
    </motion.div>
  )
}

export function HomePage() {
  const navigate = useNavigate()
  const { tutorName, subjects: userSubjects, curriculum, age } = useUserStore()
  const { apiKey } = useSettingsStore()
  const { subjects, isGenerating, error, setSubjects, setGenerating, setError } = useSubjectStore()
  const { addUpload } = useUploadStore()
  const isDark = useThemeStore((s) => s.resolved === 'dark')
  const [picker, setPicker] = useState<{ subjectName: string; topicName: string; topicDescription: string } | null>(null)
  const [brainBreakOpen, setBrainBreakOpen] = useState(false)

  useEffect(() => {
    if (userSubjects.length > 0 && subjects.length === 0 && !isGenerating && apiKey) {
      setGenerating(true)
      generateSubjectTopics(apiKey, curriculum, age, userSubjects)
        .then(setSubjects)
        .catch((err) => { setError(err.message); setGenerating(false) })
    }
  }, [userSubjects, subjects.length, isGenerating, apiKey, curriculum, age, setSubjects, setGenerating, setError])

  const handleTopicClick = (subjectName: string, topicName: string, topicDescription: string) => {
    setPicker({ subjectName, topicName, topicDescription })
  }

  const handleModeSelect = (mode: SessionMode) => {
    if (!picker) return
    const content = `Subject: ${picker.subjectName}\nTopic: ${picker.topicName}\n\n${picker.topicDescription}`
    addUpload({ type: 'text', name: `${picker.subjectName} — ${picker.topicName}`, content })
    const store = useUploadStore.getState()
    const latest = store.uploads[0]
    setPicker(null)
    if (latest) navigate(`/session/${latest.id}?mode=${mode}`)
  }

  // Loading
  if (isGenerating) {
    return (
      <div className="relative max-w-[680px] mx-auto px-6 py-16 text-center">
        <PixelScene variant="minimal" />
        <div className="relative z-10">
          <RetroPlanet size="sm" />
          <div className="mt-4">
            <Loader2 className="mx-auto mb-2 animate-spin text-text-muted" size={20} />
            <p className="text-sm text-text-secondary">{tutorName} is building your world...</p>
          </div>
        </div>
      </div>
    )
  }

  // Empty state
  if (userSubjects.length === 0) {
    return (
      <div className="relative max-w-[680px] mx-auto px-6 pt-8 pb-16">
        <PixelScene />
        <div className="text-center relative z-10 pt-8">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="flex justify-center mb-6"
          >
            <RetroPlanet size="lg" />
          </motion.div>
          <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.4 }}
          >
            <h2 className="text-lg font-semibold text-text-primary dark:text-dark-text-primary mb-1.5">
              Your Orbit is empty
            </h2>
            <p className="text-[13px] text-text-muted dark:text-dark-text-secondary mb-6 max-w-[260px] mx-auto leading-relaxed">
              Set up your timetable to get personalised revision topics, or upload homework directly.
            </p>
            <div className="flex gap-3 justify-center">
              <Button onClick={() => navigate('/timetable')} size="lg">
                Set Up Timetable
              </Button>
              <Button variant="pastel" onClick={() => navigate('/upload')} size="lg">
                Upload Homework
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    )
  }

  // Subject tree
  return (
    <div className="relative max-w-[680px] mx-auto px-6 py-5">
      <PixelScene variant="minimal" />
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-lg font-semibold text-text-primary dark:text-dark-text-primary tracking-tight">
            Your Subjects
          </h1>
          <Button variant="pastel" size="sm" onClick={() => navigate('/upload')}>
            <Plus size={12} />
            Upload
          </Button>
        </div>

        {error && (
          <Card className="mb-4 text-center" pastel="#FDE8EC">
            <p className="text-xs text-text-primary mb-2">{error}</p>
            <Button variant="secondary" size="sm" onClick={() => {
              setGenerating(true); setError(null)
              generateSubjectTopics(apiKey, curriculum, age, userSubjects)
                .then(setSubjects)
                .catch((e: any) => { setError(e.message); setGenerating(false) })
            }}>
              Try Again
            </Button>
          </Card>
        )}

        {/* Subject cards */}
        <div className="space-y-2.5">
          {subjects.map((subject, idx) => {
            const masteredCount = subject.topics.filter((t) => t.status === 'mastered').length
            const totalCount = subject.topics.length
            const colour = subject.colour || getSubjectColour(idx)

            return (
              <motion.div
                key={subject.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04 }}
              >
                <button
                  onClick={() => useSubjectStore.getState().toggleExpanded(subject.id)}
                  className="w-full flex items-center gap-3 px-3.5 py-3 rounded-[var(--radius-lg)] transition-all text-left hover:shadow-sm"
                  style={{ backgroundColor: colour + '70' }}
                >
                  <div
                    className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm"
                    style={{ backgroundColor: colour }}
                  />
                  <span className="flex-1 text-[13px] font-medium text-text-primary dark:text-dark-text-primary">
                    {subject.name}
                  </span>
                  <span className="text-[10px] text-text-muted mr-1 bg-white/60 dark:bg-dark-bg/40 px-1.5 py-0.5 rounded-full">
                    {masteredCount}/{totalCount}
                  </span>
                  {subject.expanded
                    ? <ChevronDown size={14} className="text-text-muted" />
                    : <ChevronRight size={14} className="text-text-muted" />
                  }
                </button>

                <AnimatePresence>
                  {subject.expanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="pl-5 pr-1 py-1.5 space-y-0.5">
                        {subject.topics.map((topic, tIdx) => (
                          <motion.button
                            key={topic.id}
                            initial={{ opacity: 0, x: -4 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: tIdx * 0.03 }}
                            onClick={() => handleTopicClick(subject.name, topic.name, topic.description)}
                            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-[var(--radius-md)] hover:bg-white/80 dark:hover:bg-dark-border/50 transition-all text-left group"
                          >
                            <div
                              className={`w-2 h-2 rounded-full shrink-0 transition-colors ${
                                topic.status === 'mastered' ? 'bg-success'
                                  : topic.status === 'in_progress' ? 'bg-text-primary dark:bg-dark-text-primary'
                                  : 'bg-border dark:bg-dark-border'
                              }`}
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-[13px] text-text-primary dark:text-dark-text-primary truncate">{topic.name}</p>
                              <p className="text-[10px] text-text-muted truncate leading-relaxed">{topic.description}</p>
                            </div>
                            <span className="text-[10px] text-text-muted flex items-center gap-0.5 shrink-0">
                              <Clock size={8} />{topic.estimatedMinutes}m
                            </span>
                            <ArrowRight size={10} className="text-text-muted opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                          </motion.button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}
        </div>

        {/* Quick actions */}
        <div className="mt-6 mb-4">
          <p className="text-[10px] text-text-muted uppercase tracking-wide mb-2">Quick Actions</p>
          <div className="grid grid-cols-4 gap-2">
            {[
              { icon: Zap, label: '5 min', to: '/quick-teach', pastel: '#FFF8E1' },
              { icon: PenTool, label: 'Essay', to: '/essay', pastel: '#F0E6FF' },
              { icon: Calculator, label: 'Maths', to: '/math-solver', pastel: '#EBF3FF' },
              { icon: CheckSquare, label: 'Homework', to: '/homework', pastel: '#E8FAF0' },
              { icon: Focus, label: 'Focus', to: '/focus', pastel: '#FFECF0' },
              { icon: GraduationCap, label: 'Exam', to: '/exam', pastel: '#FDE8EC' },
              { icon: Quote, label: 'Cite', to: '/citations', pastel: '#FFF3E8' },
              { icon: Layers, label: 'Grades', to: '/grades', pastel: '#E6F7ED' },
            ].map(({ icon: Icon, label, to, pastel }) => {
              return (
                <button
                  key={to}
                  onClick={() => navigate(to)}
                  className="flex flex-col items-center gap-1 py-2.5 rounded-[var(--radius-md)] transition-all hover:shadow-sm"
                  style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : pastel + '50' }}
                >
                  <div
                    className="w-7 h-7 rounded-[var(--radius-sm)] flex items-center justify-center"
                    style={{ backgroundColor: isDark ? pastel + '90' : pastel }}
                  >
                    <Icon size={13} className="text-text-primary dark:text-dark-text-primary" strokeWidth={1.5} />
                  </div>
                  <span className="text-[9px] text-text-primary dark:text-dark-text-primary font-medium">{label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* More tools */}
        <div className="mb-4">
          <p className="text-[10px] text-text-muted uppercase tracking-wide mb-2">More Tools</p>
          <div className="grid grid-cols-4 gap-2">
            {[
              { icon: MessageSquare, label: 'Debate', to: '/debate', pastel: '#FFE8EC' },
              { icon: GitCompare, label: 'Compare', to: '/compare', pastel: '#E8F0FE' },
              { icon: FileText, label: 'Worksheet', to: '/worksheet', pastel: '#FFF3E8' },
              { icon: BookOpen, label: 'Reading', to: '/reading', pastel: '#E6F7ED' },
              { icon: Target, label: 'Technique', to: '/exam-technique', pastel: '#FDE8EC' },
              { icon: Beaker, label: 'Science', to: '/science', pastel: '#E8FAF0' },
              { icon: Globe, label: 'Verbs', to: '/conjugation', pastel: '#F0E6FF' },
              { icon: Briefcase, label: 'Careers', to: '/careers', pastel: '#FFF8E1' },
              { icon: Camera, label: 'Scan', to: '/scan-notes', pastel: '#EBF3FF' },
              { icon: StickyNote, label: 'Spec', to: '/curriculum', pastel: '#FFECF0' },
              { icon: ShoppingBag, label: 'Shop', to: '/shop', pastel: '#FFF3E8' },
              { icon: UsersIcon, label: 'Friends', to: '/friends', pastel: '#E8F0FE' },
              { icon: Swords, label: 'Battle', to: '/battle', pastel: '#FFE8EC' },
              { icon: Zap, label: 'Speed', to: '/speed', pastel: '#FFF8E1' },
              { icon: UsersIcon, label: 'Room', to: '/study-room', pastel: '#E8FAF0' },
              { icon: Map, label: 'Map', to: '/mind-map', pastel: '#F0E6FF' },
              { icon: Heart, label: 'Anxiety', to: '/anxiety', pastel: '#FFECF0' },
              { icon: AlertCircle, label: 'Mistakes', to: '/mistakes', pastel: '#FDE8EC' },
              { icon: Archive, label: 'Vault', to: '/exam-vault', pastel: '#EBF3FF' },
              { icon: Castle, label: 'Palace', to: '/memory-palace', pastel: '#F0E6FF' },
              { icon: Play, label: 'Exam Sim', to: '/exam-sim', pastel: '#FFF3E8' },
              { icon: FileBarChart, label: 'Report', to: '/parent-report', pastel: '#E6F7ED' },
            ].map(({ icon: Icon, label, to, pastel }) => (
              <button
                key={to}
                onClick={() => navigate(to)}
                className="flex flex-col items-center gap-1 py-2.5 rounded-[var(--radius-md)] transition-all hover:shadow-sm"
                style={{ backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : pastel + '50' }}
              >
                <div
                  className="w-7 h-7 rounded-[var(--radius-sm)] flex items-center justify-center"
                  style={{ backgroundColor: isDark ? pastel + '90' : pastel }}
                >
                  <Icon size={13} className="text-text-primary dark:text-dark-text-primary" strokeWidth={1.5} />
                </div>
                <span className="text-[9px] text-text-primary dark:text-dark-text-primary font-medium">{label}</span>
              </button>
            ))}
          </div>
          {/* Brain break + Recap row */}
          <div className="flex gap-2 mt-2">
            <button onClick={() => setBrainBreakOpen(true)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-[var(--radius-md)] border border-border/50 dark:border-white/10 hover:bg-accent-light/20 dark:hover:bg-white/5 transition-all">
              <Brain size={12} className="text-text-muted" />
              <span className="text-[10px] text-text-primary dark:text-dark-text-primary font-medium">Brain Break</span>
            </button>
            <button onClick={() => navigate('/recap')}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-[var(--radius-md)] border border-border/50 dark:border-white/10 hover:bg-accent-light/20 dark:hover:bg-white/5 transition-all">
              <Clock size={12} className="text-text-muted" />
              <span className="text-[10px] text-text-primary dark:text-dark-text-primary font-medium">Daily Recap</span>
            </button>
          </div>
        </div>

        {/* Tutor card */}
        <Card pastel="#E8F0FE50">
          <div className="flex items-start gap-3">
            <BookOpen size={16} className="text-text-muted mt-0.5 shrink-0" />
            <div>
              <p className="text-[11px] text-text-muted mb-0.5">{tutorName} says</p>
              <p className="text-[13px] text-text-primary dark:text-dark-text-primary leading-relaxed">
                Tap any topic — pick homework, test revision, or project mode.
              </p>
            </div>
          </div>
        </Card>
      </div>

      <GuidedTour />
      <BrainBreak open={brainBreakOpen} onClose={() => setBrainBreakOpen(false)} />

      <AnimatePresence>
        {picker && (
          <ModePicker
            subjectName={picker.subjectName}
            topicName={picker.topicName}
            topicDescription={picker.topicDescription}
            onSelect={handleModeSelect}
            onClose={() => setPicker(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
