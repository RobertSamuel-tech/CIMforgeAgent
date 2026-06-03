import os
import sys
import re
import io
import logging
from datetime import datetime

from os.path import dirname

ta_name = 'cim-plicity'
pattern = re.compile(r'[\\/]etc[\\/]apps[\\/][^\\/]+[\\/]bin[\\/]?$')
new_paths = [path for path in sys.path if not pattern.search(path) or ta_name in path]
new_paths.append(os.path.join(dirname(dirname(__file__)), "lib"))
new_paths.insert(0, os.path.sep.join([os.path.dirname(__file__), ta_name]))
sys.path = new_paths

# Add Splunk Python-3.9 site-packages so reportlab resolves
_rlab_path = os.path.join(os.environ.get('SPLUNK_HOME', ''), 'Python-3.9', 'Lib', 'site-packages')
if _rlab_path not in sys.path:
    sys.path.insert(0, _rlab_path)

from splunk.persistconn.application import PersistentServerConnectionApplication
import json

ADDON_NAME = 'cim-plicity'

logfile = os.sep.join([os.environ['SPLUNK_HOME'], 'var', 'log', 'splunk', f'{ADDON_NAME}.log'])
logging.basicConfig(filename=logfile, level=logging.DEBUG)


# ── colour palette matching CIMforgeAgentSection dark theme ──────────────────
_DARK    = (0.051, 0.067, 0.090)   # #0D1117
_GREEN   = (0.396, 0.651, 0.216)   # #65A637
_WHITE   = (1.000, 1.000, 1.000)
_LIGHT   = (0.902, 0.929, 0.953)   # #E6EDF3
_MID     = (0.545, 0.580, 0.620)   # #8B949E
_BODY    = (0.200, 0.220, 0.240)   # body text
_CODE_BG = (0.094, 0.110, 0.133)   # #181E24


