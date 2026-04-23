"""
Render docs/OHCS-Website-PRD.md to a designed PDF.

Pipeline: markdown-it-py → HTML + embedded Kente-themed CSS → Playwright
(headless Chromium) → PDF.

Usage:  python docs/build_prd_pdf.py
"""

from __future__ import annotations

import re
from pathlib import Path

from markdown_it import MarkdownIt
from playwright.sync_api import sync_playwright
from pypdf import PdfReader, PdfWriter

ROOT = Path(__file__).resolve().parent
DOC_MD = ROOT / "OHCS-Website-PRD.md"
TMP_HTML_BODY = ROOT / "_body.html"
TMP_HTML_TITLE = ROOT / "_title.html"
TMP_PDF_BODY = ROOT / "_body.pdf"
TMP_PDF_TITLE = ROOT / "_title.pdf"
OUT_PDF = ROOT / "OHCS-Website-PRD.pdf"


CSS = r"""
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700;800;900&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=JetBrains+Mono:wght@400;500&display=swap');

@page {
  size: A4;
  margin: 22mm 18mm 24mm 18mm;
}

@page :first {
  margin: 0;
}

* { box-sizing: border-box; }

html, body {
  margin: 0;
  padding: 0;
  font-family: 'Libre Baskerville', Georgia, serif;
  font-size: 10.5pt;
  line-height: 1.55;
  color: #1A1A1A;
  background: #FDFAF5;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}

/* ---------- Title page ---------- */

.title-page {
  height: 297mm;
  width: 210mm;
  padding: 0;
  position: relative;
  background: linear-gradient(160deg, #0E3819 0%, #1B5E20 50%, #2E7D32 100%);
  color: #FDFAF5;
  page-break-after: always;
  overflow: hidden;
}

.title-page::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image:
    repeating-linear-gradient(0deg, rgba(212,160,23,0.06) 0 1px, transparent 1px 38px),
    repeating-linear-gradient(90deg, rgba(212,160,23,0.06) 0 1px, transparent 1px 38px);
  pointer-events: none;
}

.title-page::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 14px;
  background:
    linear-gradient(90deg,
      #D4A017 0 16.66%,
      #B71C1C 16.66% 33.32%,
      #1B5E20 33.32% 49.98%,
      #D4A017 49.98% 66.64%,
      #B71C1C 66.64% 83.30%,
      #1B5E20 83.30% 100%
    );
}

.title-inner {
  position: relative;
  z-index: 2;
  padding: 26mm 22mm 20mm 22mm;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 100%;
}

.title-eyebrow {
  font-family: 'Libre Baskerville', serif;
  font-size: 10pt;
  letter-spacing: 0.32em;
  text-transform: uppercase;
  color: #E8C547;
  margin-bottom: 16mm;
}

.title-stripe {
  width: 64px;
  height: 4px;
  background: #D4A017;
  margin-bottom: 12mm;
}

.title-page h1.doc-title {
  font-family: 'Playfair Display', serif;
  font-weight: 800;
  font-size: 44pt;
  line-height: 1.05;
  margin: 0 0 8mm 0;
  color: #FFFFFF;
  letter-spacing: -0.5pt;
}

.title-page .doc-subtitle {
  font-family: 'Playfair Display', serif;
  font-size: 18pt;
  font-weight: 500;
  font-style: italic;
  color: #E8C547;
  margin-bottom: 14mm;
}

.title-page .doc-tagline {
  font-family: 'Libre Baskerville', serif;
  font-size: 11.5pt;
  font-style: italic;
  color: rgba(253,250,245,0.92);
  max-width: 130mm;
  line-height: 1.55;
  margin-bottom: auto;
}

.title-meta {
  border-collapse: collapse;
  margin-top: 12mm;
  width: 130mm;
  background: transparent;
}

.title-meta tr,
.title-meta tr:nth-child(even),
.title-meta tr:hover {
  background: transparent !important;
}

.title-meta tr th,
.title-meta tr td,
.title-meta tr:nth-child(even) td,
.title-meta tr:hover td {
  background: transparent !important;
  padding: 6px 14px 6px 0;
  vertical-align: top;
  font-size: 10pt;
  border: none;
  border-bottom: 1px solid rgba(232,197,71,0.25);
}

.title-meta td:first-child {
  font-family: 'Libre Baskerville', serif;
  font-weight: 700;
  color: #E8C547;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  font-size: 8.5pt;
  width: 36mm;
  white-space: nowrap;
  padding-top: 9px;
}

.title-meta td:nth-child(2) {
  color: rgba(253,250,245,0.95);
  padding-left: 0;
}

.title-meta strong { color: #FFFFFF; }

/* ---------- Body ---------- */

.body-wrap {
  background: #FDFAF5;
}

h1, h2, h3, h4, h5 {
  font-family: 'Playfair Display', serif;
  color: #0E3819;
  font-weight: 700;
  margin-top: 0;
}

h1 {
  font-size: 22pt;
  letter-spacing: -0.3pt;
  border-bottom: 2px solid #D4A017;
  padding-bottom: 8px;
  margin-top: 18px;
  margin-bottom: 18px;
  page-break-before: always;
  page-break-after: avoid;
}

h1:first-of-type {
  page-break-before: auto;
}

/* The numbered section heading "1. Executive Summary" gets a tinted background */
h1::before {
  display: block;
  font-size: 9pt;
  letter-spacing: 0.32em;
  text-transform: uppercase;
  color: #B71C1C;
  margin-bottom: 6px;
  font-family: 'Libre Baskerville', serif;
  font-weight: 700;
  font-style: normal;
  content: 'OHCS DIGITAL PORTAL · PRD';
}

h2 {
  font-size: 15pt;
  margin-top: 22px;
  margin-bottom: 12px;
  color: #1B5E20;
  page-break-after: avoid;
}

h3 {
  font-size: 12pt;
  margin-top: 18px;
  margin-bottom: 8px;
  color: #1B5E20;
  page-break-after: avoid;
}

p {
  margin: 0 0 10px 0;
  text-align: justify;
  hyphens: auto;
}

a { color: #1B5E20; text-decoration: none; border-bottom: 1px dotted #D4A017; }

strong { color: #0E3819; font-weight: 700; }

em { color: #5C5549; }

ul, ol { margin: 6px 0 12px 0; padding-left: 22px; }
li { margin-bottom: 4px; }

code {
  font-family: 'JetBrains Mono', monospace;
  font-size: 9pt;
  background: rgba(27,94,32,0.07);
  color: #0E3819;
  padding: 1px 5px;
  border-radius: 3px;
}

pre {
  background: #0E3819;
  color: #E8C547;
  padding: 10px 14px;
  border-radius: 6px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 8.5pt;
  line-height: 1.5;
  overflow-x: auto;
  page-break-inside: avoid;
}

pre code { background: transparent; color: inherit; padding: 0; }

/* ---------- Tables ---------- */

table {
  width: 100%;
  border-collapse: collapse;
  margin: 10px 0 16px 0;
  font-size: 9.5pt;
  page-break-inside: avoid;
}

table th {
  background: #1B5E20;
  color: #FDFAF5;
  font-family: 'Playfair Display', serif;
  font-weight: 600;
  font-size: 9.5pt;
  text-align: left;
  padding: 7px 10px;
  border-bottom: 2px solid #D4A017;
}

table td {
  padding: 7px 10px;
  border-bottom: 1px solid #E5DDD0;
  vertical-align: top;
}

table tr:nth-child(even) td { background: rgba(253,250,245,0.6); }

table tr:hover td { background: rgba(212,160,23,0.06); }

/* ---------- Hero stat strip (first table in Executive Summary) ---------- */

.hero-stats {
  margin: 14px 0 20px 0;
  background: #0E3819;
  border-radius: 8px;
  overflow: hidden;
}

.hero-stats table {
  margin: 0;
  background: transparent;
}

.hero-stats td {
  background: transparent !important;
  border: none;
  text-align: center;
  padding: 14px 6px 6px 6px;
  color: #FDFAF5;
  width: 16.66%;
  vertical-align: middle;
  border-right: 1px solid rgba(212,160,23,0.18);
}

.hero-stats td:last-child { border-right: none; }

.hero-stats tr:first-child td {
  font-family: 'Playfair Display', serif;
  font-size: 26pt;
  font-weight: 800;
  color: #E8C547;
  padding-top: 16px;
  padding-bottom: 0;
}

.hero-stats tr:nth-child(2) td {
  font-family: 'Libre Baskerville', serif;
  font-size: 8pt;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: rgba(253,250,245,0.85);
  padding-top: 4px;
  padding-bottom: 14px;
  font-weight: 400;
  background: transparent !important;
}

.hero-stats tr:hover td { background: transparent !important; }

/* ---------- Blockquotes / pull quotes ---------- */

blockquote {
  margin: 18px 0;
  padding: 12px 18px 12px 18px;
  border-left: 4px solid #D4A017;
  background: rgba(212,160,23,0.07);
  font-family: 'Playfair Display', serif;
  font-size: 12pt;
  font-style: italic;
  font-weight: 500;
  line-height: 1.5;
  color: #0E3819;
  page-break-inside: avoid;
}

blockquote p { margin: 0; text-align: left; }

blockquote strong { color: #B71C1C; }

/* ---------- Horizontal rules ---------- */

hr {
  border: none;
  border-top: 1px solid #E5DDD0;
  margin: 18px 0;
}

/* ---------- TOC ---------- */

.toc-wrap ol {
  list-style: none;
  padding-left: 0;
  counter-reset: section;
}

.toc-wrap ol li {
  counter-increment: section;
  padding: 8px 0;
  border-bottom: 1px dotted #E5DDD0;
  font-size: 10.5pt;
  display: flex;
  align-items: baseline;
}

.toc-wrap ol li::before {
  content: counter(section, decimal-leading-zero);
  font-family: 'Playfair Display', serif;
  font-weight: 700;
  color: #D4A017;
  width: 36px;
  flex-shrink: 0;
}

/* ---------- Closing block ---------- */

.closing {
  margin-top: 24mm;
  padding: 12mm 0 0 0;
  border-top: 4px solid #D4A017;
  text-align: center;
  font-family: 'Playfair Display', serif;
  page-break-before: always;
}

.closing .crest {
  font-size: 16pt;
  font-weight: 700;
  color: #0E3819;
  margin-bottom: 4px;
}

.closing .republic {
  font-size: 11pt;
  color: #5C5549;
  margin-bottom: 6px;
}

.closing .motto {
  font-style: italic;
  color: #B71C1C;
  font-size: 11pt;
  letter-spacing: 0.1em;
  margin-bottom: 18mm;
}

.closing .prepared {
  font-family: 'Libre Baskerville', serif;
  font-style: italic;
  color: #5C5549;
  font-size: 9.5pt;
}

/* keep tables and figures intact */
table, figure, blockquote, pre { page-break-inside: avoid; }
"""


