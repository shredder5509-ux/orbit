import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { TimetableGrid } from '../components/TimetableGrid'
import { useUserStore } from '../stores/userStore'
import { useSettingsStore } from '../stores/settingsStore'
import { useSubjectStore } from '../stores/subjectStore'
import { generateSubjectTopics, extractTimetableFromPhoto } from '../services/claudeApi'

export function TimetablePage() {
  const navigate = useNavigate()
  const { timetable, subjects, curriculum, age, setTimetableCell, setTimetable } = useUserStore()
  const { apiKey } = useSettingsStore()
  const { setSubjects, setGenerating, isGenerating } = useSubjectStore()
  const [isExtracting, setIsExtracting] = useState(false)

  const handlePhotoUpload = async (file: File) => {
    if (!apiKey) return
    setIsExtracting(true)
    try {
      const reader = new FileReader()
      reader.onload = async () => {
        try {
          const base64 = reader.result as string
          const extracted = await extractTimetableFromPhoto(apiKey, base64)
          setTimetable(extracted)
        } catch {}
        setIsExtracting(false)
      }
      reader.readAsDataURL(file)
    } catch {
      setIsExtracting(false)
    }
  }

  const handleGenerateTopics = async () => {
    if (!apiKey || subjects.length === 0) return
    setGenerating(true)
    try {
      const generated = await generateSubjectTopics(apiKey, curriculum, age, subjects)
      setSubjects(generated)
      navigate('/')
    } catch {
      setGenerating(false)
    }
  }

  return (
    <div className="max-w-[680px] mx-auto px-6 py-8">
      <h1 className="text-lg font-semibold text-text-primary dark:text-dark-text-primary mb-1">
        Your Timetable
      </h1>
      <p className="text-sm text-text-muted dark:text-dark-text-secondary mb-6">
        Fill in your weekly subjects to get personalised revision topics.
      </p>

      {isExtracting && (
        <Card className="mb-4 text-center">
          <div className="w-4 h-4 border-2 border-text-primary dark:border-dark-text-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs text-text-muted">Reading your timetable...</p>
        </Card>
      )}

      <Card className="mb-4">
        <TimetableGrid
          timetable={timetable}
          onCellChange={setTimetableCell}
          onPhotoUpload={apiKey ? handlePhotoUpload : undefined}
        />
      </Card>

      {subjects.length > 0 && (
        <Card className="mb-4">
          <p className="text-xs font-medium text-text-muted dark:text-dark-text-secondary uppercase tracking-wide mb-2">
            Detected subjects
          </p>
          <div className="flex flex-wrap gap-1.5">
            {subjects.map((s) => (
              <span key={s} className="px-2.5 py-1 text-xs border border-border dark:border-dark-border rounded-full text-text-primary dark:text-dark-text-primary">
                {s}
              </span>
            ))}
          </div>
        </Card>
      )}

      <Button
        onClick={handleGenerateTopics}
        disabled={subjects.length === 0 || !apiKey || isGenerating}
        className="w-full"
        size="lg"
      >
        {isGenerating ? 'Generating Topics...' : 'Generate Revision Topics'}
      </Button>
    </div>
  )
}
