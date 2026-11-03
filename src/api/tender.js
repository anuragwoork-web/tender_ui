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

// Tender ids can contain "/" (GeM: GEM/2026/B/1234567); each path segment is
// encoded on its own so the slashes stay real path separators.
const encodeId = (id) => String(id).split("/").map(encodeURIComponent).join("/");

export const tenderApi = {
  // Collector v1 (tc_* tables — SQLite now, MySQL later via DB_URL on the backend)
  getStats:      ()              => apiClient.get("/v1/stats"),
  listTenders:   (params)        => apiClient.get("/v1/tenders", { params }),
  getTender:     (portal, id)    => apiClient.get(`/v1/tenders/${portal}/${encodeId(id)}`),
  getTenderEvents: (portal, id)  => apiClient.get(`/v1/tenders/${portal}/${encodeId(id)}/events`),
  getFacets:     (portal)        => apiClient.get("/v1/facets", { params: portal ? { portal } : {} }),
  listPortals:   (runs = 10)     => apiClient.get("/v1/portals", { params: { runs } }),
  getSweeps:     (params)        => apiClient.get("/v1/sweeps", { params }),
  getChanges:    (params)        => apiClient.get("/v1/changes", { params }),
  // One-click diagnostics zip (counts, sweeps, field completeness, log tails; no secrets)
  downloadReport: () => apiClient.get("/v1/report", { responseType: "blob", timeout: 120000, transformResponse: (d) => d }),

  // Scheduler + manual runs (python main.py <portal> in the background)
  getStatus:     ()              => apiClient.get("/status"),
  triggerScrape: (portal)        => apiClient.post(`/trigger/${portal}`),

  // Proxy toggle (default OFF)
  getProxy:      ()              => apiClient.get("/proxy"),
  setProxy:      (enabled)       => apiClient.post("/proxy", null, { params: { enabled } }),

  // IREPS login (daily OTP; Playwright on the backend — 30-60 s)
  irepsStatus:   ()              => apiClient.get("/ireps/status"),
  irepsSendOtp:  ()              => apiClient.post("/ireps/send-otp", {}, { timeout: 90000 }),
  irepsLogin:    (otp)           => apiClient.post("/ireps/login", { otp }, { timeout: 90000 }),
};

export default apiClient;
