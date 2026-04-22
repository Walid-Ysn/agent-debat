import { useState, useEffect } from "react";
import { api } from "../services/api";

const STATUS_COLORS = {
  PENDING: "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30",
  DEBATING: "bg-blue-500/20 text-blue-400 border border-blue-500/30",
  FINISHED: "bg-green-500/20 text-green-400 border border-green-500/30",
};
const STATUS_LABELS = { PENDING: "En attente", DEBATING: "En cours", FINISHED: "Terminé" };

export default function Dashboard({ navigate }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const completionRate = sessions.length ? Math.round((sessions.filter((s) => s.status === "FINISHED").length / sessions.length) * 100) : 0;
  const momentum = Math.min(100, 40 + sessions.length * 7);

  useEffect(() => {
    api
      .getSessions()
      .then(setSessions)
      .catch(() => setError("Impossible de charger les sessions"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-10">
      <header className="glass-panel--strong p-5 md:p-7 mb-6 stagger-entry">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="section-kicker mb-2">Executive Command Interface</p>
            <h1 className="title-fusion text-3xl md:text-4xl font-bold leading-tight">
              Debate Agent
              <span className="block text-cyan-300">HR and Enterprise Strategy</span>
            </h1>
            <p className="text-slate-300 mt-3 max-w-2xl text-sm md:text-base">
              Real-time contradictory intelligence for talent decisions, organizational planning, and strategic trade-off simulation.
            </p>
          </div>
          <button onClick={navigate.toNew} className="enterprise-button flex items-center gap-2 text-sm md:text-base">
            <span className="text-lg leading-none">+</span>
            Start New Debate
          </button>
        </div>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Sessions", value: sessions.length, tone: "text-indigo-200" },
          { label: "In Progress", value: sessions.filter((s) => s.status === "DEBATING").length, tone: "text-cyan-200" },
          { label: "Completed", value: sessions.filter((s) => s.status === "FINISHED").length, tone: "text-emerald-200" },
          { label: "Completion Rate", value: `${completionRate}%`, tone: "text-violet-200" },
        ].map((item, idx) => (
          <article key={item.label} className="glass-panel metric-card p-4 md:p-5 stagger-entry" style={{ animationDelay: `${idx * 90}ms` }}>
            <p className="text-xs uppercase tracking-[0.14em] text-slate-400">{item.label}</p>
            <p className={`mt-2 text-3xl font-bold ${item.tone}`}>{item.value}</p>
            <div className="mt-3 h-1.5 rounded-full bg-slate-900/70 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-indigo-400 via-cyan-300 to-violet-400"
                style={{ width: `${Math.min(100, 24 + idx * 19 + (sessions.length > 0 ? 18 : 0))}%` }}
              />
            </div>
          </article>
        ))}
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-[1.35fr_1fr] gap-4 mb-6">
        <article className="glass-panel p-5 md:p-6 stagger-entry [animation-delay:120ms]">
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="section-kicker mb-1">HR Analytics</p>
              <h2 className="section-heading text-xl">Decision Activity Dashboard</h2>
            </div>
            <div className="text-xs text-cyan-200 bg-cyan-500/10 border border-cyan-300/30 px-3 py-1 rounded-full">Live Feed</div>
          </div>

          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div className="neo-tile p-4">
              <p className="text-xs tracking-[0.14em] uppercase text-slate-400">Debate Throughput</p>
              <div className="mt-4 space-y-3">
                {[
                  { label: "Talent Acquisition", value: 82 },
                  { label: "Workforce Planning", value: 68 },
                  { label: "Strategic Governance", value: 91 },
                ].map((item) => (
                  <div key={item.label}>
                    <div className="flex justify-between text-xs text-slate-300 mb-1">
                      <span>{item.label}</span>
                      <span>{item.value}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-900 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-indigo-400 via-cyan-300 to-emerald-300 data-flow"
                        style={{ width: `${item.value}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="neo-tile p-4">
              <p className="text-xs tracking-[0.14em] uppercase text-slate-400">Enterprise Confidence Curve</p>
              <div className="mt-4 h-[138px] relative overflow-hidden rounded-lg border border-indigo-300/20 bg-slate-950/55">
                <svg viewBox="0 0 320 160" className="w-full h-full">
                  <defs>
                    <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#6f7cff" />
                      <stop offset="45%" stopColor="#2de4ff" />
                      <stop offset="100%" stopColor="#2beab9" />
                    </linearGradient>
                  </defs>
                  <path d="M0 118 C40 102, 85 110, 122 82 C152 58, 198 72, 230 38 C252 16, 290 22, 320 12" fill="none" stroke="url(#lineGradient)" strokeWidth="4" strokeLinecap="round" />
                </svg>
                <div className="absolute inset-x-0 bottom-1 text-center text-[11px] text-slate-400">Quarterly strategic maturity trajectory</div>
              </div>
            </div>
          </div>

          <div className="neo-tile p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs tracking-[0.14em] uppercase text-slate-400">Operational Momentum</p>
              <p className="text-cyan-200 text-sm font-semibold">{momentum}%</p>
            </div>
            <div className="h-2.5 rounded-full bg-slate-950 overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-violet-400 via-indigo-300 to-cyan-300 data-flow" style={{ width: `${momentum}%` }} />
            </div>
          </div>
        </article>

        <article className="glass-panel p-5 md:p-6 stagger-entry [animation-delay:220ms]">
          <p className="section-kicker mb-1">Strategy Simulation</p>
          <h2 className="section-heading text-xl mb-4">Scenario Decision Tree</h2>

          <div className="space-y-3">
            {[
              { level: "Root", node: "Invest in external leadership talent", impact: "High growth potential", color: "text-cyan-200" },
              { level: "Branch A", node: "Internal upskilling acceleration", impact: "Cost-efficient, slower ramp", color: "text-emerald-200" },
              { level: "Branch B", node: "Hybrid hiring and mentoring", impact: "Balanced risk profile", color: "text-violet-200" },
            ].map((item, idx) => (
              <div key={item.level} className="neo-tile p-3.5 hover:translate-y-[-1px] transition-transform">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.14em] text-slate-400">{item.level}</p>
                    <p className={`mt-1 text-sm font-semibold ${item.color}`}>{item.node}</p>
                  </div>
                  <span className="text-[10px] px-2 py-1 rounded-full border border-slate-400/25 text-slate-300">Path {idx + 1}</span>
                </div>
                <p className="text-xs text-slate-400 mt-2">{item.impact}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 text-xs text-slate-300 flex items-center gap-2">
            <span className="pulse-dot text-cyan-300 bg-cyan-300" />
            Model updates as debates complete and new evidence is uploaded.
          </div>
        </article>
      </section>

      {loading && <div className="text-center py-16 text-slate-400">Chargement...</div>}
      {error && <div className="rounded-xl border border-rose-400/40 bg-rose-400/10 text-rose-200 p-4 text-sm mb-4">{error}</div>}

      {!loading && sessions.length === 0 && (
        <div className="glass-panel p-10 text-center">
          <div className="text-5xl mb-3">AI</div>
          <p className="text-slate-300 font-semibold">No strategic sessions yet.</p>
          <p className="text-slate-400 text-sm mt-1">Launch your first enterprise debate to activate analytics.</p>
        </div>
      )}

      <section className="space-y-3 mt-5">
        {sessions.map((s, index) => (
          <article
            key={s.id}
            onClick={() => navigate.toDebate(s.id)}
            className="glass-panel p-4 md:p-5 cursor-pointer hover:border-cyan-300/40 hover:translate-y-[-1px] transition-all group stagger-entry"
            style={{ animationDelay: `${140 + index * 70}ms` }}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-indigo-400/15 border border-indigo-300/30 text-indigo-200">{s.domain}</span>
                  <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${STATUS_COLORS[s.status]}`}>{STATUS_LABELS[s.status]}</span>
                </div>
                <h3 className="text-slate-100 font-semibold text-base group-hover:text-cyan-200 transition-colors truncate">{s.title}</h3>
                <p className="text-slate-400 text-sm mt-1 truncate">{s.decision}</p>
              </div>
              <div className="text-slate-500 text-xs whitespace-nowrap pt-1">{new Date(s.created_at).toLocaleDateString("fr-FR")}</div>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}