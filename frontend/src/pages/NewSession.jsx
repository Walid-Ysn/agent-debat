import { useState, useRef } from "react";
import { api } from "../services/api";

export default function NewSession({ navigate }) {
  const [form, setForm] = useState({ title: "", decision: "", context: "", domain: "RH" });
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [uploadStatus, setUploadStatus] = useState({});
  const fileRef = useRef();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const handleFiles = (e) => setFiles((prev) => [...prev, ...Array.from(e.target.files)]);
  const removeFile = (idx) => setFiles((prev) => prev.filter((_, i) => i !== idx));
  const handleDrop = (e) => {
    e.preventDefault();
    setFiles((prev) => [...prev, ...Array.from(e.dataTransfer.files)]);
  };

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.decision.trim()) {
      setError("Le titre et la décision sont obligatoires.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const session = await api.createSession(form);
      for (const file of files) {
        setUploadStatus((prev) => ({ ...prev, [file.name]: "uploading" }));
        try {
          await api.uploadDocument(session.id, file);
          setUploadStatus((prev) => ({ ...prev, [file.name]: "done" }));
        } catch {
          setUploadStatus((prev) => ({ ...prev, [file.name]: "error" }));
        }
      }
      navigate.toDebate(session.id);
    } catch (err) {
      setError(err.message || "Erreur lors de la création");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-6 py-8 md:py-10">
      <button onClick={navigate.toDashboard} className="ghost-button px-3.5 py-2 text-sm mb-6">
        ← Retour au tableau de bord
      </button>

      <div className="grid lg:grid-cols-[1.15fr_0.85fr] gap-5 items-start">
        <section className="glass-panel--strong p-5 md:p-7 stagger-entry">
          <p className="section-kicker mb-2">Session Designer</p>
          <h1 className="title-fusion text-3xl md:text-4xl font-bold leading-tight">
            Create Strategic
            <span className="block text-cyan-300">Debate Scenario</span>
          </h1>
          <p className="text-slate-300 text-sm md:text-base mt-3 mb-6">
            Build a high-context decision environment, inject supporting evidence, and orchestrate a controlled AI contradiction cycle.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
            {[
              { label: "Domain Scope", value: form.domain === "RH" ? "Human Resources" : "Enterprise Strategy" },
              { label: "Evidence Files", value: files.length },
              { label: "Readiness", value: form.title && form.decision ? "High" : "Draft" },
            ].map((item) => (
              <div key={item.label} className="neo-tile p-3.5">
                <p className="text-[11px] uppercase tracking-[0.14em] text-slate-400">{item.label}</p>
                <p className="text-sm mt-1 text-cyan-100 font-semibold">{item.value}</p>
              </div>
            ))}
          </div>

          <div className="text-xs text-slate-300 flex items-center gap-2">
            <span className="pulse-dot text-cyan-300 bg-cyan-300" />
            Configuration integrity monitored in real-time.
          </div>
        </section>

        <aside className="glass-panel p-5 md:p-6 stagger-entry [animation-delay:140ms]">
          <p className="section-kicker mb-1">Simulation Blueprint</p>
          <h2 className="section-heading text-xl mb-4">Decision Path Preview</h2>
          <div className="space-y-3 text-sm">
            {[
              { step: "01", title: "Frame the question", desc: "Describe strategic trade-offs and expected outcomes." },
              { step: "02", title: "Inject context", desc: "Attach policy documents, staffing data, and constraints." },
              { step: "03", title: "Launch debate", desc: "Run contradiction rounds and capture final arbitration." },
            ].map((item) => (
              <div key={item.step} className="neo-tile p-3.5">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[11px] px-2 py-0.5 rounded-full border border-cyan-300/40 text-cyan-200">{item.step}</span>
                  <p className="font-semibold text-slate-200">{item.title}</p>
                </div>
                <p className="text-xs text-slate-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </aside>
      </div>

      {error && <div className="rounded-xl border border-rose-400/40 bg-rose-400/10 text-rose-200 p-4 text-sm mt-5">{error}</div>}

      <div className="glass-panel p-5 md:p-6 mt-5 space-y-5">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">
            Titre de la session <span className="text-rose-300">*</span>
          </label>
          <input
            name="title"
            value={form.title}
            onChange={handleChange}
            placeholder="Ex : Recrutement poste Dev Senior — Juin 2025"
            className="input-future text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">Domaine</label>
          <div className="flex gap-3">
            {[
              { value: "RH", label: "HR" },
              { value: "STRATEGIE", label: "Enterprise Strategy" },
            ].map((choice) => (
              <button
                key={choice.value}
                onClick={() => setForm({ ...form, domain: choice.value })}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all ${form.domain === choice.value ? "bg-cyan-500/20 border-cyan-300/70 text-cyan-100" : "bg-slate-950/50 border-indigo-200/20 text-slate-400 hover:border-indigo-200/40"}`}
              >
                {choice.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">
            Décision à débattre <span className="text-rose-300">*</span>
          </label>
          <textarea
            name="decision"
            value={form.decision}
            onChange={handleChange}
            rows={3}
            placeholder="Ex : Faut-il recruter un développeur senior externe ou promouvoir un junior interne ?"
            className="input-future text-sm resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">
            Contexte de l'entreprise <span className="text-slate-500 font-normal">(optionnel)</span>
          </label>
          <textarea
            name="context"
            value={form.context}
            onChange={handleChange}
            rows={3}
            placeholder="Budget disponible, taille de l'équipe, contraintes, historique..."
            className="input-future text-sm resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">
            Documents <span className="text-slate-500 font-normal">(PDF, DOCX, CSV...)</span>
          </label>
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => fileRef.current?.click()}
            className="border-2 border-dashed border-indigo-200/30 hover:border-cyan-300/70 rounded-xl p-8 text-center cursor-pointer transition-colors group bg-slate-950/35"
          >
            <div className="text-3xl mb-2 text-cyan-200">▦</div>
            <p className="text-slate-300 text-sm group-hover:text-cyan-100 transition-colors">
              Glissez vos documents ici ou <span className="text-cyan-300 underline">parcourir</span>
            </p>
            <p className="text-slate-500 text-xs mt-1">PDF, DOCX, XLSX, CSV, TXT</p>
            <input
              ref={fileRef}
              type="file"
              multiple
              accept=".pdf,.docx,.doc,.csv,.xlsx,.txt"
              onChange={handleFiles}
              className="hidden"
            />
          </div>

          {files.length > 0 && (
            <div className="mt-3 space-y-2">
              {files.map((f, i) => (
                <div key={i} className="flex items-center justify-between bg-slate-950/65 border border-indigo-200/20 rounded-lg px-4 py-2">
                  <div className="flex items-center gap-3">
                    <span className="text-cyan-300 text-sm">◉</span>
                    <span className="text-sm text-slate-200">{f.name}</span>
                    <span className="text-xs text-slate-500">({(f.size / 1024).toFixed(1)} KB)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {uploadStatus[f.name] === "uploading" && <span className="text-cyan-300 text-xs">Indexation...</span>}
                    {uploadStatus[f.name] === "done" && <span className="text-emerald-300 text-xs">✓ Indexé</span>}
                    {uploadStatus[f.name] === "error" && <span className="text-rose-300 text-xs">✗ Erreur</span>}
                    {!uploadStatus[f.name] && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFile(i);
                        }}
                        className="text-slate-500 hover:text-rose-300 text-sm transition-colors"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="enterprise-button w-full text-sm mt-2"
        >
          {loading ? "Création en cours..." : "Lancer le débat"}
        </button>
      </div>
    </div>
  );
}