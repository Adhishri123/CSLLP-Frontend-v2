import axiosInstance from "./axiosConfig";
const API_GATEWAY_BASE = process.env.REACT_APP_API_GATEWAY || 'http://localhost:8080';
const API = axiosInstance.create({
  baseURL: `${API_GATEWAY_BASE}/api/employees`,
});

// Always attach fresh credentials from localStorage
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("jwt_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

//  Add response interceptor for handling token expiration
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem("jwt_token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default API;
