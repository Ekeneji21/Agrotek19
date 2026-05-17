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
  const res = await fetch(`${BASE_URL}${endpoint}`, { ...options, headers });
  const json = await res.json().catch(() => ({ success: false, message: 'Network error', data: null }));
  if (!res.ok) throw new Error(json.message || `HTTP ${res.status}`);
  return json;
}

export const authApi = {
  login: (email: string, password: string) =>
    request<{ token: string; user: any }>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  register: (data: any) =>
    request<{ token: string; user: any }>('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  getProfile: () => request<any>('/auth/profile'),
  updateProfile: (data: any) => request<any>('/auth/profile', { method: 'PUT', body: JSON.stringify(data) }),
  updatePassword: (data: any) => request<any>('/auth/password', { method: 'PUT', body: JSON.stringify(data) }),
};

export const farmsApi = {
  list: () => request<any[]>('/farms'),
  stats: () => request<any>('/farms/stats/summary'),
  getById: (id: string) => request<any>(`/farms/${id}`),
  create: (data: any) => request<any>('/farms', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) => request<any>(`/farms/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => request<void>(`/farms/${id}`, { method: 'DELETE' }),
};

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
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Scan failed');
    return json as ApiResponse<{ crop: string; disease: string; confidence: number; treatment: string; severity: string; image_path: string }>;
  },
  getHistory: () => request<any[]>('/disease/history'),
  getById: (id: string) => request<any>(`/disease/${id}`),
};

export const weatherApi = {
  getCurrent: (lat: number, lng: number) => request<any>(`/weather/current?lat=${lat}&lng=${lng}`),
  getForecast: (lat: number, lng: number, days = 7) => request<any>(`/weather/forecast?lat=${lat}&lng=${lng}&days=${days}`),
  getAlerts: () => request<any[]>('/weather/alerts'),
};

export const alertsApi = {
  list: () => request<any[]>('/alerts'),
  markRead: (id: string) => request<void>(`/alerts/${id}/read`, { method: 'PUT' }),
  delete: (id: string) => request<void>(`/alerts/${id}`, { method: 'DELETE' }),
  markAllRead: () => request<void>('/alerts/read-all/bulk', { method: 'PUT' }),
  getSettings: () => request<any>('/alerts/settings'),
  updateSettings: (data: any) => request<any>('/alerts/settings', { method: 'PUT', body: JSON.stringify(data) }),
};

export const advisoryApi = {
  list: () => request<any[]>('/advisory'),
  getStats: () => request<any>('/advisory/stats'),
  getAgronomists: () => request<any[]>('/advisory/agronomists'),
  requestConsultation: (agronomistId: string, message: string) =>
    request<any>('/advisory/consult', { method: 'POST', body: JSON.stringify({ agronomistId, message }) }),
  getConsultations: () => request<any[]>('/advisory/consultations'),
};

export const marketplaceApi = {
  listProducts: (category?: string, search?: string) => {
    const params = new URLSearchParams();
    if (category && category !== 'All') params.set('category', category);
    if (search) params.set('search', search);
    const qs = params.toString();
    return request<any[]>(`/marketplace/products${qs ? '?' + qs : ''}`);
  },
  getProduct: (id: string) => request<any>(`/marketplace/products/${id}`),
  getCategories: () => request<string[]>('/marketplace/categories'),
  listOrders: () => request<any[]>('/marketplace/orders'),
  createOrder: (data: any) => request<any>('/marketplace/orders', { method: 'POST', body: JSON.stringify(data) }),
};

export const analyticsApi = {
  getCropHealth: () => request<any[]>('/analytics/crop-health'),
  getDiseaseOutbreaks: () => request<any>('/analytics/outbreaks'),
  getDiseaseTrends: () => request<any[]>('/analytics/disease-trends'),
};

export const plannerApi = {
  generate: (data: { crop: string; quantity: string; unit: string; district: string }) =>
    request<any>('/planner/generate', { method: 'POST', body: JSON.stringify(data) }),
  getSaved: () => request<any[]>('/planner/saved'),
  getSavedById: (id: string) => request<any>(`/planner/saved/${id}`),
  deleteSaved: (id: string) => request<void>(`/planner/saved/${id}`, { method: 'DELETE' }),
};

export const marketApi = {
  getPrices: () => request<any>('/market/prices'),
};

export const chatApi = {
  send: (message: string, history: { role: string; content: string }[]) =>
    request<{ reply: string }>('/chat', { method: 'POST', body: JSON.stringify({ message, history }) }),
};

export const transactionsApi = {
  list: () => request<any[]>('/transactions'),
  summary: () => request<any>('/transactions/summary'),
  create: (data: any) => request<any>('/transactions', { method: 'POST', body: JSON.stringify(data) }),
  delete: (id: string) => request<void>(`/transactions/${id}`, { method: 'DELETE' }),
};
