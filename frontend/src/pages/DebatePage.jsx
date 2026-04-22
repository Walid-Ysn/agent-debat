import { useState, useEffect } from "react";
import { api } from "../services/api";
import AgentPanel from "../components/debate/AgentPanel";
import QuestionBox from "../components/debate/QuestionBox";
import Mechanism3D from "../components/debate/Mechanism3D";

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
    return <div className="flex items-center justify-center min-h-screen text-slate-400">{error || "Chargement..."}</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-7 md:py-9">
      <div className="glass-panel--strong p-5 md:p-6 mb-5 stagger-entry">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <button onClick={navigate.toDashboard} className="ghost-button px-3.5 py-2 text-sm">
          ← Tableau de bord
          </button>
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-400/15 text-indigo-200 border border-indigo-300/30">{session.domain}</span>
          {step === "done" && (
            <button
              onClick={handleDownloadReport}
              className="enterprise-button text-xs"
            >
              Télécharger rapport PDF
            </button>
          )}
          </div>
        </div>

        <div>
          <p className="section-kicker mb-1">Debate Workspace</p>
          <h1 className="title-fusion text-2xl md:text-3xl font-bold text-slate-100">{session.title}</h1>
          <p className="text-slate-300 text-sm mt-2 max-w-3xl">{session.decision}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-5 overflow-x-auto pb-2">
        {STEPS.map((s, i) => (
          <div key={s.key} className="flex items-center gap-2 flex-shrink-0">
            <div
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                i < currentStepIdx
                  ? "bg-emerald-400/15 text-emerald-200 border-emerald-300/30"
                  : i === currentStepIdx
                    ? "bg-cyan-400/20 text-cyan-100 border-cyan-300/60 shadow-[0_0_22px_rgba(45,228,255,0.25)]"
                    : "bg-slate-950/60 text-slate-500 border-indigo-200/20"
              }`}
            >
              {i < currentStepIdx && <span>✓</span>}
              {s.label}
            </div>
            {i < STEPS.length - 1 && <div className="w-4 h-px bg-indigo-200/30 flex-shrink-0" />}
          </div>
        ))}
      </div>
      <p className="text-xs text-slate-400 mb-6">{STEPS[currentStepIdx]?.desc}</p>

      {error && <div className="rounded-xl border border-rose-400/40 bg-rose-400/10 text-rose-200 p-4 text-sm mb-6">{error}</div>}

      <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] gap-4 mb-5">
        <Mechanism3D stage={step} />

        <section className="glass-panel p-5 md:p-6">
          <p className="section-kicker mb-1">Strategy Simulation</p>
          <h3 className="section-heading text-lg mb-4">Adaptive Decision Tree</h3>
          <div className="space-y-3">
            {[
              { name: "Economic Efficiency", score: 81, detail: "Budget coherence and ROI outlook" },
              { name: "Talent Risk", score: 64, detail: "Capability gaps and retention pressure" },
              { name: "Execution Speed", score: 74, detail: "Time-to-impact under current constraints" },
            ].map((node) => (
              <div key={node.name} className="neo-tile p-3.5">
                <div className="flex justify-between text-xs text-slate-300 mb-1.5">
                  <span>{node.name}</span>
                  <span>{node.score}%</span>
                </div>
                <div className="h-2 rounded-full bg-slate-950 overflow-hidden mb-2">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-indigo-300 via-cyan-300 to-violet-300 data-flow"
                    style={{ width: `${node.score}%` }}
                  />
                </div>
                <p className="text-[11px] text-slate-400">{node.detail}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-center justify-between text-xs text-slate-300">
            <span className="inline-flex items-center gap-2">
              <span className="pulse-dot text-cyan-300 bg-cyan-300" />
              AI thinking loop active
            </span>
            <span className="thinking-dots inline-flex gap-1 text-cyan-300">
              <span />
              <span />
              <span />
            </span>
          </div>
        </section>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-5">
        <AgentPanel type="POUR" arguments={pourArgs} loading={loading && step === "idle"} />
        <AgentPanel type="CONTRE" arguments={contreArgs} loading={loading && step === "idle"} />
      </div>

      {arbitre && (
        <div className="glass-panel p-6 mb-5 border-cyan-300/30">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-cyan-500/20 border border-cyan-300/50 text-cyan-200 flex items-center justify-center text-sm">⚖</div>
            <h3 className="text-cyan-200 font-bold">Verdict — Agent Arbitre</h3>
          </div>
          <div className="text-slate-200 text-sm leading-relaxed whitespace-pre-wrap">{arbitre.content}</div>
        </div>
      )}

      {(step === "questions" || step === "done") && <QuestionBox onAsk={handleQuestion} disabled={step === "done"} />}

      <div className="flex justify-center gap-4 mt-6">
        {step === "idle" && (
          <button
            onClick={runRound1}
            disabled={loading}
            className="enterprise-button px-8 py-3"
          >
            {loading ? "Génération en cours..." : "Lancer le Round 1"}
          </button>
        )}
        {step === "round2" && (
          <button
            onClick={runRound2}
            disabled={loading}
            className="enterprise-button px-8 py-3"
          >
            {loading ? "Réfutations en cours..." : "Lancer le Round 2 — Réfutations"}
          </button>
        )}
        {step === "questions" && (
          <button
            onClick={runArbitre}
            disabled={loading}
            className="enterprise-button px-8 py-3"
          >
            {loading ? "Analyse en cours..." : "Demander le verdict de l'Arbitre"}
          </button>
        )}
      </div>
    </div>
  );
}