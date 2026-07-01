import axios from "axios";
const API_GATEWAY_BASE = process.env.REACT_APP_API_GATEWAY || 'http://localhost:8080';
const axiosInstance = axios.create({
  timeout: 10000,
  baseURL: "${API_GATEWAY_BASE}"
});

// Request Interceptor - Adds JWT token automatically
axiosInstance.interceptors.request.use(
  (config) => {
    // ✅ Check both possible token keys (jwt_token and token)
    let token = localStorage.getItem("jwt_token");
    
    // Fallback to "token" key if "jwt_token" doesn't exist
    if (!token) {
      token = localStorage.getItem("token");
      if (token) {
        console.log("🔄 Found token using 'token' key, migrating to 'jwt_token'");
        // Optional: Migrate to standard key
        localStorage.setItem("jwt_token", token);
      }
    }
    
    console.log("🔑 Token from localStorage:", token ? "✅ Present" : "❌ MISSING");
    if (token) {
      console.log("🔑 Token preview:", token.substring(0, 20) + "...");
      config.headers.Authorization = `Bearer ${token}`;
      console.log("✅ Authorization header set");
    } else {
      console.warn("⚠️ No token found in localStorage! Keys checked: 'jwt_token', 'token'");
    }
    
    console.log("📡 Request:", config.method?.toUpperCase(), config.url);
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor
axiosInstance.interceptors.response.use(
  (response) => {
    console.log("✅ Response success:", response.config.url, response.status);
    return response;
  },
  (error) => {
    console.error("❌ Response error:", error.response?.status, error.response?.config?.url);
    console.error("❌ Error details:", error.response?.data);
    
    if (error.response?.status === 401) {
      console.warn("⚠️ Unauthorized - Redirecting to login");
      localStorage.removeItem("jwt_token");
      localStorage.removeItem("token"); // Also remove the old key
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    
    if (error.response?.status === 403) {
      console.error("🚫 Access forbidden. Token might be invalid or expired.");
      console.error("🚫 Response data:", error.response?.data);
      
      // Optional: Show user-friendly message
      // You can trigger a toast notification here if you have one
    }
    
    return Promise.reject(error);
  }
);

export default axiosInstance;