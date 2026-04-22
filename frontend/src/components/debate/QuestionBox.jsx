import { useState } from "react";

export default function QuestionBox({ onAsk, disabled }) {
  const [question, setQuestion] = useState("");
  const [agentType, setAgentType] = useState("POUR");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!question.trim() || loading) return;
    setLoading(true);
    await onAsk(question.trim(), agentType);
    setQuestion("");
    setLoading(false);
  };

  return (
    <div className="glass-panel p-5">
      <h3 className="text-slate-100 font-semibold text-sm mb-4 flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-2">
          <span className="text-cyan-200">◉</span>
          Poser une question aux agents
        </span>
        <span className="thinking-dots inline-flex gap-1 text-cyan-300">
          <span />
          <span />
          <span />
        </span>
      </h3>

      <div className="flex gap-3 mb-4">
        {[
          { type: "POUR", label: "Agent POUR", active: "bg-green-700 text-white border-green-600", inactive: "border-gray-700 text-gray-400" },
          { type: "CONTRE", label: "Agent CONTRE", active: "bg-red-800 text-white border-red-700", inactive: "border-gray-700 text-gray-400" },
        ].map(({ type, label, active, inactive }) => (
          <button
            key={type}
            onClick={() => setAgentType(type)}
            disabled={disabled}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold border transition-all disabled:opacity-40 ${
              agentType === type
                ? type === "POUR"
                  ? "bg-emerald-400/15 text-emerald-100 border-emerald-300/60"
                  : "bg-violet-400/15 text-violet-100 border-violet-300/60"
                : "border-indigo-200/30 text-slate-400"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex gap-3">
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          disabled={disabled || loading}
          placeholder={disabled ? "Session terminée" : "Votre question..."}
          className="input-future flex-1 text-sm disabled:opacity-40"
        />
        <button
          onClick={handleSubmit}
          disabled={disabled || loading || !question.trim()}
          className="enterprise-button px-5 py-2.5 text-sm disabled:opacity-40"
        >
          {loading ? "..." : "Envoyer"}
        </button>
      </div>
    </div>
  );
}