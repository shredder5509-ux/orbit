import { useRef, useMemo } from 'react'
import { Camera } from 'lucide-react'
import { DAYS, PERIODS } from '../stores/userStore'
import type { Timetable } from '../stores/userStore'

const CELL_PASTELS = [
  '#E8F0FE', // soft blue
  '#E6F7ED', // soft green
  '#FFF8E1', // soft yellow
  '#FDE8EC', // soft pink
  '#F0E6FF', // soft purple
  '#E0F5F2', // soft teal
  '#FFF0E0', // soft orange
  '#FCE4EC', // soft rose
]

interface TimetableGridProps {
  timetable: Timetable
  onCellChange: (day: string, period: number, value: string) => void
  onPhotoUpload?: (file: File) => void
  compact?: boolean
}

export function TimetableGrid({ timetable, onCellChange, onPhotoUpload, compact }: TimetableGridProps) {
  const photoRef = useRef<HTMLInputElement>(null)

  // Build a map of subject name → pastel colour
  const subjectColourMap = useMemo(() => {
    const map = new Map<string, string>()
    let colourIdx = 0
    for (const day of DAYS) {
      for (const subject of (timetable[day] || [])) {
        const key = subject.trim().toLowerCase()
        if (key && !map.has(key)) {
          map.set(key, CELL_PASTELS[colourIdx % CELL_PASTELS.length])
          colourIdx++
        }
      }
    }
    return map
  }, [timetable])

  const getCellColour = (value: string): string | undefined => {
    const key = value.trim().toLowerCase()
    return key ? subjectColourMap.get(key) : undefined
  }

  return (
    <div>
      {/* Photo upload option */}
      {onPhotoUpload && (
        <>
          <input
            ref={photoRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) onPhotoUpload(file)
            }}
          />
          <button
            onClick={() => photoRef.current?.click()}
            className="w-full flex items-center justify-center gap-2 py-2.5 mb-4 border border-dashed border-border dark:border-dark-border rounded-[var(--radius-md)] text-xs text-text-muted hover:text-text-secondary hover:border-text-muted dark:hover:text-dark-text-primary transition-colors"
          >
            <Camera size={14} />
            Snap your timetable to auto-fill
          </button>
        </>
      )}

      {/* Grid */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className={`${compact ? 'w-10 py-1' : 'w-14 py-1.5'} text-[10px] font-medium text-text-muted uppercase tracking-wide text-left`}>
              </th>
              {DAYS.map((day) => (
                <th
                  key={day}
                  className={`${compact ? 'py-1' : 'py-1.5'} text-[10px] font-medium text-text-muted uppercase tracking-wide text-center`}
                >
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PERIODS.map((period, periodIdx) => (
              <tr key={period}>
                <td className={`${compact ? 'py-0.5 pr-1' : 'py-1 pr-2'} text-[10px] text-text-muted text-right`}>
                  P{period}
                </td>
                {DAYS.map((day) => {
                  const value = timetable[day]?.[periodIdx] || ''
                  const bgColour = getCellColour(value)
                  return (
                    <td key={day} className={`${compact ? 'p-0.5' : 'p-1'}`}>
                      <input
                        value={value}
                        onChange={(e) => onCellChange(day, periodIdx, e.target.value)}
                        placeholder="—"
                        style={bgColour ? { backgroundColor: bgColour } : undefined}
                        className={`
                          w-full text-center rounded-[var(--radius-sm)]
                          text-text-primary dark:text-dark-text-primary
                          placeholder:text-text-muted/40 dark:placeholder:text-dark-border
                          focus:outline-none focus:ring-1 focus:ring-text-muted/30
                          transition-colors border-0
                          ${!bgColour ? 'bg-accent-light' : ''}
                          ${compact ? 'px-1 py-1.5 text-[10px]' : 'px-1.5 py-2 text-xs'}
                        `}
                      />
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