TITLE_HTML = """<section class="title-page">
  <div class="title-inner">
    <div>
      <div class="title-eyebrow">Office of the Head of the Civil Service · Republic of Ghana</div>
      <div class="title-stripe"></div>
      <h1 class="doc-title">OHCS Digital Portal<br>&amp; Recruitment Platform</h1>
      <div class="doc-subtitle">Product Requirements Document</div>
      <div class="doc-tagline">
        The Official Web Presence and End-to-End Recruitment System of the
        Office of the Head of the Civil Service, Republic of Ghana.
        Built for citizens, for prospective recruits, and for the officers
        who serve them.
      </div>
    </div>

    <table class="title-meta">
      <tr><td>Document</td><td><strong>PRD v1.0.0</strong></td></tr>
      <tr><td>Date</td><td>April 2026</td></tr>
      <tr><td>Author</td><td>OHCS Product Engineering</td></tr>
      <tr><td>Status</td><td>Production — Sub-project A shipped, B–D scoped</td></tr>
      <tr><td>For</td><td>Head of the Civil Service · Permanent Secretaries · Civil Service Council</td></tr>
      <tr><td>Classification</td><td>Internal — OHCS Leadership</td></tr>
    </table>
  </div>
</section>
"""


CLOSING_HTML = """<div class="closing">
  <div class="crest">Office of the Head of the Civil Service</div>
  <div class="republic">Republic of Ghana</div>
  <div class="motto">Loyalty &middot; Excellence &middot; Service</div>
  <div class="prepared">Prepared by OHCS Product Engineering &middot; April 2026</div>
  <div class="prepared" style="margin-top:6mm;">
    <code>https://ohcs.pages.dev</code> (production)
    &middot; <code>https://ohcs.gov.gh</code> (target)
  </div>
</div>
"""


