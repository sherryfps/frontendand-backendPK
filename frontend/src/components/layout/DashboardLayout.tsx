import { Outlet } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Sidebar from './Sidebar'
import Header from './Header'
import { useThemeStore } from '@/store/themeStore'
import { motion, AnimatePresence } from 'framer-motion'

type Role = 'ADMIN' | 'AGENT' | 'ACCOUNTANT' | 'DESIGNER'

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(() => window.innerWidth >= 1024)
  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 1024)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])
  return isDesktop
}

export default function DashboardLayout({ role }: { role: Role }) {
  const { sidebarCollapsed } = useThemeStore()
  const [mobileOpen, setMobileOpen] = useState(false)
  const isDesktop = useIsDesktop()

  const marginLeft = isDesktop ? (sidebarCollapsed ? '72px' : '260px') : '0px'

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-950">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
        />
      )}

      {/* Sidebar */}
      <Sidebar
        role={role}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      {/* Main Content */}
      <motion.div
        className="flex-1 flex flex-col min-w-0 overflow-hidden"
        animate={{ marginLeft }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
      >
        <Header onMenuClick={() => setMobileOpen(true)} />

        <main className="flex-1 overflow-y-auto scrollbar-thin">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="p-3 sm:p-4 md:p-6 max-w-[1600px] mx-auto"
          >
            <Outlet />
          </motion.div>
        </main>
      </motion.div>
    </div>
  )
}
