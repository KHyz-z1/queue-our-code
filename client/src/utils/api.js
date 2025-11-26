// client/src/utils/api.js
import axios from "axios";

// Backend base URL — update if your backend runs on a different port
const API_BASE_URL = "http://localhost:5000/api";

// Create a preconfigured axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
});

// Automatically attach the JWT token if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token"); // token from login/activation
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
