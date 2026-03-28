import { useState } from 'react'
// framer-motion removed — using key-based re-render for step transitions
import { ArrowRight, ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Avatar, getAvatarIds } from '../components/ui/Avatar'
import { TimetableGrid } from '../components/TimetableGrid'
import { useUserStore, CURRICULUM_LABELS } from '../stores/userStore'
import type { Curriculum } from '../stores/userStore'
import { useSettingsStore } from '../stores/settingsStore'
import { useSubjectStore } from '../stores/subjectStore'
import { generateSubjectTopics, extractTimetableFromPhoto } from '../services/claudeApi'
import { RetroPlanet } from '../components/RetroPlanet'
import { PixelScene } from '../components/RetroIllustrations'
import { useSubscriptionStore } from '../stores/subscriptionStore'

const TOTAL_STEPS = 4

const curriculumOptions: { value: Curriculum; label: string }[] = [
  { value: 'gcse', label: 'UK GCSE' },
  { value: 'igcse', label: 'IGCSE (Cambridge International)' },
  { value: 'a-level', label: 'UK A-Level' },
  { value: 'ib', label: 'IB (International Baccalaureate)' },
  { value: 'us-middle', label: 'US Middle School' },
  { value: 'us-high', label: 'US High School' },
  { value: 'custom', label: 'Custom / Other' },
]

const ageOptions = Array.from({ length: 8 }, (_, i) => i + 11) // 11-18

