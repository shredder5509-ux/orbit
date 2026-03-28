import { useState, useEffect } from 'react'
import { Moon, Sun, Monitor, Clock, Key, X, Sparkles, Crown, LogOut, Bell, Coffee, Download, Upload, Trash2 } from 'lucide-react'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { Avatar, getAvatarIds } from '../components/ui/Avatar'
import { useUserStore } from '../stores/userStore'
import { useThemeStore } from '../stores/themeStore'
import { useSettingsStore } from '../stores/settingsStore'
import { useSubscriptionStore } from '../stores/subscriptionStore'
import { useAuthStore } from '../stores/authStore'
import { isSupabaseConfigured } from '../lib/supabase'
import { Paywall } from '../components/Paywall'
import { downloadExport, importData, clearAllData } from '../services/importExport'

const themeOptions = [
  { value: 'light' as const, icon: Sun, label: 'Light' },
  { value: 'dark' as const, icon: Moon, label: 'Dark' },
  { value: 'auto' as const, icon: Monitor, label: 'Auto' },
]

const goalOptions = [15, 30, 45, 60]

export function SettingsPage() {
  const {
    displayName, tutorName, tutorAvatarId, dailyGoalMinutes,
    setDisplayName, setTutorName, setTutorAvatarId, setDailyGoalMinutes,
  } = useUserStore()
  const { mode, setMode } = useThemeStore()
  const { apiKey, setApiKey, clearApiKey } = useSettingsStore()
  const { plan, isPlanetLocked } = useSubscriptionStore()
  const isPro = plan !== 'free'
  const [showPaywall, setShowPaywall] = useState(false)

  // Break reminder prefs
  const [breakPrefs, setBreakPrefs] = useState(() => {
    try { return JSON.parse(localStorage.getItem('orbit-break-prefs') || '{}') } catch { return {} }
  })
  const toggleBreak = () => {
    const updated = { ...breakPrefs, enabled: breakPrefs.enabled === false }
    setBreakPrefs(updated)
    localStorage.setItem('orbit-break-prefs', JSON.stringify(updated))
  }

  // Notification prefs
  const [notifPerms, setNotifPerms] = useState<NotificationPermission>('default')
  const [notifPrefs, setNotifPrefs] = useState(() => {
    try { return JSON.parse(localStorage.getItem('orbit-notif-prefs') || '{}') } catch { return {} }
  })

  useEffect(() => {
    if ('Notification' in window) setNotifPerms(Notification.permission)
  }, [])

  const toggleNotif = (key: string) => {
    const updated = { ...notifPrefs, [key]: !notifPrefs[key] }
    setNotifPrefs(updated)
    localStorage.setItem('orbit-notif-prefs', JSON.stringify(updated))
  }

  const requestNotifPermission = async () => {
    if ('Notification' in window) {
      const perm = await Notification.requestPermission()
      setNotifPerms(perm)
    }
  }

  const handlePlanetClick = (id: string) => {
    if (isPlanetLocked(id)) {
      setShowPaywall(true)
    } else {
      setTutorAvatarId(id)
    }
  }

  return (
    <div className="max-w-[680px] mx-auto px-6 py-8">
      <h1 className="text-lg font-semibold text-text-primary dark:text-dark-text-primary mb-6">
        Settings
      </h1>

      {/* Subscription */}
      <Card className="mb-4" pastel={isPro ? '#FFF8E130' : undefined}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {isPro ? <Crown size={14} className="text-text-primary" /> : <Sparkles size={14} className="text-text-muted" />}
            <h2 className="text-sm font-semibold text-text-primary dark:text-dark-text-primary">
              {isPro ? 'Orbit Pro' : 'Free Plan'}
            </h2>
          </div>
          {!isPro && (
            <Button variant="pastel" size="sm" onClick={() => setShowPaywall(true)}>
              Upgrade
            </Button>
          )}
        </div>
        <p className="text-[11px] text-text-muted">
          {isPro
            ? 'Unlimited sessions, all planets, advanced features.'
            : '3 sessions/day, 4 planets. Upgrade for unlimited access.'
          }
        </p>
      </Card>

      {/* Profile */}
      <Card className="mb-4">
        <h2 className="text-sm font-semibold text-text-primary dark:text-dark-text-primary mb-3">Profile</h2>
        <Input
          label="Your name"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="What should we call you?"
        />
      </Card>

      {/* Tutor */}
      <Card className="mb-4">
        <h2 className="text-sm font-semibold text-text-primary dark:text-dark-text-primary mb-3">Your Tutor</h2>
        <Input
          label="Tutor name"
          value={tutorName}
          onChange={(e) => setTutorName(e.target.value)}
          placeholder="Name your study companion"
          className="mb-4"
        />
        <label className="text-xs font-medium text-text-muted dark:text-dark-text-secondary uppercase tracking-wide block mb-2">
          Planet
        </label>
        <div className="flex flex-wrap gap-3">
          {getAvatarIds().map((id) => (
            <Avatar
              key={id}
              avatarId={id}
              size="md"
              selected={id === tutorAvatarId}
              locked={isPlanetLocked(id)}
              onClick={() => handlePlanetClick(id)}
            />
          ))}
        </div>
        {!isPro && (
          <p className="text-[9px] text-text-muted mt-2 flex items-center gap-1">
            <Sparkles size={8} />
            Upgrade to Pro to unlock all 12 planets
          </p>
        )}
      </Card>

      {/* API Key */}
      <Card className="mb-4">
        <h2 className="text-sm font-semibold text-text-primary dark:text-dark-text-primary mb-3">
          <Key size={12} className="inline mr-1.5" />
          AI Connection
        </h2>
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <Input
              label="Anthropic API Key"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-ant-..."
            />
          </div>
          {apiKey && (
            <button
              onClick={clearApiKey}
              className="mb-0.5 p-2 text-text-muted hover:text-text-primary transition-colors"
              title="Clear key"
            >
              <X size={14} />
            </button>
          )}
        </div>
        {apiKey && (
          <p className="text-[10px] text-green-600 dark:text-green-400 mt-2 font-medium">
            ✓ Key saved automatically — stored in your browser only.
          </p>
        )}
        {!apiKey && (
          <p className="text-[10px] text-text-muted mt-2">
            Your key stays in your browser. Never sent anywhere except Anthropic's API.
          </p>
        )}
      </Card>

      {/* Theme */}
      <Card className="mb-4">
        <h2 className="text-sm font-semibold text-text-primary dark:text-dark-text-primary mb-3">Theme</h2>
        <div className="flex gap-2">
          {themeOptions.map(({ value, icon: Icon, label }) => (
            <Button
              key={value}
              variant={mode === value ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setMode(value)}
              className="flex-1"
            >
              <Icon size={12} />
              {label}
            </Button>
          ))}
        </div>
      </Card>

      {/* Daily Goal */}
      <Card>
        <h2 className="text-sm font-semibold text-text-primary dark:text-dark-text-primary mb-3">
          <Clock size={12} className="inline mr-1.5" />
          Daily Study Goal
        </h2>
        <div className="flex gap-2">
          {goalOptions.map((mins) => (
            <Button
              key={mins}
              variant={dailyGoalMinutes === mins ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setDailyGoalMinutes(mins)}
              className="flex-1"
            >
              {mins} min
            </Button>
          ))}
        </div>
      </Card>

      {/* Break Reminders */}
      <Card className="mb-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-text-primary dark:text-dark-text-primary">
              <Coffee size={12} className="inline mr-1.5" />
              Break Reminders
            </h2>
            <p className="text-[10px] text-text-muted mt-0.5">Gentle nudge after 25 min of studying</p>
          </div>
          <div
            onClick={toggleBreak}
            className={`w-8 h-[18px] rounded-full transition-colors relative cursor-pointer ${
              breakPrefs.enabled !== false ? 'bg-text-primary' : 'bg-border'
            }`}
          >
            <div className={`absolute top-[2px] w-[14px] h-[14px] rounded-full bg-white shadow-sm transition-transform ${
              breakPrefs.enabled !== false ? 'translate-x-[16px]' : 'translate-x-[2px]'
            }`} />
          </div>
        </div>
      </Card>

      {/* Notifications */}
      <Card className="mb-4">
        <h2 className="text-sm font-semibold text-text-primary dark:text-dark-text-primary mb-3">
          <Bell size={12} className="inline mr-1.5" />
          Notifications
        </h2>
        {notifPerms === 'denied' ? (
          <p className="text-[11px] text-text-muted">Notifications are blocked in your browser settings.</p>
        ) : notifPerms !== 'granted' ? (
          <div>
            <p className="text-[11px] text-text-muted mb-2">Get reminders for streaks, reviews, and deadlines.</p>
            <Button variant="secondary" size="sm" onClick={requestNotifPermission}>Enable Notifications</Button>
          </div>
        ) : (
          <div className="space-y-2">
            {[
              { key: 'streak', label: 'Streak reminders', desc: 'Daily reminder to keep your streak' },
              { key: 'review', label: 'Review due', desc: 'When a topic needs review' },
              { key: 'deadline', label: 'Deadline approaching', desc: '3 days and 1 day before' },
              { key: 'encourage', label: 'Weekly encouragement', desc: 'Celebrate your progress' },
            ].map(({ key, label, desc }) => (
              <label key={key} className="flex items-center justify-between py-1 cursor-pointer group">
                <div>
                  <p className="text-[12px] text-text-primary">{label}</p>
                  <p className="text-[10px] text-text-muted">{desc}</p>
                </div>
                <div
                  onClick={() => toggleNotif(key)}
                  className={`w-8 h-[18px] rounded-full transition-colors relative cursor-pointer ${
                    notifPrefs[key] !== false ? 'bg-text-primary' : 'bg-border'
                  }`}
                >
                  <div className={`absolute top-[2px] w-[14px] h-[14px] rounded-full bg-white shadow-sm transition-transform ${
                    notifPrefs[key] !== false ? 'translate-x-[16px]' : 'translate-x-[2px]'
                  }`} />
                </div>
              </label>
            ))}
          </div>
        )}
      </Card>

      {/* Import/Export */}
      <Card className="mb-4">
        <h2 className="text-sm font-semibold text-text-primary dark:text-dark-text-primary mb-3">
          <Download size={12} className="inline mr-1.5" />
          Data
        </h2>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" onClick={downloadExport}>
            <Download size={10} /> Export Backup
          </Button>
          <Button variant="secondary" size="sm" onClick={() => {
            const input = document.createElement('input')
            input.type = 'file'
            input.accept = '.json'
            input.onchange = (e) => {
              const file = (e.target as HTMLInputElement).files?.[0]
              if (!file) return
              const reader = new FileReader()
              reader.onload = () => {
                const result = importData(reader.result as string)
                if (result.success) {
                  alert(`Imported ${result.keysImported} items. Refresh to apply.`)
                  window.location.reload()
                } else {
                  alert(`Import failed: ${result.error}`)
                }
              }
              reader.readAsText(file)
            }
            input.click()
          }}>
            <Upload size={10} /> Import Backup
          </Button>
        </div>
        <p className="text-[9px] text-text-muted mt-2">Export saves all your data as a JSON file.</p>
      </Card>

      {/* Sign Out */}
      {isSupabaseConfigured && (
        <div className="mt-6 pt-4 border-t border-border/50 dark:border-dark-border/50">
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-text-muted hover:text-error"
            onClick={() => useAuthStore.getState().signOut()}
          >
            <LogOut size={12} />
            Sign Out
          </Button>
        </div>
      )}

      <Paywall open={showPaywall} onClose={() => setShowPaywall(false)} />
    </div>
  )
}
