// AgriSense Zimbabwe - API Service Layer
// This module centralizes all backend API calls for easy connection to a real backend.
// Replace BASE_URL with your actual backend URL when deploying.

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  const token = localStorage.getItem('agrisense_token');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  try {
    const res = await fetch(`${BASE_URL}${endpoint}`, { ...options, headers });
    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: 'Network error' }));
      throw new Error(error.message || `HTTP ${res.status}`);
    }
    return await res.json();
  } catch (err: any) {
    console.error(`API Error [${endpoint}]:`, err.message);
    throw err;
  }
}

// ─── AUTH ──────────────────────────────────────────────
export const authApi = {
  login: (email: string, password: string) =>
    request<{ token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  register: (data: any) =>
    request<{ token: string; user: any }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getProfile: () => request<any>('/auth/profile'),
};

// ─── FARMS ─────────────────────────────────────────────
export const farmsApi = {
  list: () => request<any[]>('/farms'),
  getById: (id: string) => request<any>(`/farms/${id}`),
  create: (data: any) =>
    request<any>('/farms', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) =>
    request<any>(`/farms/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) =>
    request<void>(`/farms/${id}`, { method: 'DELETE' }),
};

// ─── DISEASE DETECTION (AI SCAN) ──────────────────────
export const diseaseApi = {
  scanImage: async (file: File) => {
    const token = localStorage.getItem('agrisense_token');
    const formData = new FormData();
    formData.append('image', file);
    const res = await fetch(`${BASE_URL}/disease/scan`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    });
    if (!res.ok) throw new Error('Scan failed');
    return res.json() as Promise<ApiResponse<{
      crop: string;
      disease: string;
      confidence: number;
      treatment: string;
      severity: string;
    }>>;
  },
  getHistory: () =>
    request<any[]>('/disease/history'),
  getById: (id: string) =>
    request<any>(`/disease/${id}`),
};

// ─── WEATHER ──────────────────────────────────────────
export const weatherApi = {
  getCurrent: (lat: number, lng: number) =>
    request<any>(`/weather/current?lat=${lat}&lng=${lng}`),
  getForecast: (lat: number, lng: number, days: number = 7) =>
    request<any>(`/weather/forecast?lat=${lat}&lng=${lng}&days=${days}`),
  getAlerts: () => request<any[]>('/weather/alerts'),
};

// ─── ALERTS ───────────────────────────────────────────
export const alertsApi = {
  list: () => request<any[]>('/alerts'),
  markRead: (id: string) =>
    request<void>(`/alerts/${id}/read`, { method: 'PUT' }),
  getSettings: () => request<any>('/alerts/settings'),
  updateSettings: (data: any) =>
    request<any>('/alerts/settings', { method: 'PUT', body: JSON.stringify(data) }),
};

// ─── ADVISORY ─────────────────────────────────────────
export const advisoryApi = {
  list: () => request<any[]>('/advisory'),
  getAgronomists: () => request<any[]>('/advisory/agronomists'),
  requestConsultation: (agronomistId: string, message: string) =>
    request<any>('/advisory/consult', {
      method: 'POST',
      body: JSON.stringify({ agronomistId, message }),
    }),
};

// ─── MARKETPLACE ──────────────────────────────────────
export const marketplaceApi = {
  listProducts: (category?: string) =>
    request<any[]>(`/marketplace/products${category ? `?category=${category}` : ''}`),
  getProduct: (id: string) => request<any>(`/marketplace/products/${id}`),
  listOrders: () => request<any[]>('/marketplace/orders'),
  createOrder: (data: any) =>
    request<any>('/marketplace/orders', { method: 'POST', body: JSON.stringify(data) }),
};

// ─── ANALYTICS ────────────────────────────────────────
export const analyticsApi = {
  getCropHealth: () => request<any[]>('/analytics/crop-health'),
  getDiseaseOutbreaks: () => request<any>('/analytics/outbreaks'),
  getFinancialImpact: () => request<any>('/analytics/financial'),
  getDiseaseTrends: () => request<any[]>('/analytics/disease-trends'),
};
