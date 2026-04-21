import { Outlet, NavLink, useLocation } from 'react-router-dom'
import { Home, Upload, BarChart3, CalendarDays, Settings, BookOpen, HelpCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { TopBar } from './TopBar'

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

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-[#111111]">
      <TopBar />
      <main className="flex-1">
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
      <nav className="sticky bottom-0 bg-white dark:bg-[#111111] border-t border-border dark:border-dark-border z-50">
        <div className="max-w-[720px] mx-auto flex items-center justify-around py-1.5 px-2">
          {navItems.map(({ to, icon: Icon, label, pastel }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `
                flex flex-col items-center gap-0.5 px-2 py-1 rounded-[var(--radius-md)]
                transition-all duration-200 text-[9px]
                ${isActive
                  ? 'text-black dark:text-white font-medium'
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