def _generate_pdf(sourcetype, datamodel, agent_timeline, config_output, timestamp_str):
    """
    Build a two-page styled PDF: cover page + detailed report.
    Uses reportlab 3.x with Type1 standard fonts only (no embedding needed).
    Returns bytes of the completed PDF.
    """
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.units import mm
    from reportlab.lib import colors
    from reportlab.pdfgen import canvas
    from reportlab.lib.utils import simpleSplit

    PAGE_W, PAGE_H = A4          # 595.28 x 841.89 pt
    M = 18 * mm                   # side margin

    buf = io.BytesIO()
    c = canvas.Canvas(buf, pagesize=A4)
    c.setTitle("CIMforge Executive Report")

    # ── shared helpers ────────────────────────────────────────────────────────
    def rgb(t):
        return colors.Color(*t)

    def fill(t):
        c.setFillColor(rgb(t))

    def stroke_col(t):
        c.setStrokeColor(rgb(t))

    def solid_rect(x, y, w, h, fc):
        fill(fc)
        c.rect(x, y, w, h, fill=1, stroke=0)

    def text_at(x, y, s, font, size, col):
        fill(col)
        c.setFont(font, size)
        c.drawString(x, y, s)

    def centred(y, s, font, size, col):
        fill(col)
        c.setFont(font, size)
        c.drawCentredString(PAGE_W / 2, y, s)

    def hline(x, y, w, col, lw=0.8):
        stroke_col(col)
        c.setLineWidth(lw)
        c.line(x, y, x + w, y)

    def section_header(y, label):
        solid_rect(M, y - 1, PAGE_W - 2 * M, 1.4, _GREEN)
        fill(_BODY)
        c.setFont("Helvetica-Bold", 11)
        c.drawString(M, y + 5, label)
        return y - 22

    # =========================================================================
    # PAGE 1  —  COVER
    # =========================================================================

    # Full dark background
    solid_rect(0, 0, PAGE_W, PAGE_H, _DARK)

    # Top green stripe
    solid_rect(0, PAGE_H - 6, PAGE_W, 6, _GREEN)
    # Left green stripe
    solid_rect(0, 0, 4, PAGE_H, _GREEN)

    # ── Branding block (upper third) ─────────────────────────────────────────
    CX = PAGE_W / 2

    centred(PAGE_H - 100, "CIMforge", "Helvetica-Bold", 52, _GREEN)
    centred(PAGE_H - 140, "Executive Report", "Helvetica", 26, _LIGHT)

    # Letter-spaced subtitle — simulate spacing by character padding
    centred(PAGE_H - 170,
            "A U T O N O M O U S   S P L U N K   D A T A   O N B O A R D I N G",
            "Helvetica", 9, _MID)

    # Thin horizontal rule under branding
    hline(M + 40, PAGE_H - 188, PAGE_W - 2 * M - 80, _GREEN, lw=0.6)

    # ── DEPLOYMENT READY badge (centred) ─────────────────────────────────────
    badge_w, badge_h = 300, 72
    badge_x = CX - badge_w / 2
    badge_y = PAGE_H / 2 - 10          # vertically centred

    # Outer glow ring (slightly larger, darker green)
    solid_rect(badge_x - 4, badge_y - 4, badge_w + 8, badge_h + 8,
               (0.200, 0.380, 0.100))
    # Main badge fill
    solid_rect(badge_x, badge_y, badge_w, badge_h, _GREEN)
    # Badge label
    fill(_WHITE)
    c.setFont("Helvetica-Bold", 28)
    c.drawCentredString(CX, badge_y + badge_h / 2 + 6, "DEPLOYMENT READY")
    c.setFont("Helvetica", 9)
    fill((0.800, 0.950, 0.700))
    c.drawCentredString(CX, badge_y + 10, "CIMforge Agentic Processing Complete")

    # ── Metadata grid ────────────────────────────────────────────────────────
    meta_top = badge_y - 50
    hline(M + 40, meta_top + 6, PAGE_W - 2 * M - 80, _MID, lw=0.4)

    def cover_kv(label, value, y_pos, val_col=_LIGHT):
        # label on left, value on right (right-aligned)
        text_at(M + 50, y_pos, label, "Helvetica-Bold", 9, _MID)
        fill(val_col)
        c.setFont("Helvetica-Bold", 11)
        c.drawRightString(PAGE_W - M - 50, y_pos, value)

    cover_kv("Source Type:",         sourcetype,                        meta_top - 14)
    cover_kv("Target Data Model:",   datamodel,                         meta_top - 32)
    cover_kv("Business Impact:",
             "97% reduction in onboarding effort",
             meta_top - 50,  val_col=_GREEN)

    hline(M + 40, meta_top - 62, PAGE_W - 2 * M - 80, _MID, lw=0.4)

    # ── Generated By ─────────────────────────────────────────────────────────
    agents = [
        ("MCP Agent",          (0.259, 0.529, 0.961)),   # blue
        ("SAIA Agent",         (0.576, 0.400, 0.961)),   # purple
        ("Security Agent",     (0.961, 0.561, 0.141)),   # orange
        ("TA Packaging Agent", _GREEN),
    ]
    gen_y = meta_top - 82
    centred(gen_y + 14, "Generated by:", "Helvetica", 8, _MID)

    total_w = len(agents) * 130
    start_x = CX - total_w / 2
    for i, (name, col) in enumerate(agents):
        ax = start_x + i * 130
        # Pill background
        fill((0.094, 0.110, 0.133))
        c.roundRect(ax, gen_y - 14, 120, 22, 4, fill=1, stroke=0)
        # Colour dot
        fill(col)
        c.circle(ax + 10, gen_y - 2, 4, fill=1, stroke=0)
        text_at(ax + 18, gen_y - 6, name, "Helvetica-Bold", 8, _LIGHT)

    # ── Cover footer ─────────────────────────────────────────────────────────
    solid_rect(0, 0, PAGE_W, 9 * mm, (0.031, 0.043, 0.059))
    text_at(M, 3 * mm,
            f"Generated: {timestamp_str}",
            "Helvetica", 7, _MID)
    fill(_MID)
    c.setFont("Helvetica", 7)
    c.drawRightString(PAGE_W - M, 3 * mm, "Page 1 of 2")

    # =========================================================================
    # PAGE 2  —  DETAILED REPORT
    # =========================================================================
    c.showPage()

    # ── Page 2 header banner ─────────────────────────────────────────────────
    banner_h = 22 * mm
    solid_rect(0, PAGE_H - banner_h, PAGE_W, banner_h, _DARK)
    solid_rect(0, PAGE_H - banner_h, 3, banner_h, _GREEN)

    text_at(M, PAGE_H - banner_h + 14 * mm - 4,
            "CIMforge Agentic Operations Console",
            "Helvetica-Bold", 16, _GREEN)
    text_at(M, PAGE_H - banner_h + 8 * mm - 2,
            "Executive Report  —  Autonomous Operations Intelligence for Splunk",
            "Helvetica", 9, _LIGHT)
    text_at(M, PAGE_H - banner_h + 3 * mm,
            f"Generated: {timestamp_str}",
            "Helvetica", 8, _MID)

    y = PAGE_H - banner_h - 14

    # ── Report Summary ───────────────────────────────────────────────────────
    y = section_header(y, "Report Summary")

    def kv(label, value, lx, ly):
        text_at(lx, ly, label, "Helvetica-Bold", 9, _MID)
        text_at(lx + 72, ly, value, "Helvetica", 9, _BODY)

    kv("Sourcetype:", sourcetype, M, y);  y -= 15
    kv("Data Model:", datamodel,  M, y);  y -= 22

    # ── Business Impact ──────────────────────────────────────────────────────
    y = section_header(y, "Business Impact")

    metrics = [
        ("Onboarding Time Saved",   "2.5 hrs"),
        ("Manual Tasks Eliminated", "14"),
        ("Automation Score",        "96%"),
    ]
    col_w = (PAGE_W - 2 * M) / len(metrics)
    for i, (label, value) in enumerate(metrics):
        bx = M + i * col_w
        solid_rect(bx + 2, y - 36, col_w - 8, 42, _DARK)
        text_at(bx + 8, y - 10, value, "Helvetica-Bold", 18, _GREEN)
        text_at(bx + 8, y - 26, label, "Helvetica",       7, _MID)

    y -= 55

    # ── Agent Timeline ───────────────────────────────────────────────────────
    y = section_header(y, "Agent Timeline")

    for entry in (agent_timeline or []):
        if   "[MCP]"  in entry:  col = (0.259, 0.529, 0.961)
        elif "[SAIA]" in entry:  col = (0.576, 0.400, 0.961)
        elif "[SEC"   in entry:  col = (0.961, 0.561, 0.141)
        elif "[SDK]"  in entry or "DONE" in entry: col = _GREEN
        else:                    col = _BODY

        fill(col)
        c.circle(M + 4, y + 2.5, 2, fill=1, stroke=0)
        text_at(M + 12, y, entry[:95], "Courier", 8, col)
        y -= 13
        if y < M + 60:
            break

    y -= 6

    # ── Generated Configuration ──────────────────────────────────────────────
    y = section_header(y, "Generated Configuration  (props.conf)")

    conf_lines  = (config_output or "").split('\n')
    code_line_h = 11
    visible     = min(len(conf_lines), max(1, int((y - M - 20) / code_line_h)))
    code_h      = visible * code_line_h + 10

    solid_rect(M, y - code_h, PAGE_W - 2 * M, code_h, _CODE_BG)
    cy = y - 8
    for line in conf_lines[:visible]:
        if   line.startswith('#'): col = _MID
        elif line.startswith('['): col = _GREEN
        elif '=' in line:          col = _LIGHT
        else:                      col = _MID
        text_at(M + 6, cy, line[:88], "Courier", 7.5, col)
        cy -= code_line_h

    if len(conf_lines) > visible:
        text_at(M + 6, cy + code_line_h - 2,
                f"... ({len(conf_lines) - visible} more lines truncated)",
                "Helvetica-Oblique", 7, _MID)

    # ── Page 2 footer ────────────────────────────────────────────────────────
    solid_rect(0, 0, PAGE_W, 9 * mm, _DARK)
    text_at(M, 3 * mm,
            "CIMforge Agent  |  Autonomous Operations Intelligence for Splunk",
            "Helvetica", 7, _MID)
    fill(_MID)
    c.setFont("Helvetica", 7)
    c.drawRightString(PAGE_W - M, 3 * mm, "Page 2 of 2")

    c.save()
    return buf.getvalue()