def slice_off_title_block(md_text: str) -> str:
    """The markdown source begins with a title block — h1 title, subtitle,
    tagline, then `---`, then a metadata table, then another `---` before
    the Table of Contents heading. We render the title page from a custom
    HTML template (TITLE_HTML) instead, so strip everything up to and
    including the SECOND standalone `---` so that body markdown starts at
    the TOC heading."""
    lines = md_text.splitlines()
    seen = 0
    for i, line in enumerate(lines):
        if line.strip() == "---":
            seen += 1
            if seen == 2:
                return "\n".join(lines[i + 1 :])
    return md_text


def enhance_html(html: str) -> str:
    """Post-process markdown-rendered HTML to add the design-specific class
    hooks the CSS expects."""
    # 1) Tag the first table that follows the Executive Summary heading as
    #    the hero stats strip. The structure in the markdown is:
    #       <h1>1. Executive Summary</h1>
    #       <p>...</p>
    #       <blockquote>...</blockquote>
    #       <table>...</table>          <-- this one
    #
    #    Wrap that first table in <div class="hero-stats">.
    pattern = re.compile(
        r"(<h1[^>]*>1\.\s*Executive Summary</h1>.*?)(<table>)",
        re.DOTALL,
    )

    def wrap_first_table(m: re.Match[str]) -> str:
        return m.group(1) + '<div class="hero-stats"><table>'

    html, n = pattern.subn(wrap_first_table, html, count=1)
    if n == 1:
        # Close the wrapping div after the corresponding </table>.
        idx = html.find('<div class="hero-stats"><table>')
        end = html.find("</table>", idx)
        if end != -1:
            html = html[: end + len("</table>")] + "</div>" + html[end + len("</table>") :]

    # 2) Wrap the Table of Contents ordered list in .toc-wrap so the CSS
    #    can target it with numbered prefixes.
    html = re.sub(
        r"(<h2[^>]*>Table of Contents</h2>)\s*(<ol>)",
        r'\1<div class="toc-wrap"><ol>',
        html,
        count=1,
    )
    # Close that wrapper at the next </ol>.
    if 'class="toc-wrap"' in html:
        idx = html.find('<div class="toc-wrap"><ol>')
        end = html.find("</ol>", idx)
        if end != -1:
            html = html[: end + len("</ol>")] + "</div>" + html[end + len("</ol>") :]

    # 3) Strip the closing branding block at the very end of the markdown
    #    (we render our own designed version via CLOSING_HTML).
    html = re.sub(
        r"<hr\s*/?>\s*<p[^>]*>"
        r".*?Prepared by OHCS Product Engineering.*?"
        r"</p>\s*$",
        "",
        html,
        flags=re.DOTALL,
    )

    return html


