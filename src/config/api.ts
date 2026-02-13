// API configuration for backend endpoints
interface Config {
  apiBaseUrl: string;
  sioUrl: string;
}

export const config: Config = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || '',
  sioUrl: import.meta.env.VITE_SIO_URL || 'http://localhost:8080',
};

/**
 * Get the absolute API URL for a given path
 * @param path - API path (e.g., '/health', '/compacts')
 * @returns Absolute URL (e.g., 'http://localhost:3000/health')
 */
export function getApiUrl(path: string): string {
  const baseUrl = config.apiBaseUrl;
  if (!baseUrl) {
    throw new Error('VITE_API_BASE_URL environment variable is not set');
  }
  // Ensure path starts with /
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  // Remove trailing slash from baseUrl if present
  const normalizedBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  return `${normalizedBaseUrl}${normalizedPath}`;
}
