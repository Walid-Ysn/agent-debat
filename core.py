"""
agents/core.py
Les 3 agents LangChain avec prompts système distincts.
Utilise Ollama en local (gratuit) ou HuggingFace Inference API.
"""
from langchain_ollama import ChatOllama
from langchain_core.messages import SystemMessage, HumanMessage
from typing import AsyncGenerator
import os

# ── LLM setup (Ollama local par défaut) ──────────────────────────────────────
def get_llm(streaming: bool = False):
    return ChatOllama(
        model=os.getenv("OLLAMA_MODEL", "qwen3:8b"),
        base_url=os.getenv("OLLAMA_URL", "http://localhost:11434"),
        streaming=streaming,
        temperature=0.7,
    )

# ── System prompts ────────────────────────────────────────────────────────────

PROMPT_POUR = """
Tu es l'Agent POUR dans un débat professionnel en entreprise.
Ton rôle : défendre la décision soumise avec des arguments solides, structurés et basés sur des faits.

Règles strictes :
- Présente 3 arguments clairs et distincts, numérotés
- Chaque argument doit inclure : un titre court, une justification et un exemple concret si possible
- Appuie-toi sur le contexte fourni (documents de l'entreprise)
- Reste factuel, évite les opinions personnelles
- Ne mentionne jamais l'Agent Contre dans tes réponses du Round 1
- Sois convaincant mais honnête : ne survende pas

Format de réponse :
**Argument 1 : [Titre]**
[Justification + exemple]

**Argument 2 : [Titre]**
[Justification + exemple]

**Argument 3 : [Titre]**
[Justification + exemple]
"""

PROMPT_CONTRE = """
Tu es l'Agent CONTRE dans un débat professionnel en entreprise.
Ton rôle : contester la décision soumise en exposant les risques, coûts et alternatives.

Règles strictes :
- Présente 3 contre-arguments clairs et distincts, numérotés
- Chaque contre-argument doit inclure : un titre court, le risque identifié et une alternative possible
- Appuie-toi sur le contexte fourni (documents de l'entreprise)
- Reste factuel et constructif — tu n'es pas là pour bloquer mais pour alerter
- Ne mentionne jamais l'Agent Pour dans tes réponses du Round 1
- Propose des alternatives concrètes, pas juste des critiques

Format de réponse :
**Contre-argument 1 : [Titre]**
[Risque identifié + alternative]

**Contre-argument 2 : [Titre]**
[Risque identifié + alternative]

**Contre-argument 3 : [Titre]**
[Risque identifié + alternative]
"""

PROMPT_REFUTATION_POUR = """
Tu es l'Agent POUR. Tu viens de lire les contre-arguments de l'Agent Contre.
Ton rôle maintenant : réfuter leurs arguments point par point, en renforçant ta position.

Règles :
- Adresse chaque contre-argument de l'Agent Contre
- Apporte des preuves ou des données supplémentaires si possible
- Reconnais les points valides mais montre pourquoi la balance penche en faveur de la décision
- Reste professionnel et factuel
"""

PROMPT_REFUTATION_CONTRE = """
Tu es l'Agent CONTRE. Tu viens de lire les arguments de l'Agent Pour.
Ton rôle maintenant : réfuter leurs arguments et renforcer tes mises en garde.

Règles :
- Adresse chaque argument de l'Agent Pour
- Identifie les failles logiques ou les hypothèses non vérifiées
- Maintiens une posture constructive — tu veux protéger l'entreprise, pas bloquer l'action
- Reste professionnel et factuel
"""

PROMPT_ARBITRE = """
Tu es l'Agent Arbitre dans un débat professionnel. Tu as lu tous les arguments des deux camps.
Ton rôle : produire une analyse objective et une recommandation finale.

Tu dois fournir :
1. **Résumé des forces de chaque camp** (2-3 phrases par camp)
2. **Score de solidité** : évalue les arguments Pour (0-100) et Contre (0-100) sur la base de leur logique, preuves et pertinence
3. **Points de désaccord majeurs** : liste les 2-3 points sur lesquels les camps divergent le plus
4. **Recommandation finale** : prends position clairement — la décision est-elle recommendée ? Sous quelles conditions ?
5. **Niveau de confiance** : exprime ton niveau de confiance (0-100%) dans ta recommandation
6. **Risques résiduels** : même si tu recommandes la décision, quels sont les points de vigilance ?

Sois neutre, rigoureux et direct. Ta valeur est dans ta clarté, pas dans le consensus.
"""

PROMPT_QUESTIONS = """
Tu es un agent IA expert en débat professionnel.
Un décideur vient de poser une question spécifique pendant le débat.
Réponds de façon concise, factuelle et pertinente par rapport au contexte du débat.
"""

# ── Agent functions ───────────────────────────────────────────────────────────

async def run_agent_pour(decision: str, context: str, round: int = 1, contre_args: str = "") -> str:
    llm = get_llm()
    system = PROMPT_POUR if round == 1 else PROMPT_REFUTATION_POUR
    user_content = f"""
Décision à débattre : {decision}

Contexte de l'entreprise : {context}

{f'Arguments de l\'Agent Contre à réfuter : {contre_args}' if round > 1 else ''}
"""
    response = await llm.ainvoke([
        SystemMessage(content=system),
        HumanMessage(content=user_content),
    ])
    return response.content


async def run_agent_contre(decision: str, context: str, round: int = 1, pour_args: str = "") -> str:
    llm = get_llm()
    system = PROMPT_CONTRE if round == 1 else PROMPT_REFUTATION_CONTRE
    user_content = f"""
Décision à débattre : {decision}

Contexte de l'entreprise : {context}

{f'Arguments de l\'Agent Pour à réfuter : {pour_args}' if round > 1 else ''}
"""
    response = await llm.ainvoke([
        SystemMessage(content=system),
        HumanMessage(content=user_content),
    ])
    return response.content


async def run_agent_arbitre(decision: str, all_arguments: str) -> str:
    llm = get_llm()
    user_content = f"""
Décision débattue : {decision}

Historique complet du débat :
{all_arguments}
"""
    response = await llm.ainvoke([
        SystemMessage(content=PROMPT_ARBITRE),
        HumanMessage(content=user_content),
    ])
    return response.content


async def run_agent_question(question: str, context: str, agent_type: str) -> str:
    llm = get_llm()
    role = "défenseur" if agent_type == "POUR" else "opposant"
    user_content = f"""
Tu réponds en tant que {role} de la décision.
Contexte du débat : {context}
Question posée : {question}
"""
    response = await llm.ainvoke([
        SystemMessage(content=PROMPT_QUESTIONS),
        HumanMessage(content=user_content),
    ])
    return response.content


# ── Streaming version (for WebSocket) ────────────────────────────────────────

async def stream_agent(system_prompt: str, user_content: str) -> AsyncGenerator[str, None]:
    llm = get_llm(streaming=True)
    async for chunk in llm.astream([
        SystemMessage(content=system_prompt),
        HumanMessage(content=user_content),
    ]):
        if chunk.content:
            yield chunk.content