export function OnboardingPage() {
  const navigate = useNavigate()
  const {
    displayName, age, school, curriculum, timetable, subjects,
    tutorName, tutorAvatarId,
    setDisplayName, setAge, setSchool, setCurriculum,
    setTimetableCell, setTimetable,
    setTutorName, setTutorAvatarId,
    completeOnboarding,
  } = useUserStore()
  const { apiKey } = useSettingsStore()
  const { setSubjects, setGenerating } = useSubjectStore()

  const [step, setStep] = useState(0)
  const [isExtractingTimetable, setIsExtractingTimetable] = useState(false)

  const handlePhotoUpload = async (file: File) => {
    if (!apiKey) return
    setIsExtractingTimetable(true)
    try {
      const reader = new FileReader()
      reader.onload = async () => {
        try {
          const base64 = reader.result as string
          const extracted = await extractTimetableFromPhoto(apiKey, base64)
          setTimetable(extracted)
        } catch {
          // Silently fail — user can fill manually
        } finally {
          setIsExtractingTimetable(false)
        }
      }
      reader.readAsDataURL(file)
    } catch {
      setIsExtractingTimetable(false)
    }
  }

  const handleComplete = async () => {
    completeOnboarding()

    // Generate subject tree in background if we have subjects and API key
    if (subjects.length > 0 && apiKey) {
      setGenerating(true)
      try {
        const generated = await generateSubjectTopics(apiKey, curriculum, age, subjects)
        setSubjects(generated)
      } catch {
        // Will show empty state on home — user can retry
      }
    }

    navigate('/')
  }

  const canProceed = [
    () => displayName.trim().length > 0,
    () => true, // age/school/curriculum always have defaults
    () => true, // timetable is optional (skip allowed)
    () => true, // tutor always has defaults
  ]

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <RetroPlanet size="md" />
            </div>
            <h1 className="text-2xl font-semibold text-text-primary dark:text-dark-text-primary mb-2">
              Welcome to Orbit
            </h1>
            <p className="text-sm text-text-muted dark:text-dark-text-secondary mb-8 max-w-xs mx-auto">
              Your personal study companion. Let's get to know you.
            </p>
            <div className="max-w-xs mx-auto mb-6">
              <Input
                label="What's your name?"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your name"
                autoFocus
              />
            </div>
          </div>
        )
      case 1:
        return (
          <div>
            <h1 className="text-xl font-semibold text-text-primary dark:text-dark-text-primary mb-1 text-center">
              About you
            </h1>
            <p className="text-sm text-text-muted dark:text-dark-text-secondary mb-6 text-center">
              This helps us pick the right topics for your level.
            </p>
            <div className="space-y-4 max-w-xs mx-auto">
              <div>
                <label className="text-xs font-medium text-text-muted dark:text-dark-text-secondary uppercase tracking-wide block mb-1.5">Age</label>
                <div className="flex flex-wrap gap-1.5">
                  {ageOptions.map((a) => (
                    <button
                      key={a}
                      onClick={() => setAge(a)}
                      className={`px-3 py-1.5 text-xs rounded-[var(--radius-md)] border transition-colors ${
                        age === a
                          ? 'bg-text-primary dark:bg-dark-text-primary text-white dark:text-dark-bg border-text-primary dark:border-dark-text-primary'
                          : 'border-border dark:border-dark-border text-text-secondary dark:text-dark-text-secondary hover:border-text-muted'
                      }`}
                    >
                      {a}
                    </button>
                  ))}
                </div>
              </div>
              <Input
                label="School name (optional)"
                value={school}
                onChange={(e) => setSchool(e.target.value)}
                placeholder="e.g. Riverside Academy"
              />
              <div>
                <label className="text-xs font-medium text-text-muted dark:text-dark-text-secondary uppercase tracking-wide block mb-1.5">Curriculum</label>
                <div className="space-y-1.5">
                  {curriculumOptions.map(({ value, label }) => (
                    <button
                      key={value}
                      onClick={() => setCurriculum(value)}
                      className={`w-full text-left px-3 py-2 text-sm rounded-[var(--radius-md)] border transition-colors ${
                        curriculum === value
                          ? 'bg-text-primary dark:bg-dark-text-primary text-white dark:text-dark-bg border-text-primary dark:border-dark-text-primary'
                          : 'border-border dark:border-dark-border text-text-primary dark:text-dark-text-primary hover:border-text-muted'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )
      case 2:
        return (
          <div>
            <h1 className="text-xl font-semibold text-text-primary dark:text-dark-text-primary mb-1 text-center">
              Your timetable
            </h1>
            <p className="text-sm text-text-muted dark:text-dark-text-secondary mb-4 text-center">
              Fill in your weekly subjects, or snap a photo of your timetable.
            </p>
            {isExtractingTimetable && (
              <div className="text-center py-4 mb-4 border border-border dark:border-dark-border rounded-[var(--radius-md)]">
                <div className="w-4 h-4 border-2 border-text-primary dark:border-dark-text-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-xs text-text-muted">Reading your timetable...</p>
              </div>
            )}
            <TimetableGrid
              timetable={timetable}
              onCellChange={setTimetableCell}
              onPhotoUpload={apiKey ? handlePhotoUpload : undefined}
              compact
            />
            {subjects.length > 0 && (
              <div className="mt-4 text-center">
                <p className="text-[10px] text-text-muted uppercase tracking-wide mb-1.5">Detected subjects</p>
                <div className="flex flex-wrap gap-1.5 justify-center">
                  {subjects.map((s) => (
                    <span key={s} className="px-2 py-0.5 text-xs border border-border dark:border-dark-border rounded-full text-text-secondary dark:text-dark-text-secondary">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )
      case 3:
        return (
          <div className="text-center">
            <h1 className="text-xl font-semibold text-text-primary dark:text-dark-text-primary mb-1">
              Choose your planet
            </h1>
            <p className="text-sm text-text-muted dark:text-dark-text-secondary mb-6">
              Pick a planet for your tutor. It'll grow and evolve as you level up.
            </p>
            <div className="flex flex-wrap justify-center gap-3 mb-6">
              {getAvatarIds().map((id) => {
                const locked = useSubscriptionStore.getState().isPlanetLocked(id)
                return (
                  <Avatar
                    key={id}
                    avatarId={id}
                    size="lg"
                    selected={id === tutorAvatarId}
                    locked={locked}
                    onClick={() => !locked && setTutorAvatarId(id)}
                  />
                )
              })}
            </div>
            <div className="max-w-xs mx-auto mb-4">
              <Input
                label="Name your tutor"
                value={tutorName}
                onChange={(e) => setTutorName(e.target.value)}
                placeholder="e.g. Nova"
              />
            </div>
            <div className="border border-border dark:border-dark-border rounded-[var(--radius-lg)] p-3 text-left max-w-sm mx-auto">
              <div className="flex gap-2.5 items-start">
                <Avatar avatarId={tutorAvatarId} size="sm" />
                <div>
                  <p className="text-[10px] font-medium text-text-muted dark:text-dark-text-secondary uppercase tracking-wide mb-0.5">
                    {tutorName || 'Nova'}
                  </p>
                  <p className="text-sm text-text-primary dark:text-dark-text-primary">
                    Hey {displayName}! Ready to learn something cool together?
                  </p>
                </div>
              </div>
            </div>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center px-6 bg-bg dark:bg-dark-bg">
      <PixelScene />
      <div className="w-full max-w-md relative z-10">
        {/* Step indicators */}
        <div className="flex justify-center gap-2 mb-8">
          {Array.from({ length: TOTAL_STEPS }, (_, i) => (
            <div
              key={i}
              className={`h-1 rounded-full transition-all ${
                i === step ? 'w-6 bg-text-primary dark:bg-dark-text-primary'
                  : i < step ? 'w-3 bg-text-muted dark:bg-dark-text-secondary'
                  : 'w-1.5 bg-border dark:bg-dark-border'
              }`}
            />
          ))}
        </div>

        <div key={step}>
          {renderStep()}
        </div>

        {/* Navigation buttons */}
        <div className="flex justify-between items-center mt-8 max-w-xs mx-auto">
          {step > 0 ? (
            <Button variant="ghost" size="sm" onClick={() => setStep(step - 1)}>
              <ArrowLeft size={14} />
              Back
            </Button>
          ) : (
            <div />
          )}

          {step < TOTAL_STEPS - 1 ? (
            <Button
              onClick={() => setStep(step + 1)}
              disabled={!canProceed[step]()}
              size="lg"
            >
              {step === 2 && subjects.length === 0 ? 'Skip' : 'Next'}
              <ArrowRight size={14} />
            </Button>
          ) : (
            <Button onClick={handleComplete} size="lg">
              Start Learning
              <ArrowRight size={14} />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