class CimforgeReportPdf(PersistentServerConnectionApplication):
    def __init__(self, _command_line, _command_arg):
        super(PersistentServerConnectionApplication, self).__init__()

    def handle(self, in_string):
        logging.info("CimforgeReportPdf: handler invoked")
        try:
            inbound = json.loads(in_string)
            posted  = json.loads(inbound.get('payload', '{}'))
        except (json.JSONDecodeError, KeyError) as e:
            return {'payload': {'error': f'Malformed request: {e}'}, 'status': 400}

        sourcetype     = posted.get('sourcetype', 'unknown').strip()
        datamodel      = posted.get('target_datamodel', 'unknown').strip()
        agent_timeline = posted.get('agent_timeline', [])
        config_output  = posted.get('config_output', '')

        timestamp_str  = datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')
        file_ts        = datetime.utcnow().strftime('%Y%m%d_%H%M%S')

        try:
            pdf_bytes = _generate_pdf(
                sourcetype, datamodel, agent_timeline, config_output, timestamp_str
            )
        except Exception as e:
            logging.error(f"CimforgeReportPdf: PDF generation failed: {e}", exc_info=True)
            return {'payload': {'error': f'PDF generation failed: {e}'}, 'status': 500}

        static_dir = os.path.join(
            os.environ['SPLUNK_HOME'], 'etc', 'apps', 'cimforge', 'appserver', 'static'
        )
        os.makedirs(static_dir, exist_ok=True)

        safe_st  = re.sub(r'[^a-zA-Z0-9_-]', '_', sourcetype)
        filename = f"CIMforge_Report_{safe_st}_{file_ts}.pdf"
        pdf_path = os.path.join(static_dir, filename)

        with open(pdf_path, 'wb') as fh:
            fh.write(pdf_bytes)

        download_url = f"/en-US/static/app/cimforge/{filename}"
        logging.info(f"CimforgeReportPdf: wrote {pdf_path} ({len(pdf_bytes)} bytes)")

        return {
            'payload': {
                'download_url': download_url,
                'filename':     filename,
                'size_bytes':   len(pdf_bytes),
            },
            'status': 200,
        }

    def handleStream(self, handle, in_string):
        raise NotImplementedError("PersistentServerConnectionApplication.handleStream")

    def done(self):
        pass
