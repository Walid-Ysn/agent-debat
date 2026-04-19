# Agent Débat — RH & Stratégie

Application intelligente de débat contradictoire pour la prise de décision en entreprise.

## Architecture

```
agent-debat/
├── backend/                  # FastAPI + LangChain + RAG
│   ├── main.py               # Point d'entrée FastAPI
│   ├── database.py           # Modèles SQLAlchemy + SQLite/PostgreSQL
│   ├── requirements.txt      # Dépendances Python
│   ├── agents/
│   │   └── core.py           # Agent Pour, Contre, Arbitre (LangChain + Ollama)
│   ├── rag/
│   │   └── pipeline.py       # Ingestion docs → ChromaDB + retrieval
│   └── routers/
│       ├── sessions.py       # CRUD sessions + upload documents
│       ├── debate.py         # Rounds de débat + WebSocket streaming
│       └── reports.py        # Génération rapport PDF (ReportLab)
│
└── frontend/                 # React + Vite + TailwindCSS
    └── src/
        ├── App.jsx            # Routing simple
        ├── services/api.js    # Toutes les calls API + WebSocket
        ├── pages/
        │   ├── Dashboard.jsx  # Liste des sessions
        │   ├── NewSession.jsx # Création session + upload docs
        │   └── DebatePage.jsx # Interface principale de débat
        └── components/debate/
            ├── AgentPanel.jsx # Panneau Pour / Contre avec streaming
            └── QuestionBox.jsx # Questions décideurs
```

---

## Installation & Lancement

### Prérequis
- Python 3.11+
- Node.js 18+
- [Ollama](https://ollama.ai) installé et en cours d'exécution

### 1. Télécharger le modèle LLM
```bash
ollama pull qwen3:8b
```

### 2. Backend FastAPI

```bash
cd backend

# Créer un environnement virtuel
python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate

# Installer les dépendances
pip install -r requirements.txt

# Lancer le serveur
uvicorn main:app --reload --port 8000
```

API disponible sur : http://localhost:8000
Documentation Swagger : http://localhost:8000/docs

### 3. Frontend React

```bash
cd frontend

# Installer les dépendances
npm install

# Lancer le serveur de développement
npm run dev
```

Interface disponible sur : http://localhost:5173

---

## Variables d'environnement (backend)

Créer un fichier `.env` à la racine du projet :

```env
# LLM — Ollama local (défaut)
OLLAMA_MODEL=qwen3:8b
OLLAMA_URL=http://localhost:11434

# Embedding model (HuggingFace — téléchargé automatiquement)
EMBEDDING_MODEL=intfloat/multilingual-e5-large

# Base de données (SQLite par défaut, PostgreSQL en production)
DATABASE_URL=sqlite:///./agent_debat.db
# DATABASE_URL=postgresql://user:password@localhost/agent_debat

# Supabase (optionnel, recommandé en prod)
# Tu peux utiliser SUPABASE_DB_URL ou DATABASE_URL.
# Exemple Direct Connection Supabase (pooler recommandé):
# SUPABASE_DB_URL=postgresql://postgres.<project-ref>:<password>@aws-0-eu-west-3.pooler.supabase.com:6543/postgres?sslmode=require
```

### Supabase vs PostgreSQL

- Supabase n'est pas un remplaçant de PostgreSQL: Supabase est une plateforme managée qui utilise PostgreSQL.
- Donc ce n'est pas "Supabase ou PostgreSQL", mais plutôt:
    - PostgreSQL auto-hébergé = plus de contrôle, plus d'ops
    - Supabase (PostgreSQL managé) = plus rapide à mettre en production (auth, dashboard, backups, pooler, etc.)

### Ce que tu dois créer manuellement dans Supabase

1. Créer un projet Supabase.
2. Récupérer l'URL de connexion PostgreSQL (de préférence le pooler) et le mot de passe DB.
3. Mettre cette URL dans `.env` via `SUPABASE_DB_URL` (ou `DATABASE_URL`).
4. Lancer le backend: les tables sont créées automatiquement par SQLAlchemy au démarrage (`create_tables()`).

Tu n'as pas besoin de créer les tables à la main pour cette app.

---

## Flux d'un débat

1. **Créer une session** : titre, domaine (RH/Stratégie), décision, contexte
2. **Uploader des documents** : PDF, DOCX, Excel indexés dans ChromaDB
3. **Round 1** : les deux agents génèrent leurs arguments de façon indépendante
4. **Round 2** : chaque agent lit et réfute les arguments de l'autre
5. **Questions** : les décideurs posent des questions aux deux agents
6. **Verdict** : l'Agent Arbitre analyse tout et génère une recommandation
7. **Export PDF** : rapport complet téléchargeable

---

## Stack technique

| Composant | Technologie |
|-----------|-------------|
| LLM Agents | Qwen3-8B via Ollama (local, gratuit) |
| Embeddings RAG | intfloat/multilingual-e5-large |
| Vector Store | ChromaDB |
| Backend | FastAPI (Python) |
| Orchestration | LangChain |
| Frontend | React + Vite + TailwindCSS |
| Temps réel | WebSocket |
| Base de données | Supabase |
| Export | ReportLab (PDF) |

---

## EMSI Casablanca — PFA 4ème Année — 2025/2026
