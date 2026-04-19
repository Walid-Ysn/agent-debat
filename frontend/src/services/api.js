const BASE = import.meta.env.VITE_API_URL || "http://localhost:8000/api";
const TOKEN_KEY = "agent-debat-token";

function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

async function request(path, options = {}) {
  const token = getToken();
  const hasFormDataBody = options.body instanceof FormData;
  const headers = {
    ...options.headers,
  };

  if (!hasFormDataBody) {
    headers["Content-Type"] = headers["Content-Type"] || "application/json";
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE}${path}`, {
    headers,
    ...options,
  });

  if (res.status === 401) {
    clearToken();
    window.dispatchEvent(new Event("auth:unauthorized"));
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    const error = new Error(err.detail || "Erreur serveur");
    error.status = res.status;
    throw error;
  }

  if (res.status === 204) return null;
  return res.json().catch(() => null);
}

export const api = {
  login: async (username, password) => {
    const data = await request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
    setToken(data.access_token);
    return data;
  },
  me: () => request("/auth/me"),
  isAuthenticated: () => !!getToken(),
  logout: () => clearToken(),
  createSession: (data) => request("/sessions/", { method: "POST", body: JSON.stringify(data) }),
  getSessions: () => request("/sessions/"),
  getSession: (id) => request(`/sessions/${id}`),
  uploadDocument: (sessionId, file) => {
    const form = new FormData();
    form.append("file", file);
    return request(`/sessions/${sessionId}/upload`, {
      method: "POST",
      body: form,
    });
  },
  runRound1: (sessionId) => request(`/debate/${sessionId}/round/1`, { method: "POST" }),
  runRound2: (sessionId) => request(`/debate/${sessionId}/round/2`, { method: "POST" }),
  runArbitre: (sessionId) => request(`/debate/${sessionId}/arbitre`, { method: "POST" }),
  askQuestion: (sessionId, question, agentType) =>
    request(`/debate/${sessionId}/question`, {
      method: "POST",
      body: JSON.stringify({ question, agent_type: agentType }),
    }),
  getArguments: (sessionId) => request(`/debate/${sessionId}/arguments`),
  downloadReport: async (sessionId) => {
    const token = getToken();
    const res = await fetch(`${BASE}/reports/${sessionId}/pdf`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(err.detail || "Impossible de télécharger le rapport");
    }
    const blob = await res.blob();
    return URL.createObjectURL(blob);
  },
};

export function createDebateSocket(sessionId, agentType, { onToken, onDone, onError }) {
  const wsBase = (import.meta.env.VITE_API_URL || "http://localhost:8000/api").replace("http", "ws");
  const token = getToken();
  const ws = new WebSocket(`${wsBase}/debate/${sessionId}/ws/${agentType}?token=${encodeURIComponent(token || "")}`);

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      if (data.error) return onError?.(data.error);
      if (data.done) return onDone?.();
      if (data.token) onToken?.(data.token);
    } catch {
      onError?.("Erreur de parsing WebSocket");
    }
  };

  ws.onerror = () => onError?.("Connexion WebSocket échouée");

  return {
    send: (payload) => ws.send(JSON.stringify(payload)),
    close: () => ws.close(),
  };
}