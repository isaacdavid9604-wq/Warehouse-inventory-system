export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  timestamp?: string;
}

export interface ApiError {
  message: string;
  statusCode?: number;
  details?: Record<string, string>;
  isNetworkError?: boolean;
}

export type ConnectionMode = 'live' | 'demo';
