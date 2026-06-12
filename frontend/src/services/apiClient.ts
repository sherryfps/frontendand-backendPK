import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/store/authStore';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://pk-corporate-backend.onrender.com';

// Global variables to handle token refresh
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token!);
    }
  });
  failedQueue = [];
};

// ─── Simple In-Memory Cache for GET Requests ───
const GET_CACHE_TTL = 300 * 1000; // 5 minutes
const getCache = new Map<string, { data: any; timestamp: number }>();

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

// Request interceptor - attach token & check cache
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = useAuthStore.getState().accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Cache lookup for GET requests
    if (config.method?.toLowerCase() === 'get' && config.url) {
      const key = config.url + JSON.stringify(config.params || {});
      const cached = getCache.get(key);
      if (cached && Date.now() - cached.timestamp < GET_CACHE_TTL) {
        config.adapter = () => Promise.resolve({
          data: cached.data,
          status: 200,
          statusText: 'OK',
          headers: {},
          config,
        } as any);
      }
    } else if (config.method?.toLowerCase() !== 'get') {
      // Clear cache on write operations
      getCache.clear();
    }

    return config;
  },
  (error) => Promise.reject(error)
);

import toast from 'react-hot-toast';

// Response interceptor - handle 401 & token refresh & cache store
apiClient.interceptors.response.use(
  (response: any) => {
    // Save successful GET response to cache
    if (response.config.method?.toLowerCase() === 'get' && response.config.url) {
      const key = response.config.url + JSON.stringify(response.config.params || {});
      getCache.set(key, { data: response.data, timestamp: Date.now() });
    }
    return response;
  },
  async (error: any) => {
    const originalRequest = error.config;

    if (error.response?.status === 429) {
      const msg = error.response.data?.message || 'Too many requests. Please wait before trying again.';
      toast.error(msg);
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return apiClient(originalRequest);
        }).catch(err => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = useAuthStore.getState().refreshToken;
        
        const res = await axios.post(`${API_BASE_URL}/auth/refresh-token`, { refreshToken });
        
        const { accessToken, refreshToken: newRefreshToken } = res.data.data;

        useAuthStore.getState().setTokens(accessToken, newRefreshToken);

        failedQueue.forEach(prom => prom.resolve(accessToken));
        failedQueue = [];

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return apiClient(originalRequest);

      } catch (err) {
        failedQueue.forEach(prom => prom.reject(err));
        failedQueue = [];
        useAuthStore.getState().logout();
        window.location.href = '/auth/login';
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// ─── Warm-up ping to wake Render free-tier backend ───
let warmUpSent = false;
export const warmUpBackend = () => {
  if (warmUpSent) return;
  warmUpSent = true;
  // Fire-and-forget health check to wake the server
  axios.get(`${API_BASE_URL}/actuator/health`, { timeout: 60000 })
    .then(() => console.log('[PK] Backend warm ✓'))
    .catch(() => console.log('[PK] Backend warming up...'));
};

export default apiClient;