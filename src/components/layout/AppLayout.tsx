import { Outlet, NavLink, useLocation } from 'react-router-dom'
import { Home, Upload, BarChart3, CalendarDays, Settings, BookOpen, HelpCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { TopBar } from './TopBar'
import { useThemeStore } from '../../stores/themeStore'

const navItems = [
  { to: '/', icon: Home, label: 'Orbit', pastel: '#E8F0FE' },
  { to: '/upload', icon: Upload, label: 'Upload', pastel: '#E6F7ED' },
  { to: '/stuck', icon: HelpCircle, label: 'Stuck', pastel: '#FDE8EC' },
  { to: '/flashcards', icon: BookOpen, label: 'Cards', pastel: '#FFF8E1' },
  { to: '/progress', icon: BarChart3, label: 'Progress', pastel: '#F0E6FF' },
  { to: '/settings', icon: Settings, label: 'Settings', pastel: '#E0F5F2' },
]

export function AppLayout() {
  const location = useLocation()
  const isDark = useThemeStore((s) => s.resolved === 'dark')

  return (
    <div className="min-h-screen flex flex-col bg-bg dark:bg-dark-bg relative">
      {/* Background image — faded in light, darker in dark */}
      <div
        className="fixed inset-0 z-0 pointer-events-none"
        style={{
          backgroundImage: isDark ? 'url(/dark-bg.png)' : 'url(/light-bg.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: isDark ? 1 : 0.65,
          filter: isDark ? 'brightness(0.45)' : 'brightness(1.05) saturate(0.8)',
        }}
      />
      <TopBar />
      <main className="flex-1 relative z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="h-full"
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
      <nav className="sticky bottom-0 bg-white/30 dark:bg-black/50 backdrop-blur-sm border-t border-white/20 dark:border-white/10 z-50">
        <div className="max-w-[720px] mx-auto flex items-center justify-around py-1.5 px-2">
          {navItems.map(({ to, icon: Icon, label, pastel }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `
                flex flex-col items-center gap-0.5 px-2 py-1 rounded-[var(--radius-md)]
                transition-all duration-200 text-[9px]
                ${isActive
                  ? 'text-text-primary dark:text-dark-text-primary font-medium'
                  : 'text-text-muted dark:text-dark-text-secondary hover:text-text-secondary'
                }
              `}
            >
              {({ isActive }) => (
                <>
                  <div
                    className="p-1.5 rounded-[var(--radius-sm)] transition-all duration-200"
                    style={isActive ? { backgroundColor: pastel + '80' } : undefined}
                  >
                    <Icon size={17} strokeWidth={isActive ? 2 : 1.5} />
                  </div>
                  <span>{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
