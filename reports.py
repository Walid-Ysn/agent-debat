"""
routers/reports.py
Génération et export du rapport final en PDF.
"""
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from database import get_db, DebateSession, Argument, Report
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY
import os
from pathlib import Path
from datetime import datetime

router = APIRouter()
REPORTS_DIR = Path("reports")
REPORTS_DIR.mkdir(exist_ok=True)

# ── Colors ─────────────────────────────────────────────────────────────────────
GREEN       = colors.HexColor("#1B5E20")
MID_GREEN   = colors.HexColor("#2E7D32")
LIGHT_GREEN = colors.HexColor("#E8F5E9")
RED         = colors.HexColor("#B71C1C")
LIGHT_RED   = colors.HexColor("#FFCDD2")
BLUE        = colors.HexColor("#0D47A1")
LIGHT_BLUE  = colors.HexColor("#E3F2FD")
DARK        = colors.HexColor("#263238")
MID         = colors.HexColor("#546E7A")
LIGHT_GRAY  = colors.HexColor("#F5F5F5")

def build_pdf(session: DebateSession, arguments: list, output_path: str):
    doc = SimpleDocTemplate(
        output_path,
        pagesize=A4,
        leftMargin=2*cm, rightMargin=2*cm,
        topMargin=2.5*cm, bottomMargin=2*cm,
    )

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle("Title", parent=styles["Title"], fontSize=24, textColor=GREEN, spaceAfter=6, alignment=TA_CENTER)
    h1_style    = ParagraphStyle("H1", parent=styles["Heading1"], fontSize=16, textColor=GREEN, spaceAfter=8, spaceBefore=20)
    h2_style    = ParagraphStyle("H2", parent=styles["Heading2"], fontSize=13, textColor=MID_GREEN, spaceAfter=6, spaceBefore=14)
    body_style  = ParagraphStyle("Body", parent=styles["Normal"], fontSize=11, textColor=DARK, leading=16, alignment=TA_JUSTIFY)
    meta_style  = ParagraphStyle("Meta", parent=styles["Normal"], fontSize=10, textColor=MID, leading=14)
    pour_style  = ParagraphStyle("Pour", parent=styles["Normal"], fontSize=11, textColor=colors.HexColor("#1B5E20"), leading=16)
    contre_style= ParagraphStyle("Contre", parent=styles["Normal"], fontSize=11, textColor=RED, leading=16)

    story = []

    # ── Header ────────────────────────────────────────────────────────────────
    story.append(Paragraph("AGENT DÉBAT", title_style))
    story.append(Paragraph("Rapport de Décision", ParagraphStyle("sub", parent=styles["Normal"], fontSize=14, textColor=MID_GREEN, alignment=TA_CENTER)))
    story.append(HRFlowable(width="100%", thickness=3, color=GREEN, spaceAfter=12))

    # ── Session info ──────────────────────────────────────────────────────────
    info_data = [
        ["Session",    session.title],
        ["Décision",   session.decision],
        ["Domaine",    session.domain],
        ["Date",       datetime.now().strftime("%d/%m/%Y %H:%M")],
    ]
    info_table = Table(info_data, colWidths=[4*cm, 13*cm])
    info_table.setStyle(TableStyle([
        ("BACKGROUND", (0,0), (0,-1), LIGHT_GREEN),
        ("TEXTCOLOR",  (0,0), (0,-1), MID_GREEN),
        ("FONTNAME",   (0,0), (-1,-1), "Helvetica"),
        ("FONTSIZE",   (0,0), (-1,-1), 10),
        ("FONTNAME",   (0,0), (0,-1), "Helvetica-Bold"),
        ("GRID",       (0,0), (-1,-1), 0.5, colors.HexColor("#CCCCCC")),
        ("ROWBACKGROUNDS", (1,0), (1,-1), [colors.white]),
        ("VALIGN",     (0,0), (-1,-1), "TOP"),
        ("PADDING",    (0,0), (-1,-1), 6),
    ]))
    story.append(info_table)
    story.append(Spacer(1, 20))

    # ── Arguments by agent ────────────────────────────────────────────────────
    pour_args   = [a for a in arguments if a.agent_type == "POUR"]
    contre_args = [a for a in arguments if a.agent_type == "CONTRE"]
    arbitre     = next((a for a in arguments if a.agent_type == "ARBITRE"), None)

    # Agent Pour
    story.append(Paragraph("Arguments — Agent POUR", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=MID_GREEN, spaceAfter=8))
    for a in pour_args:
        story.append(Paragraph(f"Round {a.round_number}", h2_style))
        story.append(Paragraph(a.content.replace("\n", "<br/>"), pour_style))
        story.append(Spacer(1, 8))

    story.append(Spacer(1, 12))

    # Agent Contre
    story.append(Paragraph("Arguments — Agent CONTRE", h1_style))
    story.append(HRFlowable(width="100%", thickness=1, color=RED, spaceAfter=8))
    for a in contre_args:
        story.append(Paragraph(f"Round {a.round_number}", h2_style))
        story.append(Paragraph(a.content.replace("\n", "<br/>"), contre_style))
        story.append(Spacer(1, 8))

    story.append(Spacer(1, 16))

    # Arbitre recommendation
    if arbitre:
        story.append(HRFlowable(width="100%", thickness=2, color=BLUE, spaceAfter=8))
        story.append(Paragraph("Recommandation — Agent Arbitre", h1_style))
        story.append(HRFlowable(width="100%", thickness=1, color=BLUE, spaceAfter=10))
        story.append(Paragraph(arbitre.content.replace("\n", "<br/>"), body_style))

    story.append(Spacer(1, 24))
    story.append(HRFlowable(width="100%", thickness=1, color=MID, spaceAfter=6))
    story.append(Paragraph(f"Généré par Agent Débat — EMSI Casablanca — {datetime.now().strftime('%d/%m/%Y')}", meta_style))

    doc.build(story)

# ── Endpoint : generate and download PDF ──────────────────────────────────────
@router.get("/{session_id}/pdf")
async def download_report(session_id: str, db: Session = Depends(get_db)):
    session = db.query(DebateSession).filter(DebateSession.id == session_id).first()
    if not session:
        raise HTTPException(404, "Session introuvable")

    arguments = (
        db.query(Argument)
        .filter(Argument.session_id == session_id)
        .order_by(Argument.round_number, Argument.id)
        .all()
    )

    if not arguments:
        raise HTTPException(400, "Aucun argument trouvé — lancez d'abord un débat")

    pdf_path = str(REPORTS_DIR / f"rapport_{session_id}.pdf")
    build_pdf(session, arguments, pdf_path)

    return FileResponse(
        path=pdf_path,
        media_type="application/pdf",
        filename=f"rapport_debat_{session.title[:30].replace(' ','_')}.pdf",
    )