PAGE_DOC = """<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>{title}</title>
<style>{css}</style></head><body>{body}</body></html>"""


HEADER_TEMPLATE = (
    '<div style="font-family: Georgia, serif; font-size: 8pt; '
    'color: #5C5549; width: 100%; padding: 0 18mm;">'
    '<span style="float:left;">OHCS Digital Portal &middot; PRD v1.0.0</span>'
    '<span style="float:right;">Internal &mdash; OHCS Leadership</span>'
    '</div>'
)

FOOTER_TEMPLATE = (
    '<div style="font-family: Georgia, serif; font-size: 8pt; '
    'color: #5C5549; width: 100%; padding: 0 18mm; text-align: center;">'
    'Page <span class="pageNumber"></span> of '
    '<span class="totalPages"></span>'
    '</div>'
)


def build_body_html() -> str:
    md_text = slice_off_title_block(DOC_MD.read_text(encoding="utf-8"))
    md = (
        MarkdownIt("commonmark", {"html": True, "linkify": False})
        .enable(["table", "strikethrough"])
    )
    body_html = md.render(md_text)
    body_html = enhance_html(body_html)
    body_html = f'<div class="body-wrap">{body_html}{CLOSING_HTML}</div>'
    return PAGE_DOC.format(
        title="OHCS Digital Portal &amp; Recruitment Platform — PRD v1.0.0",
        css=CSS,
        body=body_html,
    )


