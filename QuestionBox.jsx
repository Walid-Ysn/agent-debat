// src/components/debate/QuestionBox.jsx
import { useState } from "react";

export default function QuestionBox({ onAsk, disabled }) {
  const [question,  setQuestion]  = useState("");
  const [agentType, setAgentType] = useState("POUR");
  const [loading,   setLoading]   = useState(false);

  const handleSubmit = async () => {
    if (!question.trim() || loading) return;
    setLoading(true);
    await onAsk(question.trim(), agentType);
    setQuestion("");
    setLoading(false);
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5">
      <h3 className="text-white font-semibold text-sm mb-4 flex items-center gap-2">
        <span>💬</span> Poser une question aux agents
      </h3>

      {/* Agent selector */}
      <div className="flex gap-3 mb-4">
        {[
          { type: "POUR",   label: "Agent POUR",   active: "bg-green-700 text-white border-green-600", inactive: "border-gray-700 text-gray-400" },
          { type: "CONTRE", label: "Agent CONTRE",  active: "bg-red-800 text-white border-red-700",    inactive: "border-gray-700 text-gray-400" },
        ].map(({ type, label, active, inactive }) => (
          <button
            key={type}
            onClick={() => setAgentType(type)}
            disabled={disabled}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold border transition-all disabled:opacity-40 ${
              agentType === type ? active : inactive
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="flex gap-3">
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          disabled={disabled || loading}
          placeholder={disabled ? "Session terminée" : "Votre question..."}
          className="flex-1 bg-gray-800 border border-gray-700 focus:border-green-500 rounded-xl px-4 py-2.5 text-white placeholder-gray-600 outline-none transition-colors text-sm disabled:opacity-40"
        />
        <button
          onClick={handleSubmit}
          disabled={disabled || loading || !question.trim()}
          className="bg-green-700 hover:bg-green-600 disabled:opacity-40 text-white font-bold px-5 py-2.5 rounded-xl transition-all text-sm"
        >
          {loading ? "..." : "Envoyer"}
        </button>
      </div>
    </div>
  );
}
