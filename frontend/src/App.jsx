import { useEffect, useState } from "react";
import Dashboard from "./pages/Dashboard";
import NewSession from "./pages/NewSession";
import DebatePage from "./pages/DebatePage";
import Login from "./pages/Login";
import { api } from "./services/api";

export default function App() {
  const [page, setPage] = useState(api.isAuthenticated() ? "dashboard" : "login");
  const [sessionId, setSessionId] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(api.isAuthenticated());

  useEffect(() => {
    if (!api.isAuthenticated()) return;

    api
      .me()
      .then(() => setPage("dashboard"))
      .catch(() => {
        api.logout();
        setPage("login");
      })
      .finally(() => setCheckingAuth(false));
  }, []);

  useEffect(() => {
    const handler = () => setPage("login");
    window.addEventListener("auth:unauthorized", handler);
    return () => window.removeEventListener("auth:unauthorized", handler);
  }, []);

  const navigate = {
    toDashboard: () => setPage("dashboard"),
    toNew: () => setPage("new"),
    toLogin: () => setPage("login"),
    logout: () => {
      api.logout();
      setSessionId(null);
      setPage("login");
    },
    toDebate: (id) => {
      setSessionId(id);
      setPage("debate");
    },
  };

  if (checkingAuth) {
    return (
      <div className="app-shell min-h-screen grid place-items-center px-4">
        <div className="glass-panel--strong px-8 py-6 text-center">
          <p className="section-kicker mb-2">Secure Access</p>
          <p className="text-slate-200 font-semibold">Vérification de session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <div className="pointer-events-none fixed inset-0 hud-grid" />
      {page !== "login" && (
        <button
          onClick={navigate.logout}
          className="fixed top-4 right-4 z-50 ghost-button px-3.5 py-2 text-xs font-semibold"
        >
          Déconnexion
        </button>
      )}
      {page === "login" && <Login onLogin={navigate.toDashboard} />}
      {page === "dashboard" && <Dashboard navigate={navigate} />}
      {page === "new" && <NewSession navigate={navigate} />}
      {page === "debate" && <DebatePage sessionId={sessionId} navigate={navigate} />}
    </div>
  );
}