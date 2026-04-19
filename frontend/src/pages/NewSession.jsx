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
    <div className="max-w-2xl mx-auto px-6 py-10">
      <button
        onClick={navigate.toDashboard}
        className="flex items-center gap-2 text-gray-400 hover:text-white text-sm mb-8 transition-colors"
      >
        ← Retour au tableau de bord
      </button>

      <h1 className="text-3xl font-bold mb-2">
        <span className="text-green-400">Nouveau</span> débat
      </h1>
      <p className="text-gray-400 text-sm mb-8">Définissez la décision à soumettre aux deux agents IA.</p>

      {error && <div className="bg-red-900/30 border border-red-700 text-red-400 rounded-xl p-4 text-sm mb-6">{error}</div>}

      <div className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">
            Titre de la session <span className="text-red-400">*</span>
          </label>
          <input
            name="title"
            value={form.title}
            onChange={handleChange}
            placeholder="Ex : Recrutement poste Dev Senior — Juin 2025"
            className="w-full bg-gray-900 border border-gray-700 focus:border-green-500 rounded-xl px-4 py-3 text-white placeholder-gray-600 outline-none transition-colors text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">Domaine</label>
          <div className="flex gap-3">
            {[
              { value: "RH", label: "👥 Ressources Humaines" },
              { value: "STRATEGIE", label: "📊 Stratégie" },
            ].map((choice) => (
              <button
                key={choice.value}
                onClick={() => setForm({ ...form, domain: choice.value })}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all ${form.domain === choice.value ? "bg-green-700 border-green-500 text-white" : "bg-gray-900 border-gray-700 text-gray-400 hover:border-gray-500"}`}
              >
                {choice.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">
            Décision à débattre <span className="text-red-400">*</span>
          </label>
          <textarea
            name="decision"
            value={form.decision}
            onChange={handleChange}
            rows={3}
            placeholder="Ex : Faut-il recruter un développeur senior externe ou promouvoir un junior interne ?"
            className="w-full bg-gray-900 border border-gray-700 focus:border-green-500 rounded-xl px-4 py-3 text-white placeholder-gray-600 outline-none transition-colors text-sm resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">
            Contexte de l'entreprise <span className="text-gray-500 font-normal">(optionnel)</span>
          </label>
          <textarea
            name="context"
            value={form.context}
            onChange={handleChange}
            rows={3}
            placeholder="Budget disponible, taille de l'équipe, contraintes, historique..."
            className="w-full bg-gray-900 border border-gray-700 focus:border-green-500 rounded-xl px-4 py-3 text-white placeholder-gray-600 outline-none transition-colors text-sm resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">
            Documents <span className="text-gray-500 font-normal">(PDF, DOCX, CSV...)</span>
          </label>
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => fileRef.current?.click()}
            className="border-2 border-dashed border-gray-700 hover:border-green-600 rounded-xl p-8 text-center cursor-pointer transition-colors group"
          >
            <div className="text-3xl mb-2">📄</div>
            <p className="text-gray-400 text-sm group-hover:text-gray-300 transition-colors">
              Glissez vos documents ici ou <span className="text-green-400 underline">parcourir</span>
            </p>
            <p className="text-gray-600 text-xs mt-1">PDF, DOCX, XLSX, CSV, TXT</p>
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
                <div key={i} className="flex items-center justify-between bg-gray-900 border border-gray-800 rounded-lg px-4 py-2">
                  <div className="flex items-center gap-3">
                    <span className="text-green-400 text-sm">📎</span>
                    <span className="text-sm text-gray-300">{f.name}</span>
                    <span className="text-xs text-gray-600">({(f.size / 1024).toFixed(1)} KB)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {uploadStatus[f.name] === "uploading" && <span className="text-blue-400 text-xs">Indexation...</span>}
                    {uploadStatus[f.name] === "done" && <span className="text-green-400 text-xs">✓ Indexé</span>}
                    {uploadStatus[f.name] === "error" && <span className="text-red-400 text-xs">✗ Erreur</span>}
                    {!uploadStatus[f.name] && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFile(i);
                        }}
                        className="text-gray-600 hover:text-red-400 text-sm transition-colors"
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
          className="w-full bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-green-900/40 text-sm mt-2"
        >
          {loading ? "Création en cours..." : "Lancer le débat →"}
        </button>
      </div>
    </div>
  );
}