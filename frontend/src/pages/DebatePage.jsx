import { useState, useEffect } from "react";
import { api } from "../services/api";
import AgentPanel from "../components/debate/AgentPanel";
import QuestionBox from "../components/debate/QuestionBox";

const STEPS = [
  { key: "idle", label: "Prêt", desc: "Lancer le Round 1 pour démarrer" },
  { key: "round1", label: "Round 1", desc: "Génération indépendante des arguments" },
  { key: "round2", label: "Round 2", desc: "Réfutations croisées" },
  { key: "questions", label: "Questions", desc: "Posez vos questions aux agents" },
  { key: "arbitre", label: "Verdict", desc: "L'Agent Arbitre recommande" },
  { key: "done", label: "Terminé", desc: "Rapport disponible" },
];

export default function DebatePage({ sessionId, navigate }) {
  const [session, setSession] = useState(null);
  const [arguments_, setArguments] = useState([]);
  const [step, setStep] = useState("idle");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleDownloadReport = async () => {
    try {
      const fileUrl = await api.downloadReport(sessionId);
      window.open(fileUrl, "_blank", "noopener,noreferrer");
    } catch (e) {
      setError(e.message || "Impossible de télécharger le rapport");
    }
  };

  useEffect(() => {
    api.getSession(sessionId).then(setSession).catch(() => setError("Session introuvable"));
    api.getArguments(sessionId).then((args) => {
      setArguments(args);
      if (args.some((a) => a.agent_type === "ARBITRE")) setStep("done");
      else if (args.some((a) => a.round_number === 2)) setStep("questions");
      else if (args.some((a) => a.round_number === 1)) setStep("round2");
    });
  }, [sessionId]);

  const runRound1 = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.runRound1(sessionId);
      setArguments((prev) => [
        ...prev,
        { agent_type: "POUR", round_number: 1, content: res.pour, id: Date.now() },
        { agent_type: "CONTRE", round_number: 1, content: res.contre, id: Date.now() + 1 },
      ]);
      setStep("round2");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const runRound2 = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.runRound2(sessionId);
      setArguments((prev) => [
        ...prev,
        { agent_type: "POUR", round_number: 2, content: res.pour, id: Date.now() },
        { agent_type: "CONTRE", round_number: 2, content: res.contre, id: Date.now() + 1 },
      ]);
      setStep("questions");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const runArbitre = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.runArbitre(sessionId);
      setArguments((prev) => [...prev, { agent_type: "ARBITRE", round_number: 99, content: res.verdict, id: Date.now() }]);
      setStep("done");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleQuestion = async (question, agentType) => {
    try {
      const res = await api.askQuestion(sessionId, question, agentType);
      setArguments((prev) => [
        ...prev,
        {
          agent_type: agentType,
          round_number: 50,
          content: `❓ **Question :** ${question}\n\n**Réponse :** ${res.answer}`,
          id: Date.now(),
        },
      ]);
    } catch (e) {
      setError(e.message);
    }
  };

  const currentStepIdx = STEPS.findIndex((s) => s.key === step);
  const pourArgs = arguments_.filter((a) => a.agent_type === "POUR");
  const contreArgs = arguments_.filter((a) => a.agent_type === "CONTRE");
  const arbitre = arguments_.find((a) => a.agent_type === "ARBITRE");

  if (!session) {
    return <div className="flex items-center justify-center min-h-screen text-gray-500">{error || "Chargement..."}</div>;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <button onClick={navigate.toDashboard} className="text-gray-400 hover:text-white text-sm transition-colors">
          ← Tableau de bord
        </button>
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold px-2 py-1 rounded bg-green-900/40 text-green-400 border border-green-800">{session.domain}</span>
          {step === "done" && (
            <button
              onClick={handleDownloadReport}
              className="bg-green-700 hover:bg-green-600 text-white text-xs font-bold px-4 py-2 rounded-lg transition-all"
            >
              📥 Télécharger rapport PDF
            </button>
          )}
        </div>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">{session.title}</h1>
        <p className="text-gray-400 text-sm mt-1 max-w-3xl">{session.decision}</p>
      </div>

      <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2">
        {STEPS.map((s, i) => (
          <div key={s.key} className="flex items-center gap-2 flex-shrink-0">
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                i < currentStepIdx
                  ? "bg-green-900/40 text-green-400 border border-green-800"
                  : i === currentStepIdx
                    ? "bg-green-600 text-white shadow shadow-green-900/50"
                    : "bg-gray-900 text-gray-600 border border-gray-800"
              }`}
            >
              {i < currentStepIdx && <span>✓</span>}
              {s.label}
            </div>
            {i < STEPS.length - 1 && <div className="w-4 h-px bg-gray-700 flex-shrink-0" />}
          </div>
        ))}
      </div>

      {error && <div className="bg-red-900/30 border border-red-700 text-red-400 rounded-xl p-4 text-sm mb-6">{error}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <AgentPanel type="POUR" arguments={pourArgs} loading={loading && step === "idle"} />
        <AgentPanel type="CONTRE" arguments={contreArgs} loading={loading && step === "idle"} />
      </div>

      {arbitre && (
        <div className="bg-blue-950/50 border border-blue-800/50 rounded-2xl p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-blue-700 flex items-center justify-center text-sm">⚖️</div>
            <h3 className="text-blue-300 font-bold">Verdict — Agent Arbitre</h3>
          </div>
          <div className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">{arbitre.content}</div>
        </div>
      )}

      {(step === "questions" || step === "done") && <QuestionBox onAsk={handleQuestion} disabled={step === "done"} />}

      <div className="flex justify-center gap-4 mt-6">
        {step === "idle" && (
          <button
            onClick={runRound1}
            disabled={loading}
            className="bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-bold px-8 py-3 rounded-xl transition-all shadow-lg shadow-green-900/40"
          >
            {loading ? "Génération en cours..." : "▶ Lancer le Round 1"}
          </button>
        )}
        {step === "round2" && (
          <button
            onClick={runRound2}
            disabled={loading}
            className="bg-yellow-600 hover:bg-yellow-500 disabled:opacity-50 text-white font-bold px-8 py-3 rounded-xl transition-all"
          >
            {loading ? "Réfutations en cours..." : "⚔️ Lancer le Round 2 — Réfutations"}
          </button>
        )}
        {step === "questions" && (
          <button
            onClick={runArbitre}
            disabled={loading}
            className="bg-blue-700 hover:bg-blue-600 disabled:opacity-50 text-white font-bold px-8 py-3 rounded-xl transition-all"
          >
            {loading ? "Analyse en cours..." : "⚖️ Demander le verdict de l'Arbitre"}
          </button>
        )}
      </div>
    </div>
  );
}