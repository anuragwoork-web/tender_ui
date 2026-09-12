import axios from "axios";

// The backend address lives in one place: VITE_API_URL, set per environment in
// .env (local) and .env.production (deployed). Vite picks the right file for
// the command being run, so a build never has to be switched over by hand.
//
// A full URL rather than a port, because the two deployments have different
// shapes — https://api.example.com has no port, http://10.0.0.5:8003 does —
// and one variable covers both.
//
// The fallback only matters when VITE_API_URL is missing: it assumes the API is
// on the same host the page came from, which is what a LAN demo looks like.
// VITE_API_PORT exists so that guess is not a number buried in this file.
const FALLBACK_PORT = import.meta.env.VITE_API_PORT || "8003";

function resolveBaseURL() {
  const configured = import.meta.env.VITE_API_URL;
  if (configured) return configured.replace(/\/+$/, "");

  if (typeof window !== "undefined") {
    return `${window.location.protocol}//${window.location.hostname}:${FALLBACK_PORT}`;
  }
  return `http://localhost:${FALLBACK_PORT}`;
}

const apiClient = axios.create({
  baseURL: resolveBaseURL(),
  timeout: 30000,
  headers: { "Content-Type": "application/json" },
});

// Response interceptor — uniform error handling
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message =
      error.response?.data?.detail || error.message || "Network error";
    return Promise.reject({ message, status: error.response?.status });
  }
);

export const tenderApi = {
  // Dashboard
  getStats:    ()      => apiClient.get("/stats"),
  getStatus:   ()      => apiClient.get("/status"),

  // Tenders
  listTenders: (params) => apiClient.get("/tenders", { params }),
  getTender:   (id)    => apiClient.get(`/tenders/${id}`),

  // Portals
  listPortals: ()      => apiClient.get("/portals"),
  triggerScrape: (portal) => apiClient.post(`/trigger/${portal}`),

  // Proxy toggle (proxy pool kharab ho tab OFF karke direct IP se test/scrape)
  getProxy:    ()        => apiClient.get("/proxy"),
  setProxy:    (enabled) => apiClient.post("/proxy", null, { params: { enabled } }),

  // eProcure detail-mode toggle (OFF = sirf listing data, ON = detail page + CAPTCHA se full detail)
  getDetailMode: ()        => apiClient.get("/detail-mode"),
  setDetailMode: (enabled) => apiClient.post("/detail-mode", null, { params: { enabled } }),

  // Logs
  getLogs:     (limit = 20) => apiClient.get("/logs", { params: { limit } }),

  // IREPS Login (Playwright use karta hai — 30-60s lag sakte hain, timeout badha diya)
  irepsStatus:  ()       => apiClient.get("/ireps/status"),
  irepsSendOtp: ()       => apiClient.post("/ireps/send-otp", {}, { timeout: 90000 }),
  irepsLogin:   (otp)    => apiClient.post("/ireps/login", { otp }, { timeout: 90000 }),
};

export default apiClient;
