"""
rag/pipeline.py
Pipeline RAG : upload documents → embeddings → ChromaDB → retrieval
"""
import os, uuid
from pathlib import Path
from langchain_community.document_loaders import PyPDFLoader, Docx2txtLoader, CSVLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_chroma import Chroma

UPLOAD_DIR  = Path("uploads")
CHROMA_DIR  = Path("chroma_db")
UPLOAD_DIR.mkdir(exist_ok=True)
CHROMA_DIR.mkdir(exist_ok=True)

# multilingual-e5-large : supporte français + arabe + anglais
EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "intfloat/multilingual-e5-large")

def get_embeddings():
    return HuggingFaceEmbeddings(
        model_name=EMBEDDING_MODEL,
        model_kwargs={"device": "cpu"},
        encode_kwargs={"normalize_embeddings": True},
    )

def get_vectorstore(session_id: str):
    return Chroma(
        collection_name=f"session_{session_id}",
        embedding_function=get_embeddings(),
        persist_directory=str(CHROMA_DIR),
    )

def load_document(file_path: str):
    """Charge un document selon son extension."""
    path = Path(file_path)
    ext  = path.suffix.lower()
    if ext == ".pdf":
        return PyPDFLoader(file_path).load()
    elif ext in [".docx", ".doc"]:
        return Docx2txtLoader(file_path).load()
    elif ext in [".csv", ".xlsx"]:
        return CSVLoader(file_path).load()
    else:
        # Fichier texte brut
        with open(file_path, "r", encoding="utf-8") as f:
            from langchain_core.documents import Document
            return [Document(page_content=f.read(), metadata={"source": file_path})]

async def ingest_document(session_id: str, file_path: str) -> int:
    """
    Ingère un document dans ChromaDB pour la session donnée.
    Retourne le nombre de chunks créés.
    """
    docs = load_document(file_path)

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=800,
        chunk_overlap=100,
        separators=["\n\n", "\n", ".", " "],
    )
    chunks = splitter.split_documents(docs)

    # Ajout du session_id dans les metadata
    for chunk in chunks:
        chunk.metadata["session_id"] = session_id

    vectorstore = get_vectorstore(session_id)
    vectorstore.add_documents(chunks)

    return len(chunks)

async def retrieve_context(session_id: str, query: str, k: int = 5) -> str:
    """
    Retrouve les passages les plus pertinents pour une requête.
    Retourne un texte concaténé prêt à injecter dans le prompt agent.
    """
    vectorstore = get_vectorstore(session_id)
    results     = vectorstore.similarity_search(query, k=k)

    if not results:
        return ""

    context_parts = []
    for i, doc in enumerate(results, 1):
        source = doc.metadata.get("source", "Document")
        context_parts.append(f"[Extrait {i} — {Path(source).name}]\n{doc.page_content}")

    return "\n\n---\n\n".join(context_parts)

def delete_session_docs(session_id: str):
    """Supprime tous les vecteurs d'une session (nettoyage)."""
    vectorstore = get_vectorstore(session_id)
    vectorstore.delete_collection()
