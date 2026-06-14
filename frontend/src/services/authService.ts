import apiClient from './apiClient'

export interface LoginRequest {
  email: string
  password: string
  rememberMe?: boolean
}

export interface AuthResponse {
  user: {
    id: string
    email: string
    name: string
    role: string
    avatar?: string
  }
  accessToken: string
  refreshToken: string
}

// ─── Demo users for frontend-only mode (no backend required) ───
// Only included in development builds — tree-shaken from production
const DEMO_USERS: Record<string, { password: string; name: string; role: string; id: string }> = import.meta.env.DEV ? {
  'admin@pkcorporate.com':       { password: 'Admin@123',  name: 'Admin User',  role: 'ADMIN',      id: 'demo-admin-001' },
  'agent@pkcorporate.com':       { password: 'Agent@123',  name: 'Ravi Kumar',  role: 'AGENT',      id: 'demo-agent-001' },
  'accountant@pkcorporate.com':  { password: 'Acc@123',    name: 'Priya Shah',  role: 'ACCOUNTANT', id: 'demo-acc-001'   },
  'designer@pkcorporate.com':    { password: 'Design@123', name: 'Arjun Mehta', role: 'DESIGNER',   id: 'demo-des-001'   },
} : {}

const VITE_API_URL = import.meta.env.VITE_API_URL
const VITE_BACKEND_MOCK = import.meta.env.VITE_BACKEND_MOCK

const BACKEND_AVAILABLE = !!VITE_API_URL &&
  VITE_API_URL !== '' &&
  VITE_BACKEND_MOCK !== 'true'

const isMockMode = !BACKEND_AVAILABLE

// Keep logs minimal but explicit so auth failures are diagnosable
// (do not affect UI/dashboard styling)
if (import.meta.env.DEV) {
  // eslint-disable-next-line no-console
  console.debug('[authService] mode=', isMockMode ? 'MOCK' : 'BACKEND', {
    VITE_API_URL,
    VITE_BACKEND_MOCK,
  })
}


export const authService = {
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    if (BACKEND_AVAILABLE) {
      try {
        const res = await apiClient.post('/auth/login', data)
        return res.data.data
      } catch (err: any) {
        if (!err?.response) {
          throw new Error('Backend server is booting up or unreachable. Please try again in 15-20 seconds.')
        }
        throw err
      }
    }

    // Mock login
    await new Promise(r => setTimeout(r, 600))
    const user = DEMO_USERS[data.email.toLowerCase()]
    if (!user || user.password !== data.password) {
      throw { response: { data: { message: 'Invalid email or password' } } }
    }
    return {
      user: { id: user.id, email: data.email, name: user.name, role: user.role },
      accessToken: `mock-access-token-${user.role}`,
      refreshToken: `mock-refresh-token-${user.role}`,
    }
  },

  logout: async () => {
    try { await apiClient.post('/auth/logout') } catch {}
  },

  forgotPassword: async (email: string) => {
    try {
      const res = await apiClient.post('/auth/forgot-password', { email })
      return res.data.data ?? res.data
    } catch {
      await new Promise(r => setTimeout(r, 500))
      return { message: 'Reset link sent (demo mode)' }
    }
  },

  resetPassword: async (token: string, password: string) => {
    const res = await apiClient.post('/auth/reset-password', { token, password })
    return res.data.data ?? res.data
  },

  changePassword: async (currentPassword: string, newPassword: string) => {
    const res = await apiClient.post('/auth/change-password', { currentPassword, newPassword })
    return res.data.data ?? res.data
  },

  refreshToken: async (refreshToken: string) => {
    if (refreshToken.startsWith('mock-')) {
      return { accessToken: refreshToken.replace('refresh', 'access'), refreshToken }
    }
    const res = await apiClient.post('/auth/refresh-token', { refreshToken })
    return res.data.data
  },

  getProfile: async () => {
    const res = await apiClient.get('/auth/me')
    return res.data.data
  },
}