// src/App.jsx
import { useState } from "react";
import Dashboard from "./pages/Dashboard";
import NewSession from "./pages/NewSession";
import DebatePage from "./pages/DebatePage";

export default function App() {
  const [page, setPage]         = useState("dashboard");   // dashboard | new | debate
  const [sessionId, setSessionId] = useState(null);

  const navigate = {
    toDashboard: ()    => setPage("dashboard"),
    toNew:       ()    => setPage("new"),
    toDebate:    (id)  => { setSessionId(id); setPage("debate"); },
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white font-sans">
      {page === "dashboard" && <Dashboard navigate={navigate} />}
      {page === "new"       && <NewSession navigate={navigate} />}
      {page === "debate"    && <DebatePage sessionId={sessionId} navigate={navigate} />}
    </div>
  );
}
