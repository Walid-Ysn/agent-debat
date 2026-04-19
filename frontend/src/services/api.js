const BASE = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || "Erreur serveur");
  }
  return res.json();
}

export const api = {
  createSession: (data) => request("/sessions/", { method: "POST", body: JSON.stringify(data) }),
  getSessions: () => request("/sessions/"),
  getSession: (id) => request(`/sessions/${id}`),
  uploadDocument: (sessionId, file) => {
    const form = new FormData();
    form.append("file", file);
    return fetch(`${BASE}/sessions/${sessionId}/upload`, {
      method: "POST",
      body: form,
    }).then((r) => r.json());
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
  downloadReport: (sessionId) => `${BASE}/reports/${sessionId}/pdf`,
};

export function createDebateSocket(sessionId, agentType, { onToken, onDone, onError }) {
  const wsBase = (import.meta.env.VITE_API_URL || "http://localhost:8000/api").replace("http", "ws");
  const ws = new WebSocket(`${wsBase}/debate/${sessionId}/ws/${agentType}`);

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