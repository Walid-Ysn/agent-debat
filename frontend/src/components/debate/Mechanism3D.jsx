export default function Mechanism3D({ stage = "idle" }) {
  const stageText = {
    idle: "Waiting for strategic input",
    round1: "Agents generating independent positions",
    round2: "Cross-evaluation and rebuttal loop",
    questions: "Interactive clarification and challenge",
    done: "Arbitration finalized and insight packaged",
  };

  return (
    <div className="glass-panel p-5 lg:p-6 h-full">
      <div className="flex items-start justify-between gap-3 mb-5">
        <div>
          <p className="section-kicker">Cognitive Engine</p>
          <h3 className="section-heading text-lg">3D Decision Mechanism</h3>
        </div>
        <span className="text-xs px-3 py-1 rounded-full border border-cyan-300/40 text-cyan-200 bg-cyan-400/10">
          Live Simulation
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
          { label: "Argument Weights", value: "94%", color: "text-cyan-300" },
          { label: "Conflict Signals", value: "17", color: "text-violet-300" },
          { label: "Strategy Confidence", value: "0.89", color: "text-emerald-300" },
        ].map((item) => (
          <div key={item.label} className="neo-tile px-3.5 py-3">
            <p className="text-[11px] uppercase tracking-[0.14em] text-slate-400">{item.label}</p>
            <p className={`mt-1.5 text-xl font-bold ${item.color}`}>{item.value}</p>
          </div>
        ))}
      </div>

      <div className="data-flow rounded-xl border border-indigo-300/20 bg-slate-950/50 px-3.5 py-2.5">
        <p className="text-xs text-slate-300 tracking-wide">{stageText[stage] || stageText.idle}</p>
      </div>
    </div>
  );
}
