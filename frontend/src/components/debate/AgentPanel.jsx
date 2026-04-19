const TYPE_CONFIG = {
  POUR: {
    label: "Agent POUR",
    emoji: "✅",
    bg: "bg-green-950/40",
    border: "border-green-800/50",
    header: "bg-green-900/50",
    text: "text-green-300",
    dot: "bg-green-400",
    roundLabel: "bg-green-900/60 text-green-400 border-green-800",
  },
  CONTRE: {
    label: "Agent CONTRE",
    emoji: "❌",
    bg: "bg-red-950/30",
    border: "border-red-800/40",
    header: "bg-red-900/40",
    text: "text-red-300",
    dot: "bg-red-400",
    roundLabel: "bg-red-900/60 text-red-400 border-red-800",
  },
};

const ROUND_LABELS = { 1: "Round 1", 2: "Round 2 — Réfutation", 50: "Question" };

export default function AgentPanel({ type, arguments: args = [], loading, streamContent = "" }) {
  const cfg = TYPE_CONFIG[type];

  return (
    <div className={`rounded-2xl border ${cfg.bg} ${cfg.border} overflow-hidden`}>
      <div className={`flex items-center gap-3 px-5 py-3.5 ${cfg.header}`}>
        <span className="text-lg">{cfg.emoji}</span>
        <span className={`font-bold ${cfg.text}`}>{cfg.label}</span>
        <div className={`ml-auto w-2 h-2 rounded-full ${loading ? "animate-pulse " + cfg.dot : args.length > 0 ? cfg.dot : "bg-gray-600"}`} />
      </div>

      <div className="p-5 space-y-5 max-h-[520px] overflow-y-auto">
        {args.length === 0 && !loading && !streamContent && <p className="text-gray-600 text-sm text-center py-8">En attente du Round 1...</p>}

        {args.map((arg) => (
          <div key={arg.id} className="space-y-2">
            <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded border ${cfg.roundLabel}`}>
              {ROUND_LABELS[arg.round_number] || `Round ${arg.round_number}`}
            </span>
            <div className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">{formatArgument(arg.content)}</div>
          </div>
        ))}

        {streamContent && (
          <div className="space-y-2">
            <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded border ${cfg.roundLabel} animate-pulse`}>
              En cours...
            </span>
            <div className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
              {streamContent}
              <span className="inline-block w-1.5 h-4 bg-current ml-0.5 animate-pulse" />
            </div>
          </div>
        )}

        {loading && !streamContent && (
          <div className="flex items-center gap-2 text-gray-500 text-sm py-4">
            <div className={`w-2 h-2 rounded-full ${cfg.dot} animate-bounce`} />
            <div className={`w-2 h-2 rounded-full ${cfg.dot} animate-bounce [animation-delay:0.15s]`} />
            <div className={`w-2 h-2 rounded-full ${cfg.dot} animate-bounce [animation-delay:0.3s]`} />
            <span className="ml-1">Génération en cours...</span>
          </div>
        )}
      </div>
    </div>
  );
}

function formatArgument(text) {
  return text.split(/(\*\*[^*]+\*\*)/).map((part, i) =>
    part.startsWith("**") ? (
      <strong key={i} className="text-white font-semibold">
        {part.slice(2, -2)}
      </strong>
    ) : (
      part
    )
  );
}