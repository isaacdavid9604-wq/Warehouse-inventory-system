import { ApiError } from '../types/api';

const DEFAULT_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

export class ApiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = localStorage.getItem('wms_custom_api_url') || DEFAULT_BASE_URL;
  }

  public getBaseUrl(): string {
    return this.baseUrl;
  }

  public setBaseUrl(url: string) {
    this.baseUrl = url.trim().replace(/\/+$/, '');
    localStorage.setItem('wms_custom_api_url', this.baseUrl);
  }

  public resetBaseUrl() {
    this.baseUrl = DEFAULT_BASE_URL;
    localStorage.removeItem('wms_custom_api_url');
  }

  public async checkHealth(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      const res = await fetch(`${this.baseUrl}/products`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return res.ok || res.status === 404; // backend is responding
    } catch {
      return false;
    }
  }

  public async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeout);

      const contentType = response.headers.get('content-type');
      let data: any = null;

      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        data = text ? { message: text } : null;
      }

      if (!response.ok) {
        const error: ApiError = {
          message: data?.message || data?.error || `Request failed with status ${response.status}`,
          statusCode: response.status,
          details: data?.details || data?.errors,
        };
        throw error;
      }

      return data as T;
    } catch (err: any) {
      clearTimeout(timeout);
      if (err.statusCode) {
        throw err;
      }

      const isTimeout = err.name === 'AbortError';
      const apiErr: ApiError = {
        message: isTimeout 
          ? 'Request timed out. Please check backend connection.' 
          : 'Unable to connect to backend server (Network Error).',
        isNetworkError: true,
      };
      throw apiErr;
    }
  }
}

export const apiClient = new ApiClient();
