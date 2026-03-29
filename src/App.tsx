import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppLayout } from './components/layout/AppLayout'
import { HomePage } from './pages/HomePage'
import { UploadPage } from './pages/UploadPage'
import { ProgressPage } from './pages/ProgressPage'
import { PlannerPage } from './pages/PlannerPage'
import { SettingsPage } from './pages/SettingsPage'
import { TimetablePage } from './pages/TimetablePage'
import { StudySessionPage } from './pages/StudySessionPage'
import { OnboardingPage } from './pages/OnboardingPage'
import { FlashcardsPage } from './pages/FlashcardsPage'
import { NotesPage } from './pages/NotesPage'
import { FocusModePage } from './pages/FocusModePage'
import { StuckPage } from './pages/StuckPage'
import { PracticeExamPage } from './pages/PracticeExamPage'
import { WeeklyReportPage } from './pages/WeeklyReportPage'
import { AuthPage } from './pages/AuthPage'
import { QuickTeachPage } from './pages/QuickTeachPage'
import { HomeworkTrackerPage } from './pages/HomeworkTrackerPage'
import { EssayMarkerPage } from './pages/EssayMarkerPage'
import { MathSolverPage } from './pages/MathSolverPage'
import { GradeCalculatorPage } from './pages/GradeCalculatorPage'
import { CitationPage } from './pages/CitationPage'
import { CurriculumPage } from './pages/CurriculumPage'
import { NotesScannerPage } from './pages/NotesScannerPage'
import { ShopPage } from './pages/ShopPage'
import { FriendsPage } from './pages/FriendsPage'
import { WorksheetPage } from './pages/WorksheetPage'
import { ReadingPage } from './pages/ReadingPage'
import { DebatePage } from './pages/DebatePage'
import { CompareAnswersPage } from './pages/CompareAnswersPage'
import { ExamTechniquePage } from './pages/ExamTechniquePage'
import { ScienceCalcPage } from './pages/ScienceCalcPage'
import { ConjugationPage } from './pages/ConjugationPage'
import { DailyRecapPage } from './pages/DailyRecapPage'
import { CareerPage } from './pages/CareerPage'
import { MistakeJournalPage } from './pages/MistakeJournalPage'
import { BattlePage } from './pages/BattlePage'
import { SpeedRoundPage } from './pages/SpeedRoundPage'
import { StudyRoomPage } from './pages/StudyRoomPage'
import { MindMapPage } from './pages/MindMapPage'
import { AnxietyToolkitPage } from './pages/AnxietyToolkitPage'
import { ParentReportPage } from './pages/ParentReportPage'
import { ExamVaultPage } from './pages/ExamVaultPage'
import { MemoryPalacePage } from './pages/MemoryPalacePage'
import { ExamDaySimulatorPage } from './pages/ExamDaySimulatorPage'
import { SearchModal } from './components/SearchModal'
import { InstallPrompt } from './components/InstallPrompt'
import { RetroPlanet } from './components/RetroPlanet'
import { useUserStore } from './stores/userStore'
import { useAuthStore } from './stores/authStore'
import { useSubscriptionStore } from './stores/subscriptionStore'
import { useAnalyticsStore } from './stores/analyticsStore'
import { isSupabaseConfigured } from './lib/supabase'

// Loading splash while auth initializes
function LoadingSplash() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-bg dark:bg-dark-bg">
      <RetroPlanet size="md" />
      <p className="text-sm text-text-muted mt-4">Loading...</p>
    </div>
  )
}

