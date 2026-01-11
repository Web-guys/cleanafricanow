/**
 * Backend Adapter - Switch between Supabase (Lovable Cloud) and MySQL/PHP
 * Set VITE_BACKEND_TYPE=mysql in .env to use MySQL backend
 */

const BACKEND_TYPE = import.meta.env.VITE_BACKEND_TYPE || 'supabase';
const API_URL = import.meta.env.VITE_API_URL || '';

interface AuthResponse {
  user: any;
  access_token?: string;
  token_type?: string;
  expires_in?: number;
}

// Token storage for MySQL backend
const TOKEN_KEY = 'auth_token';

export const getStoredToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

export const setStoredToken = (token: string): void => {
  localStorage.setItem(TOKEN_KEY, token);
};

export const clearStoredToken = (): void => {
  localStorage.removeItem(TOKEN_KEY);
};

// API request helper for MySQL backend
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getStoredToken();
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || 'Request failed');
  }
  
  return data;
}

// Backend adapter interface
export const backendAdapter = {
  isMySQL: () => BACKEND_TYPE === 'mysql',
  
  // Auth methods for MySQL
  auth: {
    async signUp(email: string, password: string, fullName: string): Promise<AuthResponse> {
      const response = await apiRequest<AuthResponse>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password, full_name: fullName }),
      });
      if (response.access_token) {
        setStoredToken(response.access_token);
      }
      return response;
    },
    
    async signIn(email: string, password: string): Promise<AuthResponse> {
      const response = await apiRequest<AuthResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      if (response.access_token) {
        setStoredToken(response.access_token);
      }
      return response;
    },
    
    async signOut(): Promise<void> {
      await apiRequest('/auth/logout', { method: 'POST' });
      clearStoredToken();
    },
    
    async getUser(): Promise<any> {
      const response = await apiRequest<{ user: any }>('/auth/me');
      return response.user;
    },
  },
  
  // Reports methods for MySQL
  reports: {
    async getAll(filters?: Record<string, any>): Promise<any[]> {
      const params = new URLSearchParams(filters).toString();
      const response = await apiRequest<{ data: any[] }>(`/reports?${params}`);
      return response.data;
    },
    
    async getById(id: string): Promise<any> {
      return apiRequest(`/reports/${id}`);
    },
    
    async create(data: any): Promise<any> {
      return apiRequest('/reports', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    
    async update(id: string, data: any): Promise<any> {
      return apiRequest(`/reports/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },
    
    async delete(id: string): Promise<void> {
      await apiRequest(`/reports/${id}`, { method: 'DELETE' });
    },
    
    async getStats(filters?: Record<string, any>): Promise<any> {
      const params = new URLSearchParams(filters).toString();
      return apiRequest(`/reports/stats?${params}`);
    },
  },
  
  // Cities methods for MySQL
  cities: {
    async getAll(): Promise<any[]> {
      return apiRequest('/cities');
    },
    
    async getById(id: string): Promise<any> {
      return apiRequest(`/cities/${id}`);
    },
  },
  
  // Users methods for MySQL
  users: {
    async getLeaderboard(limit = 50): Promise<any[]> {
      return apiRequest(`/users/leaderboard?limit=${limit}`);
    },
    
    async getPublicProfile(id: string): Promise<any> {
      return apiRequest(`/users/${id}/public`);
    },
  },
  
  // File upload for MySQL
  upload: {
    async uploadFile(file: File): Promise<{ url: string }> {
      const formData = new FormData();
      formData.append('file', file);
      
      const token = getStoredToken();
      const response = await fetch(`${API_URL}/upload`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      return data;
    },
  },
};

export default backendAdapter;
