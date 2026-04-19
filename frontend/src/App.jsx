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
    return <div className="min-h-screen grid place-items-center bg-gray-950 text-gray-400">Vérification de session...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white font-sans">
      {page !== "login" && (
        <button
          onClick={navigate.logout}
          className="fixed top-4 right-4 z-50 bg-gray-900 border border-gray-700 hover:border-red-500 hover:text-red-300 px-3 py-1.5 rounded-lg text-xs text-gray-300 transition-colors"
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