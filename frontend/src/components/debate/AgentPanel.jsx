const TYPE_CONFIG = {
  POUR: {
    label: "Agent POUR",
    emoji: "P",
    bg: "from-emerald-500/10 to-cyan-400/5",
    border: "border-emerald-300/30",
    header: "bg-emerald-400/10",
    text: "text-emerald-100",
    dot: "bg-emerald-300 text-emerald-300",
    roundLabel: "bg-emerald-400/15 text-emerald-200 border-emerald-300/30",
  },
  CONTRE: {
    label: "Agent CONTRE",
    emoji: "C",
    bg: "from-violet-500/12 to-rose-400/6",
    border: "border-violet-300/30",
    header: "bg-violet-400/10",
    text: "text-violet-100",
    dot: "bg-violet-300 text-violet-300",
    roundLabel: "bg-violet-400/15 text-violet-200 border-violet-300/30",
  },
};

const ROUND_LABELS = { 1: "Round 1", 2: "Round 2 — Réfutation", 50: "Question" };

export default function AgentPanel({ type, arguments: args = [], loading, streamContent = "" }) {
  const cfg = TYPE_CONFIG[type];

  return (
    <div className={`rounded-2xl border ${cfg.border} overflow-hidden bg-gradient-to-br ${cfg.bg} backdrop-blur-md shadow-[0_20px_50px_rgba(0,0,0,0.35)]`}>
      <div className={`flex items-center gap-3 px-5 py-3.5 border-b border-white/10 ${cfg.header}`}>
        <span className="text-xs h-7 w-7 inline-flex items-center justify-center rounded-full border border-current/50 font-bold">{cfg.emoji}</span>
        <span className={`font-bold ${cfg.text}`}>{cfg.label}</span>
        <div className={`ml-auto pulse-dot ${loading ? cfg.dot : args.length > 0 ? cfg.dot : "text-slate-500 bg-slate-500"}`} />
      </div>

      <div className="p-5 space-y-5 max-h-[520px] overflow-y-auto">
        {args.length === 0 && !loading && !streamContent && <p className="text-slate-500 text-sm text-center py-8">En attente du Round 1...</p>}

        {args.map((arg) => (
          <div key={arg.id} className="space-y-2">
            <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded border ${cfg.roundLabel}`}>
              {ROUND_LABELS[arg.round_number] || `Round ${arg.round_number}`}
            </span>
            <div className="text-slate-200 text-sm leading-relaxed whitespace-pre-wrap">{formatArgument(arg.content)}</div>
          </div>
        ))}

        {streamContent && (
          <div className="space-y-2">
            <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded border ${cfg.roundLabel} animate-pulse`}>
              En cours...
            </span>
            <div className="text-slate-200 text-sm leading-relaxed whitespace-pre-wrap">
              {streamContent}
              <span className="inline-block w-1.5 h-4 bg-current ml-0.5 animate-pulse" />
            </div>
          </div>
        )}

        {loading && !streamContent && (
          <div className="flex items-center gap-2 text-slate-400 text-sm py-4">
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