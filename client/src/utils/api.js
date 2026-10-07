import axios from 'axios';
import { io } from 'socket.io-client';

// Determine the Backend API URL:
// 1. In production on Vercel: VITE_BACKEND_URL (e.g. 'https://saferoute-api.onrender.com')
// 2. In local development: defaults to '' so Vite proxy forwards '/api' to 'http://localhost:5000'
const BACKEND_URL = (import.meta.env.VITE_BACKEND_URL || '').replace(/\/$/, '');

// Configure default axios base URL
if (BACKEND_URL) {
  axios.defaults.baseURL = BACKEND_URL;
}

// Socket.io singleton connection
export const socket = io(
  BACKEND_URL || (import.meta.env.DEV ? `http://${window.location.hostname}:5000` : undefined),
  {
    autoConnect: true,
    transports: ['websocket', 'polling']
  }
);

// Helper for fetch calls
export const getApiUrl = (endpoint) => {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return BACKEND_URL ? `${BACKEND_URL}${cleanEndpoint}` : cleanEndpoint;
};

export default BACKEND_URL;
