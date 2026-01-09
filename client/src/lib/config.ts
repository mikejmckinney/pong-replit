/**
 * API Configuration
 * 
 * Configure the backend API URL based on environment.
 * 
 * For Render backend deployment:
 * 1. Set VITE_API_URL environment variable in Vercel to your Render backend URL
 * 2. Example: https://neon-pong-backend.onrender.com
 * 
 * For local development:
 * - Defaults to empty string (same origin)
 */

export const API_URL = import.meta.env.VITE_API_URL || '';

/**
 * WebSocket URL configuration
 * 
 * For Render backend deployment:
 * 1. Set VITE_WS_URL environment variable in Vercel to your Render backend WebSocket URL
 * 2. Example: wss://neon-pong-backend.onrender.com
 * 
 * For local development:
 * - Automatically determined from window.location
 */
function getDefaultWsUrl(): string {
  // Check if running in browser environment
  if (typeof window === 'undefined') {
    return '';
  }
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${window.location.host}`;
}

export const WS_URL = import.meta.env.VITE_WS_URL || getDefaultWsUrl();

/**
 * Helper to get full API URL
 */
export function getApiUrl(path: string): string {
  return `${API_URL}${path}`;
}

/**
 * Helper to get WebSocket URL
 */
export function getWsUrl(path: string = '/ws'): string {
  return `${WS_URL}${path}`;
}
