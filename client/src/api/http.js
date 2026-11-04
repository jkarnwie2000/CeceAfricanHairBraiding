import axios from 'axios';

/**
 * Shared axios instance. In development Vite proxies /api → the Express server,
 * so the httpOnly auth cookie is same-origin. In production, Express serves the
 * built client, or set VITE_API_URL if the API lives on another domain.
 */
export const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,
  timeout: 20000,
  headers: { 'Content-Type': 'application/json' },
});

/** Human-friendly message from any API / network error. */
export function getErrorMessage(err, fallback = 'Something went wrong. Please try again.') {
  if (axios.isCancel?.(err) || err?.name === 'CanceledError') return null;
  if (err?.response?.data?.message) return err.response.data.message;
  if (err?.code === 'ECONNABORTED') return 'The request timed out. Please check your connection and try again.';
  if (err?.request && !err?.response) return 'We could not reach the server. Please check your connection and try again.';
  return err?.message || fallback;
}

export const getErrorDetails = (err) => err?.response?.data?.details || [];
export const getStatus = (err) => err?.response?.status;
