import { useState } from 'react'
import { useDataStore } from '../stores/dataStore'

// GitHub-style 12-week activity heatmap
export function ActivityHeatmap() {
  const { completedSessions } = useDataStore()
  const [tooltip, setTooltip] = useState<{ x: number; y: number; text: string } | null>(null)

  // Build 12 weeks of data (84 days)
  const today = new Date()
  const days: { date: string; minutes: number; sessions: number; dayOfWeek: number }[] = []

  for (let i = 83; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().split('T')[0]

    const daySessions = completedSessions.filter((s) => s.endedAt.startsWith(dateStr))
    const mins = daySessions.reduce((sum, s) => sum + s.durationMinutes, 0)

    days.push({
      date: dateStr,
      minutes: mins,
      sessions: daySessions.length,
      dayOfWeek: d.getDay(),
    })
  }

  // Group into weeks (columns)
  const weeks: typeof days[] = []
  let currentWeek: typeof days = []
  for (const day of days) {
    currentWeek.push(day)
    if (day.dayOfWeek === 6) { // Saturday = end of week
      weeks.push(currentWeek)
      currentWeek = []
    }
  }
  if (currentWeek.length > 0) weeks.push(currentWeek)

  const getIntensity = (mins: number): string => {
    if (mins === 0) return '#F5F5F5'
    if (mins < 15) return '#E8F0FE'
    if (mins < 30) return '#C8D8F8'
    if (mins < 60) return '#A0B8F0'
    return '#7090E0'
  }

  const dayLabels = ['', 'Mon', '', 'Wed', '', 'Fri', '']

  return (
    <div className="relative">
      <div className="flex gap-0.5">
        {/* Day labels */}
        <div className="flex flex-col gap-0.5 mr-1">
          {dayLabels.map((label, i) => (
            <div key={i} className="h-[10px] flex items-center">
              <span className="text-[7px] text-text-muted leading-none">{label}</span>
            </div>
          ))}
        </div>

        {/* Weeks */}
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-0.5">
            {Array.from({ length: 7 }, (_, di) => {
              const day = week.find((d) => d.dayOfWeek === di)
              if (!day) return <div key={di} className="w-[10px] h-[10px]" />

              return (
                <div
                  key={di}
                  className="w-[10px] h-[10px] rounded-[2px] cursor-pointer transition-transform hover:scale-125"
                  style={{ backgroundColor: getIntensity(day.minutes) }}
                  onMouseEnter={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect()
                    const dateObj = new Date(day.date)
                    const dateLabel = dateObj.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
                    const text = day.minutes > 0
                      ? `${dateLabel}: ${day.minutes}m · ${day.sessions} session${day.sessions !== 1 ? 's' : ''}`
                      : `${dateLabel}: No study`
                    setTooltip({ x: rect.left, y: rect.top - 28, text })
                  }}
                  onMouseLeave={() => setTooltip(null)}
                />
              )
            })}
          </div>
        ))}
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="fixed z-50 px-2 py-1 bg-text-primary text-white text-[8px] rounded-[4px] pointer-events-none whitespace-nowrap"
          style={{ left: tooltip.x, top: tooltip.y }}
        >
          {tooltip.text}
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-1 mt-2 justify-end">
        <span className="text-[7px] text-text-muted">Less</span>
        {['#F5F5F5', '#E8F0FE', '#C8D8F8', '#A0B8F0', '#7090E0'].map((color) => (
          <div key={color} className="w-[8px] h-[8px] rounded-[1px]" style={{ backgroundColor: color }} />
        ))}
        <span className="text-[7px] text-text-muted">More</span>
      </div>
    </div>
  )
}
