// src/pages/Dashboard.jsx
import { useState, useEffect } from "react";
import { api } from "../services/api";

const STATUS_COLORS = {
  PENDING:  "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30",
  DEBATING: "bg-blue-500/20   text-blue-400   border border-blue-500/30",
  FINISHED: "bg-green-500/20  text-green-400  border border-green-500/30",
};
const STATUS_LABELS = { PENDING: "En attente", DEBATING: "En cours", FINISHED: "Terminé" };

export default function Dashboard({ navigate }) {
  const [sessions, setSessions] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState("");

  useEffect(() => {
    api.getSessions()
      .then(setSessions)
      .catch(() => setError("Impossible de charger les sessions"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">
            <span className="text-green-400">Agent</span>{" "}
            <span className="text-white">Débat</span>
          </h1>
          <p className="text-gray-400 mt-1 text-sm">
            RH & Stratégie — Aide à la décision par IA contradictoire
          </p>
        </div>
        <button
          onClick={navigate.toNew}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white font-semibold px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-green-900/40"
        >
          <span className="text-xl leading-none">＋</span> Nouveau débat
        </button>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: "Total sessions",  value: sessions.length,                              color: "text-white" },
          { label: "En cours",        value: sessions.filter(s => s.status === "DEBATING").length, color: "text-blue-400" },
          { label: "Terminées",       value: sessions.filter(s => s.status === "FINISHED").length, color: "text-green-400" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-gray-900 border border-gray-800 rounded-xl p-5 text-center">
            <div className={`text-3xl font-bold ${color}`}>{value}</div>
            <div className="text-gray-400 text-sm mt-1">{label}</div>
          </div>
        ))}
      </div>

      {/* Sessions list */}
      {loading && (
        <div className="text-center py-20 text-gray-500">Chargement...</div>
      )}

      {error && (
        <div className="bg-red-900/30 border border-red-700 text-red-400 rounded-xl p-4 text-sm">{error}</div>
      )}

      {!loading && sessions.length === 0 && (
        <div className="text-center py-20">
          <div className="text-5xl mb-4">💬</div>
          <p className="text-gray-400">Aucune session pour l'instant.</p>
          <p className="text-gray-600 text-sm mt-1">Créez votre premier débat !</p>
        </div>
      )}

      <div className="space-y-3">
        {sessions.map((s) => (
          <div
            key={s.id}
            onClick={() => navigate.toDebate(s.id)}
            className="bg-gray-900 border border-gray-800 hover:border-green-700/50 rounded-xl p-5 cursor-pointer transition-all hover:bg-gray-800/80 group"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-green-900/40 text-green-400 border border-green-800">
                    {s.domain}
                  </span>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded ${STATUS_COLORS[s.status]}`}>
                    {STATUS_LABELS[s.status]}
                  </span>
                </div>
                <h3 className="text-white font-semibold text-base group-hover:text-green-300 transition-colors truncate">
                  {s.title}
                </h3>
                <p className="text-gray-500 text-sm mt-0.5 truncate">{s.decision}</p>
              </div>
              <div className="text-gray-600 text-xs whitespace-nowrap pt-1">
                {new Date(s.created_at).toLocaleDateString("fr-FR")}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
