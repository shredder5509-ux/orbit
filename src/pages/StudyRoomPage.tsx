import { useState, useEffect, useRef } from 'react'
import { ArrowLeft, Users } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useUserStore } from '../stores/userStore'
import { Avatar, getAvatarIds } from '../components/ui/Avatar'

const FIRST_NAMES = [
  'Alex', 'Sam', 'Jordan', 'Riley', 'Taylor', 'Quinn', 'Morgan', 'Casey',
  'Avery', 'Drew', 'Jamie', 'Skyler', 'Reese', 'Finley', 'Rowan', 'Harper',
  'Sage', 'River', 'Dakota', 'Emery', 'Kit', 'Arden', 'Blair', 'Charlie',
  'Eden', 'Frankie', 'Grey', 'Haven', 'Indigo', 'Jules', 'Kai', 'Lane',
  'Marley', 'Nico', 'Oakley', 'Parker', 'Phoenix', 'Rain', 'Shay', 'Tatum',
  'Val', 'Winter', 'Wren', 'Zion', 'Atlas', 'Briar', 'Cypress', 'Ellis',
]

const STUDY_STATUSES = [
  'Studying maths', 'Revising biology', 'Practising French', 'Reading history',
  'Doing chemistry', 'Writing an essay', 'Learning physics', 'Studying English',
  'Practising Spanish', 'Revising geography', 'Doing homework', 'Making flashcards',
  'Taking notes', 'Reviewing mistakes', 'Speed round', 'Focus mode',
]

function generateStudents(count: number, seed: number) {
  const avatarIds = getAvatarIds()
  const students: { name: string; avatarId: string; status: string; minutes: number }[] = []
  let rng = seed
  const nextRng = () => { rng = (rng * 16807 + 0) % 2147483647; return rng / 2147483647 }

  for (let i = 0; i < count; i++) {
    students.push({
      name: FIRST_NAMES[Math.floor(nextRng() * FIRST_NAMES.length)],
      avatarId: avatarIds[Math.floor(nextRng() * avatarIds.length)],
      status: STUDY_STATUSES[Math.floor(nextRng() * STUDY_STATUSES.length)],
      minutes: Math.floor(nextRng() * 90) + 5,
    })
  }
  return students
}

function getStudentCount(): number {
  const hour = new Date().getHours()
  if (hour >= 6 && hour < 9) return Math.floor(Math.random() * 10) + 15
  if (hour >= 9 && hour < 15) return Math.floor(Math.random() * 15) + 20
  if (hour >= 15 && hour < 20) return Math.floor(Math.random() * 20) + 30
  if (hour >= 20 && hour < 23) return Math.floor(Math.random() * 15) + 25
  return Math.floor(Math.random() * 8) + 8
}

export function StudyRoomPage() {
  const navigate = useNavigate()
  const { displayName, tutorAvatarId, addXp } = useUserStore()
  const [elapsed, setElapsed] = useState(0)
  const [studentCount, setStudentCount] = useState(getStudentCount)
  const [students, setStudents] = useState(() => generateStudents(studentCount, Date.now()))
  const [xpToday, setXpToday] = useState(0)
  const minuteRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Timer + XP every minute (capped 60/day)
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed((e) => e + 1)
    }, 1000)

    minuteRef.current = setInterval(() => {
      if (xpToday < 60) {
        addXp(1)
        setXpToday((x) => x + 1)
      }
    }, 60000)

    return () => {
      clearInterval(interval)
      if (minuteRef.current) clearInterval(minuteRef.current)
    }
  }, [addXp, xpToday])

  // Refresh students every 30s
  useEffect(() => {
    const interval = setInterval(() => {
      const count = getStudentCount()
      setStudentCount(count)
      setStudents(generateStudents(count, Date.now()))
    }, 30000)
    return () => clearInterval(interval)
  }, [])

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  return (
    <div className="p-4 pb-24 max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="text-text-muted">
          <ArrowLeft size={18} strokeWidth={1.5} />
        </button>
        <h1 className="text-lg font-medium text-text-primary dark:text-dark-text-primary">Study Room</h1>
      </div>

      <div className="text-center mb-6">
        <div className="flex items-center justify-center gap-1.5 mb-2">
          <Users size={14} strokeWidth={1.5} className="text-text-muted" />
          <span className="text-sm text-text-muted">{studentCount + 1} students studying right now</span>
        </div>
        <p className="text-3xl font-light text-text-primary dark:text-dark-text-primary">
          {formatTime(elapsed)}
        </p>
        <p className="text-xs text-text-muted mt-1">
          +{xpToday} XP earned{xpToday >= 60 ? ' (daily cap reached)' : ''}
        </p>
      </div>

      {/* Your avatar */}
      <div className="flex items-center gap-3 px-3 py-2.5 border border-text-primary dark:border-dark-text-primary rounded-[var(--radius-md)] mb-4">
        <Avatar avatarId={tutorAvatarId} size="sm" />
        <div className="flex-1">
          <p className="text-sm font-medium text-text-primary dark:text-dark-text-primary">{displayName}</p>
          <p className="text-xs text-text-muted">Studying · {formatTime(elapsed)}</p>
        </div>
      </div>

      {/* Other students */}
      <div className="space-y-0.5">
        {students.map((s, i) => (
          <div key={i} className="flex items-center gap-3 px-3 py-2">
            <Avatar avatarId={s.avatarId} size="sm" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-text-primary dark:text-dark-text-primary truncate">{s.name}</p>
              <p className="text-[10px] text-text-muted truncate">{s.status} · {s.minutes} min</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