function AppRoutes() {
  const { onboardingComplete } = useUserStore()
  const { user, isLoading, initialized } = useAuthStore()
  const [searchOpen, setSearchOpen] = useState(false)

  // Global keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setSearchOpen((o) => !o)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  // Auth loading state
  if (isSupabaseConfigured && (!initialized || isLoading)) {
    return <LoadingSplash />
  }

  // Not authenticated (only gate if Supabase is configured)
  if (isSupabaseConfigured && !user) {
    return (
      <Routes>
        <Route path="*" element={<AuthPage />} />
      </Routes>
    )
  }

  // Authenticated but not onboarded
  if (!onboardingComplete) {
    return (
      <Routes>
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="*" element={<Navigate to="/onboarding" replace />} />
      </Routes>
    )
  }

  // Fully authenticated + onboarded
  return (
    <>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/upload" element={<UploadPage />} />
          <Route path="/progress" element={<ProgressPage />} />
          <Route path="/planner" element={<PlannerPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/timetable" element={<TimetablePage />} />
          <Route path="/stuck" element={<StuckPage />} />
          <Route path="/flashcards" element={<FlashcardsPage />} />
          <Route path="/notes" element={<NotesPage />} />
          <Route path="/exam" element={<PracticeExamPage />} />
          <Route path="/weekly-report" element={<WeeklyReportPage />} />
          <Route path="/quick-teach" element={<QuickTeachPage />} />
          <Route path="/homework" element={<HomeworkTrackerPage />} />
          <Route path="/essay" element={<EssayMarkerPage />} />
          <Route path="/math-solver" element={<MathSolverPage />} />
          <Route path="/grades" element={<GradeCalculatorPage />} />
          <Route path="/citations" element={<CitationPage />} />
          <Route path="/curriculum" element={<CurriculumPage />} />
          <Route path="/scan-notes" element={<NotesScannerPage />} />
          <Route path="/shop" element={<ShopPage />} />
          <Route path="/friends" element={<FriendsPage />} />
          <Route path="/worksheet" element={<WorksheetPage />} />
          <Route path="/reading" element={<ReadingPage />} />
          <Route path="/debate" element={<DebatePage />} />
          <Route path="/compare" element={<CompareAnswersPage />} />
          <Route path="/exam-technique" element={<ExamTechniquePage />} />
          <Route path="/science" element={<ScienceCalcPage />} />
          <Route path="/conjugation" element={<ConjugationPage />} />
          <Route path="/recap" element={<DailyRecapPage />} />
          <Route path="/careers" element={<CareerPage />} />
          <Route path="/mistakes" element={<MistakeJournalPage />} />
          <Route path="/battle" element={<BattlePage />} />
          <Route path="/speed" element={<SpeedRoundPage />} />
          <Route path="/study-room" element={<StudyRoomPage />} />
          <Route path="/mind-map" element={<MindMapPage />} />
          <Route path="/anxiety" element={<AnxietyToolkitPage />} />
          <Route path="/parent-report" element={<ParentReportPage />} />
          <Route path="/exam-vault" element={<ExamVaultPage />} />
          <Route path="/memory-palace" element={<MemoryPalacePage />} />
          <Route path="/exam-sim" element={<ExamDaySimulatorPage />} />
        </Route>
        <Route path="/session/:uploadId?" element={<StudySessionPage />} />
        <Route path="/focus" element={<FocusModePage />} />
        <Route path="/onboarding" element={<Navigate to="/" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
      <InstallPrompt />
    </>
  )
}

export default function App() {
  // Initialize auth on mount
  useEffect(() => {
    if (isSupabaseConfigured) {
      useAuthStore.getState().initialize()
    }

    // Daily session reset
    const sub = useSubscriptionStore.getState()
    const today = new Date().toISOString().split('T')[0]
    if (sub.lastSessionDate !== today) {
      sub.resetDailyUsage()
    }

    // Streak check
    const user = useUserStore.getState()
    if (user.onboardingComplete) {
      const lastDate = user.lastActivityDate
      if (lastDate) {
        const daysSince = Math.floor((Date.now() - new Date(lastDate).getTime()) / 86400000)
        if (daysSince >= 2) {
          if (user.freezeAvailable) {
            // Use freeze silently
          } else if (user.currentStreak > 0) {
            useUserStore.setState({ currentStreak: 0 })
          }
        }
      }
    }

    useAnalyticsStore.getState().track('app_opened')
  }, [])

  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  )
}
