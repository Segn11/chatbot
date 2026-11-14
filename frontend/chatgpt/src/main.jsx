import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.jsx";
import { ThemeProvider } from "./context/ThemeContext.jsx";
import { Toaster } from "react-hot-toast";
import axios from "axios";

// Dynamically match frontend host (e.g. 127.0.0.1 or localhost or custom domain)
const getApiBaseUrl = () => {
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  const hostname =
    typeof window !== "undefined" && window.location.hostname
      ? window.location.hostname
      : "localhost";
  return `http://${hostname}:5000/api/v1`;
};

axios.defaults.baseURL = getApiBaseUrl();
axios.defaults.withCredentials = true;

// Attach Bearer token to all outgoing requests from localStorage
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("chatbot_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to clear stale token on 401
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const msg = error.response?.data?.message || "";
      if (typeof msg === "string" && msg.toLowerCase().includes("token")) {
        localStorage.removeItem("chatbot_token");
      }
    }
    return Promise.reject(error);
  }
);

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Toaster
            position="top-right"
            toastOptions={{
              className: "dark:bg-zinc-800 dark:text-zinc-100 dark:border-zinc-700",
            }}
          />
          <App />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  </StrictMode>
);
