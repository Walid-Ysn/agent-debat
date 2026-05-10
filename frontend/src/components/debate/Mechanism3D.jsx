export default function Mechanism3D({ stage = "idle", analytics }) {
  const values = analytics?.ai_decision || {};
  const modules = analytics?.modules || {};
  const stageText = {
    idle: "Waiting for strategic input",
    round1: "Agents generating independent positions",
    round2: "Cross-evaluation and rebuttal loop",
    questions: "Interactive clarification and challenge",
    arbitre: "Arbitration synthesis in progress",
    done: "Arbitration finalized and insight packaged",
  };

  const liveActive = !!modules.live_simulation_engine;

  return (
    <div className="glass-panel p-5 lg:p-6 h-full">
      <div className="flex items-start justify-between gap-3 mb-5">
        <div>
          <p className="section-kicker">Cognitive Engine</p>
          <h3 className="section-heading text-lg">3D Decision Mechanism</h3>
        </div>
        <span
          className={`text-xs px-3 py-1 rounded-full border ${
            liveActive
              ? "border-cyan-300/40 text-cyan-200 bg-cyan-400/10"
              : "border-slate-500/40 text-slate-400 bg-slate-500/10"
          }`}
        >
          {liveActive ? "Live Simulation" : "Standby"}
        </span>
      </div>

      <div className="mesh-3d relative py-8 lg:py-10">
        <div className="mesh-core" />
        <div className="ring ring-a" />
        <div className="ring ring-b" />
        <div className="ring ring-c" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        {[
          { label: "Argument Weights", value: `${Math.round(values.argument_weights || 0)}%`, color: "text-cyan-300" },
          { label: "Conflict Signals", value: `${values.conflict_signals || 0}`, color: "text-violet-300" },
          { label: "Strategy Confidence", value: `${(values.strategy_confidence_score || 0).toFixed(2)}`, color: "text-emerald-300" },
        ].map((item) => (
          <div key={item.label} className="neo-tile px-3.5 py-3">
            <p className="text-[11px] uppercase tracking-[0.14em] text-slate-400">{item.label}</p>
            <p className={`mt-1.5 text-xl font-bold ${item.color}`}>{item.value}</p>
          </div>
        ))}
      </div>

      <div className="data-flow rounded-xl border border-indigo-300/20 bg-slate-950/50 px-3.5 py-2.5">
        <p className="text-xs text-slate-300 tracking-wide">
          {modules.standby_mode ? "Cognitive engine standby. Launch debate stages to activate simulations." : stageText[stage] || stageText.idle}
        </p>
      </div>
    </div>
  );
}
