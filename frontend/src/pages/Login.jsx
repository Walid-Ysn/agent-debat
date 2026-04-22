import { useState } from "react";
import { api } from "../services/api";

export default function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await api.login(username.trim(), password);
      onLogin?.();
    } catch (err) {
      setError(err.message || "Echec de connexion");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center px-4 py-8">
      <div className="w-full max-w-5xl grid lg:grid-cols-[1.1fr_0.9fr] gap-5 items-stretch">
        <section className="glass-panel--strong p-6 lg:p-9 stagger-entry relative overflow-hidden">
          <div className="absolute -top-20 -right-24 w-64 h-64 rounded-full bg-cyan-400/20 blur-3xl" />
          <div className="absolute -bottom-24 left-12 w-72 h-72 rounded-full bg-violet-500/20 blur-3xl" />
          <div className="relative z-10">
            <p className="section-kicker mb-2">Enterprise AI Platform</p>
            <h1 className="title-fusion text-3xl md:text-4xl font-bold leading-tight">
              Debate Agent
              <span className="block text-cyan-300">HR and Enterprise Strategy</span>
            </h1>
            <p className="text-slate-300 mt-4 max-w-lg">
              Next-generation decision intelligence combining contradictory AI reasoning, strategic simulation, and executive-grade explainability.
            </p>

            <div className="mt-8 grid sm:grid-cols-3 gap-3">
              {[
                { title: "Security", value: "JWT + policy gates" },
                { title: "Latency", value: "Real-time reasoning" },
                { title: "Assurance", value: "Traceable verdicts" },
              ].map((item) => (
                <div key={item.title} className="neo-tile p-3.5">
                  <p className="text-[11px] text-slate-400 uppercase tracking-[0.14em]">{item.title}</p>
                  <p className="text-sm mt-1 text-slate-200">{item.value}</p>
                </div>
              ))}
            </div>

            <div className="mt-7 flex items-center gap-2 text-cyan-300 text-xs tracking-wide">
              <span className="pulse-dot text-cyan-300 bg-cyan-300" />
              System status: operational
            </div>
          </div>
        </section>

        <section className="glass-panel p-6 lg:p-8 stagger-entry [animation-delay:140ms]">
          <div className="mb-7">
            <h2 className="title-fusion text-2xl font-bold text-slate-100">Secure Sign-In</h2>
            <p className="text-sm text-slate-400 mt-1">Access the strategic debate cockpit</p>
          </div>

          {error && <div className="mb-5 rounded-xl border border-rose-400/40 bg-rose-400/10 px-3.5 py-3 text-sm text-rose-200">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-slate-300 mb-1.5">Utilisateur</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="input-future"
                placeholder="admin"
              />
            </div>

            <div>
              <label className="block text-sm text-slate-300 mb-1.5">Mot de passe</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="input-future"
                placeholder="********"
              />
            </div>

            <button type="submit" disabled={loading} className="enterprise-button w-full mt-2">
              {loading ? "Connexion..." : "Enter Command Center"}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-indigo-200/15 text-xs text-slate-400 flex items-center justify-between">
            <span>Zero-trust session validation</span>
            <span className="thinking-dots inline-flex gap-1 text-cyan-300">
              <span />
              <span />
              <span />
            </span>
          </div>
        </section>
      </div>
    </div>
  );
}
