import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://pk-corporate-backend.onrender.com/api'

interface BackendWarmupProps {
  children: React.ReactNode
}

/**
 * Gates the entire app behind a backend readiness check.
 * Render free-tier cold starts can take 60–90s for Spring Boot.
 * This component pings /actuator/health until it responds,
 * showing a user-friendly "waking up" screen.
 */
export default function BackendWarmup({ children }: BackendWarmupProps) {
  const [ready, setReady] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const [elapsedSec, setElapsedSec] = useState(0)
  const startRef = useRef(Date.now())

  const MAX_ATTEMPTS = 12 // 12 * 10s = 2 minutes max
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let cancelled = false
    let timer: ReturnType<typeof setTimeout> | null = null

    const ping = async (att: number) => {
      if (cancelled) return
      setAttempt(att)
      try {
        await axios.get(`${API_BASE_URL}/actuator/health`, {
          timeout: 15000,
          validateStatus: (s) => s < 500, // any non-5xx is "alive"
        })
        if (!cancelled) setReady(true)
      } catch {
        if (cancelled) return
        if (att >= MAX_ATTEMPTS) {
          setFailed(true)
        } else {
          timer = setTimeout(() => ping(att + 1), 10000)
        }
      }
    }

    ping(1)

    return () => {
      cancelled = true
      if (timer) clearTimeout(timer)
    }
  }, [])

  // Elapsed seconds ticker
  useEffect(() => {
    if (ready || failed) return
    const interval = setInterval(() => {
      setElapsedSec(Math.floor((Date.now() - startRef.current) / 1000))
    }, 1000)
    return () => clearInterval(interval)
  }, [ready, failed])

  if (ready) return <>{children}</>

  if (failed) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-8 text-center shadow-lg">
          <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-red-500 text-2xl">⚠️</span>
          </div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            Backend Unavailable
          </h2>
          <p className="text-sm text-gray-500 mt-2 leading-relaxed">
            The server didn't respond after {MAX_ATTEMPTS} attempts. It may be deploying or experiencing issues.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-6 px-6 py-2.5 bg-primary-500 text-white rounded-xl text-sm font-semibold hover:bg-primary-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  // "Waking up" screen
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-8 text-center shadow-lg"
      >
        {/* Logo */}
        <div className="w-16 h-16 bg-primary-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-red-glow">
          <span className="text-white font-black text-2xl">PK</span>
        </div>

        {/* Spinner */}
        <div className="flex items-center justify-center gap-2 mb-4">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2.5 h-2.5 bg-primary-500 rounded-full"
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.12 }}
            />
          ))}
        </div>

        <h2 className="text-lg font-bold text-gray-900 dark:text-white">
          Waking up the server...
        </h2>
        <p className="text-sm text-gray-500 mt-2 leading-relaxed">
          Our backend is hosted on a free tier and sleeps after inactivity.
          <br />
          This usually takes <span className="font-semibold text-primary-500">30–90 seconds</span> on the first visit.
        </p>

        {/* Progress indicator */}
        <div className="mt-6 space-y-2">
          <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-primary-500 rounded-full"
              initial={{ width: '0%' }}
              animate={{ width: `${Math.min((attempt / MAX_ATTEMPTS) * 100, 95)}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <p className="text-xs text-gray-400">
            Attempt {attempt}/{MAX_ATTEMPTS} • {elapsedSec}s elapsed
          </p>
        </div>
      </motion.div>
    </div>
  )
}
