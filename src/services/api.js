import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const reqUrl = String(error?.config?.url || "");
    const onLoginPage = window.location.pathname === "/login";
    const isLoginRequest =
      reqUrl.includes("/auth/login") || reqUrl.includes("/Auth/login");

    if (status === 401 && !isLoginRequest && !onLoginPage) {
      localStorage.removeItem("token");
      window.location.assign("/login");
    }

    return Promise.reject(error);
  }
);

export default api;
