const API_BASE = import.meta.env.DEV
  ? "/api"
  : (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

function clearSession() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  if (window.location.pathname !== "/" && window.location.pathname !== "/register") {
    window.location.assign("/");
  }
}

async function request(path, options = {}) {
  const headers = new Headers(options.headers || {});
  const token = localStorage.getItem("token");
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (options.json !== undefined) headers.set("Content-Type", "application/json");
  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
      body: options.json !== undefined ? JSON.stringify(options.json) : options.body,
    });
  } catch {
    throw new Error("Could not connect to the server. Check that the backend is running.");
  }
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    const rejectedToken = response.status === 401 || (response.status === 422 && typeof data.msg === "string");
    if (rejectedToken && path !== "/login") {
      clearSession();
      throw new Error("Your session expired or is invalid. Please sign in again.");
    }
    throw new Error(data.message || data.msg || `Request failed (${response.status}).`);
  }
  return response;
}

export const api = {
  async login(email, password) {
    const response = await request("/login", { method: "POST", json: { email, password } });
    return response.json();
  },
  async register(username, email, password) {
    const response = await request("/register", { method: "POST", json: { username, email, password } });
    return response.json();
  },
  async documents() { return (await request("/documents")).json(); },
  async upload(file) {
    const body = new FormData();
    body.append("file", file);
    return (await request("/upload", { method: "POST", body })).json();
  },
  async removeDocument(name) {
    return (await request(`/documents/${encodeURIComponent(name)}`, { method: "DELETE" })).json();
  },
  async ask(name, question) {
    const params = new URLSearchParams({ question });
    return (await request(`/ask/${encodeURIComponent(name)}?${params}`)).json();
  },
  async chatHistory() { return (await request("/chat-history")).json(); },
  async generate(payload) {
    return (await request("/generate", { method: "POST", json: payload })).json();
  },
  async exportDocument(payload) {
    return (await request("/export", { method: "POST", json: payload })).blob();
  },
};

export function signOut() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}