def build_title_html() -> str:
    return PAGE_DOC.format(
        title="OHCS Digital Portal &amp; Recruitment Platform — PRD v1.0.0",
        css=CSS,
        body=TITLE_HTML,
    )


def render_pdf() -> None:
    TMP_HTML_TITLE.write_text(build_title_html(), encoding="utf-8")
    TMP_HTML_BODY.write_text(build_body_html(), encoding="utf-8")

    with sync_playwright() as p:
        browser = p.chromium.launch()

        # ----- Title page: full bleed, no margins, no header/footer.
        page = browser.new_page()
        page.goto(
            "file:///" + TMP_HTML_TITLE.absolute().as_posix(),
            wait_until="networkidle",
        )
        page.emulate_media(media="print")
        page.pdf(
            path=str(TMP_PDF_TITLE),
            format="A4",
            print_background=True,
            display_header_footer=False,
            margin={"top": "0", "bottom": "0", "left": "0", "right": "0"},
        )

        # ----- Body: standard margins, running header + footer.
        page2 = browser.new_page()
        page2.goto(
            "file:///" + TMP_HTML_BODY.absolute().as_posix(),
            wait_until="networkidle",
        )
        page2.emulate_media(media="print")
        page2.pdf(
            path=str(TMP_PDF_BODY),
            format="A4",
            print_background=True,
            display_header_footer=True,
            header_template=HEADER_TEMPLATE,
            footer_template=FOOTER_TEMPLATE,
            margin={"top": "22mm", "bottom": "22mm", "left": "18mm", "right": "18mm"},
        )

        browser.close()

    # ----- Merge title + body via pypdf.
    writer = PdfWriter()
    for src in (TMP_PDF_TITLE, TMP_PDF_BODY):
        for pg in PdfReader(str(src)).pages:
            writer.add_page(pg)
    writer.add_metadata(
        {
            "/Title": "OHCS Digital Portal & Recruitment Platform — PRD v1.0.0",
            "/Author": "OHCS Product Engineering",
            "/Subject": "Product Requirements Document",
            "/Keywords": "OHCS, Civil Service, Ghana, Recruitment, Lexi",
            "/Creator": "build_prd_pdf.py",
        }
    )
    with open(OUT_PDF, "wb") as fh:
        writer.write(fh)

    # ----- Cleanup tmp artefacts.
    for f in (TMP_HTML_TITLE, TMP_HTML_BODY, TMP_PDF_TITLE, TMP_PDF_BODY):
        try:
            f.unlink()
        except FileNotFoundError:
            pass

    print(f"Wrote {OUT_PDF.relative_to(ROOT.parent)}")


if __name__ == "__main__":
    render_pdf()
