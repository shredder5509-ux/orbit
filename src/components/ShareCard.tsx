import { useRef, useState } from 'react'
import { Share2, Download } from 'lucide-react'
import { Button } from './ui/Button'
import { useUserStore, getLevelName } from '../stores/userStore'
import { useDataStore } from '../stores/dataStore'

export function ShareProgressButton() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [generating, setGenerating] = useState(false)

  const { displayName, xp, level, currentStreak } = useUserStore()
  const { completedSessions, badges } = useDataStore()

  const generateCard = async () => {
    setGenerating(true)
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = 600
    canvas.height = 340

    // Background — soft gradient
    const gradient = ctx.createLinearGradient(0, 0, 600, 340)
    gradient.addColorStop(0, '#F0E6FF')
    gradient.addColorStop(0.5, '#E8F0FE')
    gradient.addColorStop(1, '#E6F7ED')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, 600, 340)

    // Border
    ctx.strokeStyle = '#E5E5E5'
    ctx.lineWidth = 2
    ctx.roundRect(1, 1, 598, 338, 16)
    ctx.stroke()

    // Title
    ctx.fillStyle = '#1A1A1A'
    ctx.font = 'bold 24px Inter, system-ui, sans-serif'
    ctx.fillText(displayName || 'Student', 40, 55)

    ctx.fillStyle = '#999999'
    ctx.font = '13px Inter, system-ui, sans-serif'
    ctx.fillText(`Level ${level} · ${getLevelName(level)}`, 40, 78)

    // Stats
    const stats = [
      { label: 'XP', value: xp.toLocaleString() },
      { label: 'Streak', value: `${currentStreak} days` },
      { label: 'Sessions', value: completedSessions.length.toString() },
      { label: 'Badges', value: badges.length.toString() },
    ]

    stats.forEach((stat, i) => {
      const x = 40 + i * 135
      const y = 120

      // Card bg
      ctx.fillStyle = '#FFFFFF'
      ctx.beginPath()
      ctx.roundRect(x, y, 120, 70, 8)
      ctx.fill()

      // Value
      ctx.fillStyle = '#1A1A1A'
      ctx.font = 'bold 20px Inter, system-ui, sans-serif'
      ctx.fillText(stat.value, x + 12, y + 32)

      // Label
      ctx.fillStyle = '#999999'
      ctx.font = '11px Inter, system-ui, sans-serif'
      ctx.fillText(stat.label, x + 12, y + 52)
    })

    // Motivational text
    ctx.fillStyle = '#555555'
    ctx.font = '14px Inter, system-ui, sans-serif'
    const motivational = currentStreak >= 7
      ? `${currentStreak}-day streak and counting!`
      : completedSessions.length >= 10
      ? `${completedSessions.length} sessions completed!`
      : 'Just getting started!'
    ctx.fillText(motivational, 40, 240)

    // Branding
    ctx.fillStyle = '#999999'
    ctx.font = '11px Inter, system-ui, sans-serif'
    ctx.fillText('Made with Orbit · Your World of Learning', 40, 310)

    // Pixel planet (simple colored circle as placeholder)
    ctx.beginPath()
    ctx.arc(540, 50, 25, 0, Math.PI * 2)
    ctx.fillStyle = '#D8C8FF'
    ctx.fill()
    ctx.beginPath()
    ctx.arc(540, 50, 20, 0, Math.PI * 2)
    ctx.fillStyle = '#C8B8F0'
    ctx.fill()

    // Try Web Share API, fallback to download
    try {
      const blob = await new Promise<Blob>((resolve) =>
        canvas.toBlob((b) => resolve(b!), 'image/png')
      )
      const file = new File([blob], 'orbit-progress.png', { type: 'image/png' })

      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: 'My Orbit Progress' })
      } else {
        downloadImage(blob)
      }
    } catch {
      // Fallback to download
      canvas.toBlob((blob) => { if (blob) downloadImage(blob) }, 'image/png')
    }

    setGenerating(false)
  }

  const downloadImage = (blob: Blob) => {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'orbit-progress.png'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <>
      <canvas ref={canvasRef} className="hidden" />
      <Button variant="secondary" size="sm" onClick={generateCard} disabled={generating}>
        <Share2 size={12} />
        {generating ? 'Creating...' : 'Share Progress'}
      </Button>
    </>
  )
}
