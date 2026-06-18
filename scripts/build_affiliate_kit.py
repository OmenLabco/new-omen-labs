#!/usr/bin/env python3
"""Build the Omen Labs Affiliate Outreach Kit PDF — on-brand (white + periwinkle/blue)."""
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_LEFT, TA_CENTER
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, Flowable
)

OUT = "/Users/drakob/Desktop/Omen-Labs-Affiliate-Kit.pdf"

# ---- Brand palette ----
BLUE      = colors.HexColor("#2b6bff")   # primary
BLUE_DK   = colors.HexColor("#1746c7")
INK       = colors.HexColor("#0a0a0b")
SLATE     = colors.HexColor("#52566b")
PERI      = colors.HexColor("#eef0fb")   # soft periwinkle fill
PERI_DK   = colors.HexColor("#dde2f6")
MINT      = colors.HexColor("#eaf6f0")
GREEN     = colors.HexColor("#138a5e")
LINE      = colors.HexColor("#e4e7f2")
WHITE     = colors.white

styles = getSampleStyleSheet()

def S(name, **kw):
    return ParagraphStyle(name, parent=styles["Normal"], **kw)

body      = S("body", fontName="Helvetica", fontSize=10.5, leading=16, textColor=INK)
body_sl   = S("body_sl", fontName="Helvetica", fontSize=10.5, leading=16, textColor=SLATE)
h_section = S("h_section", fontName="Helvetica-Bold", fontSize=15, leading=18, textColor=INK, spaceBefore=4, spaceAfter=6)
eyebrow   = S("eyebrow", fontName="Helvetica-Bold", fontSize=8, leading=11, textColor=BLUE,
              spaceAfter=2)  # tracking simulated via caps
sub_lbl   = S("sub_lbl", fontName="Helvetica-Bold", fontSize=10.5, leading=14, textColor=BLUE_DK)
chip_num  = S("chip_num", fontName="Helvetica-Bold", fontSize=20, leading=22, textColor=WHITE, alignment=TA_CENTER)
chip_lbl  = S("chip_lbl", fontName="Helvetica", fontSize=7.5, leading=10, textColor=WHITE, alignment=TA_CENTER)
quote     = S("quote", fontName="Helvetica", fontSize=10.5, leading=16, textColor=INK)
subj      = S("subj", fontName="Helvetica-Bold", fontSize=11.5, leading=15, textColor=INK)
small     = S("small", fontName="Helvetica", fontSize=8.5, leading=12, textColor=SLATE)
foot      = S("foot", fontName="Helvetica", fontSize=8, leading=10, textColor=SLATE, alignment=TA_CENTER)


class HBar(Flowable):
    """Thin colored rule."""
    def __init__(self, width, color=BLUE, thickness=2):
        super().__init__(); self.width=width; self.color=color; self.thickness=thickness
    def draw(self):
        self.canv.setStrokeColor(self.color); self.canv.setLineWidth(self.thickness)
        self.canv.line(0,0,self.width,0)


def hexagon(c, cx, cy, r, fill, stroke=None, sw=2):
    import math
    pts=[]
    for i in range(6):
        a=math.radians(60*i-90)
        pts.append((cx+r*math.cos(a), cy+r*math.sin(a)))
    p=c.beginPath(); p.moveTo(*pts[0])
    for x,y in pts[1:]: p.lineTo(x,y)
    p.close()
    if fill: c.setFillColor(fill)
    if stroke: c.setStrokeColor(stroke); c.setLineWidth(sw)
    c.drawPath(p, fill=1 if fill else 0, stroke=1 if stroke else 0)


def header_footer(c, doc):
    w,h = letter
    # top brand band
    c.setFillColor(INK); c.rect(0, h-0.95*inch, w, 0.95*inch, fill=1, stroke=0)
    c.setFillColor(BLUE); c.rect(0, h-0.95*inch, w, 0.06*inch, fill=1, stroke=0)
    # hex logo
    hexagon(c, 0.85*inch, h-0.5*inch, 0.20*inch, None, stroke=BLUE, sw=2.2)
    c.setFillColor(BLUE); c.circle(0.85*inch, h-0.5*inch, 0.035*inch, fill=1, stroke=0)
    # wordmark
    c.setFillColor(WHITE); c.setFont("Helvetica-Bold", 14)
    c.drawString(1.15*inch, h-0.46*inch, "OMEN LABS")
    c.setFillColor(colors.HexColor("#9aa0b8")); c.setFont("Helvetica", 7.5)
    c.drawString(1.16*inch, h-0.62*inch, "RESEARCH-GRADE PEPTIDES")
    # right tag
    c.setFillColor(BLUE); c.setFont("Helvetica-Bold", 9)
    c.drawRightString(w-0.7*inch, h-0.46*inch, "AFFILIATE KIT")
    c.setFillColor(colors.HexColor("#9aa0b8")); c.setFont("Helvetica", 7.5)
    c.drawRightString(w-0.7*inch, h-0.62*inch, "omenlabs.co/affiliate")
    # footer
    c.setStrokeColor(LINE); c.setLineWidth(1)
    c.line(0.7*inch, 0.6*inch, w-0.7*inch, 0.6*inch)
    c.setFillColor(SLATE); c.setFont("Helvetica", 8)
    c.drawString(0.7*inch, 0.42*inch, "Omen Labs — Affiliate Program")
    c.drawRightString(w-0.7*inch, 0.42*inch, f"Page {doc.page}")
    c.setFillColor(BLUE); c.setFont("Helvetica-Bold", 8)
    c.drawCentredString(w/2, 0.42*inch, "Up to 17% Commission")


CONTENT_W = letter[0] - 1.4*inch

def chip(num, label, color):
    inner = [[Paragraph(num, chip_num)], [Paragraph(label, chip_lbl)]]
    t = Table(inner, colWidths=[(CONTENT_W-0.4*inch)/3.0])
    t.setStyle(TableStyle([
        ("BACKGROUND",(0,0),(-1,-1), color),
        ("TOPPADDING",(0,0),(-1,0), 12),
        ("BOTTOMPADDING",(0,0),(-1,0), 0),
        ("TOPPADDING",(0,1),(-1,1), 2),
        ("BOTTOMPADDING",(0,1),(-1,1), 12),
        ("LEFTPADDING",(0,0),(-1,-1), 8),
        ("RIGHTPADDING",(0,0),(-1,-1), 8),
        ("ROUNDEDCORNERS",[8,8,8,8]),
        ("VALIGN",(0,0),(-1,-1),"MIDDLE"),
    ]))
    return t

def chip_row():
    c1 = chip("17%", "COMMISSION AT PLATINUM TIER", BLUE)
    c2 = chip("20%", "OFF FIRST PURCHASE FOR FOLLOWERS", BLUE_DK)
    c3 = chip("40%+", "OFF YOUR OWN ORDERS (STACKED)", GREEN)
    row = Table([[c1, c2, c3]], colWidths=[(CONTENT_W)/3.0]*3)
    row.setStyle(TableStyle([
        ("LEFTPADDING",(0,0),(-1,-1),0),("RIGHTPADDING",(0,0),(-1,-1),0),
        ("TOPPADDING",(0,0),(-1,-1),0),("BOTTOMPADDING",(0,0),(-1,-1),0),
        ("VALIGN",(0,0),(-1,-1),"TOP"),
    ]))
    # add a little gap between chips
    row._argW = row._argW  # noop
    return row

def callout(title, paras, fill=PERI, bar=BLUE):
    cells = []
    if title:
        cells.append([Paragraph(title, sub_lbl)])
    for p in paras:
        cells.append([Paragraph(p, body)])
    t = Table(cells, colWidths=[CONTENT_W-0.3*inch])
    t.setStyle(TableStyle([
        ("BACKGROUND",(0,0),(-1,-1), fill),
        ("LEFTPADDING",(0,0),(-1,-1), 14),("RIGHTPADDING",(0,0),(-1,-1), 14),
        ("TOPPADDING",(0,0),(0,0), 8),("BOTTOMPADDING",(0,-1),(-1,-1), 8),
        ("TOPPADDING",(0,1),(-1,-1), 4),
        ("LINEBEFORE",(0,0),(0,-1), 3, bar),
        ("ROUNDEDCORNERS",[6,6,6,6]),
    ]))
    return t

def numbered(n, title, color):
    badge = Table([[Paragraph(f'<font color="white"><b>{n}</b></font>', S("b",alignment=TA_CENTER,fontSize=11))]], colWidths=[0.34*inch], rowHeights=[0.34*inch])
    badge.setStyle(TableStyle([
        ("BACKGROUND",(0,0),(-1,-1),color),("VALIGN",(0,0),(-1,-1),"MIDDLE"),
        ("ALIGN",(0,0),(-1,-1),"CENTER"),("ROUNDEDCORNERS",[17,17,17,17]),
        ("TOPPADDING",(0,0),(-1,-1),0),("BOTTOMPADDING",(0,0),(-1,-1),0),
    ]))
    row = Table([[badge, Paragraph(title, S("nt",fontName="Helvetica-Bold",fontSize=11.5,textColor=INK,leading=14))]],
                colWidths=[0.5*inch, CONTENT_W-0.5*inch])
    row.setStyle(TableStyle([("VALIGN",(0,0),(-1,-1),"MIDDLE"),
        ("LEFTPADDING",(0,0),(0,0),0),("LEFTPADDING",(1,0),(1,0),4),
        ("TOPPADDING",(0,0),(-1,-1),2),("BOTTOMPADDING",(0,0),(-1,-1),2)]))
    return row


story = []

# ===== PAGE 1: OUTREACH EMAIL =====
story.append(Spacer(1, 0.30*inch))
story.append(Paragraph("OUTREACH PLAYBOOK", eyebrow))
story.append(Paragraph("Affiliate Recruitment Kit", S("title", fontName="Helvetica-Bold", fontSize=24, leading=27, textColor=INK)))
story.append(Spacer(1, 4))
story.append(Paragraph("Everything you need to recruit peptide educators to the Omen Labs affiliate program — the pitch, the numbers, and where to find your people.", body_sl))
story.append(Spacer(1, 14))
story.append(chip_row())
story.append(Spacer(1, 18))

story.append(Paragraph("The Outreach Email", h_section))
story.append(HBar(CONTENT_W, BLUE, 2))
story.append(Spacer(1, 10))

subject_box = Table([[Paragraph('<font color="#1746c7"><b>SUBJECT&nbsp;&nbsp;</b></font>'
    'Omen Labs Affiliate Program — 17% Commission Plus Better Margins', subj)]], colWidths=[CONTENT_W-0.3*inch])
subject_box.setStyle(TableStyle([
    ("BACKGROUND",(0,0),(-1,-1), PERI_DK),
    ("LEFTPADDING",(0,0),(-1,-1),14),("RIGHTPADDING",(0,0),(-1,-1),14),
    ("TOPPADDING",(0,0),(-1,-1),10),("BOTTOMPADDING",(0,0),(-1,-1),10),
    ("ROUNDEDCORNERS",[6,6,6,6]),
]))
story.append(subject_box)
story.append(Spacer(1, 12))

email_paras = [
    "Hey there,",
    "I've been following your peptide content and appreciate how you actually educate your audience instead of just pushing products. That's rare.",
    "We just launched the Omen Labs affiliate program and I think you'd be a fit. Here's the deal: we're matching AMP's pricing, beating Onyx's margins, and offering commissions up to <b>seventeen percent</b> — which crushes what most peptide companies are doing. Your followers get <b>twenty percent off</b> their first purchase, <b>ten percent</b> after. You make <b>seventeen percent per sale</b> once you hit Platinum tier with thirty sales.",
    "Stack that with our bulk discounts and crypto payment incentives, and affiliates are walking away with <b>over forty percent off</b> their own orders. That's genuinely insane value.",
    "Site's built clean and professional — nothing scrappy. Full product info, storage guides, everything your audience expects.",
    "Want in? Dashboard signup takes two minutes. Link below.",
]
for p in email_paras:
    story.append(Paragraph(p, body)); story.append(Spacer(1, 7))

link_box = Table([[Paragraph('<b><font color="white">→ JOIN THE DASHBOARD</font></b>&nbsp;&nbsp;&nbsp;'
    '<font color="#dbe4ff">omenlabs.co/affiliate</font>', S("lk",fontName="Helvetica-Bold",fontSize=11,textColor=WHITE))]],
    colWidths=[CONTENT_W-0.3*inch])
link_box.setStyle(TableStyle([
    ("BACKGROUND",(0,0),(-1,-1), BLUE),
    ("LEFTPADDING",(0,0),(-1,-1),16),("RIGHTPADDING",(0,0),(-1,-1),16),
    ("TOPPADDING",(0,0),(-1,-1),12),("BOTTOMPADDING",(0,0),(-1,-1),12),
    ("ROUNDEDCORNERS",[8,8,8,8]),
]))
story.append(Spacer(1, 4)); story.append(link_box); story.append(Spacer(1, 9))
story.append(Paragraph("Let me know if you have questions.", body))
story.append(Spacer(1, 4))
story.append(Paragraph('<b>— Drakob</b>', S("sig",fontName="Helvetica-Bold",fontSize=11,textColor=INK)))

story.append(PageBreak())

# ===== PAGE 2: WHERE TO FIND AFFILIATES =====
story.append(Spacer(1, 0.30*inch))
story.append(Paragraph("TARGETING GUIDE", eyebrow))
story.append(Paragraph("Where to Find Your Affiliates", S("title2", fontName="Helvetica-Bold", fontSize=22, leading=25, textColor=INK)))
story.append(Spacer(1, 4))
story.append(Paragraph("These are the communities where supplement and peptide educators actually hang out. Find them, then reach out personally.", body_sl))
story.append(Spacer(1, 9))

story.append(numbered("1", "Reddit Communities", BLUE))
story.append(Spacer(1, 3))
story.append(callout(None,
    ["<b>r/peptides, r/steroids, r/biohacking, r/nootropics.</b> Search for posts mentioning affiliate programs or people recommending products — those are your people."]))
story.append(Spacer(1, 6))

story.append(numbered("2", "Discord Servers", BLUE_DK))
story.append(Spacer(1, 3))
story.append(callout(None,
    ['Search <b>"peptide Discord"</b> or <b>"supplement affiliate Discord."</b> Active communities where people literally share affiliate links and compare commissions.'],
    fill=PERI, bar=BLUE_DK))
story.append(Spacer(1, 6))

story.append(numbered("3", "TikTok & YouTube — the sweet spot", GREEN))
story.append(Spacer(1, 3))
story.append(callout(None,
    ["Hashtags: <b>#peptideeducation, #peptidereviews, #researchpeptide, #BPC-157, #GLP-1.</b> Target creators with <b>5K–50K followers</b> posting educational content — big enough to matter, small enough to actually reply."],
    fill=MINT, bar=GREEN))
story.append(Spacer(1, 6))

story.append(numbered("4", "Supplement Affiliate Networks", BLUE))
story.append(Spacer(1, 3))
story.append(callout(None,
    ["<b>ShareASale, CJ Affiliate, Impact</b> have members already hustling commissions. Find their community forums or reach out directly through those platforms."]))
story.append(Spacer(1, 6))

story.append(numbered("5", "Getting Their Contact Info", BLUE_DK))
story.append(Spacer(1, 3))
story.append(callout(None,
    ["Look for contact info in <b>bios, websites, or business emails.</b> Personal outreach beats cold LinkedIn every time."],
    fill=PERI, bar=BLUE_DK))

story.append(Spacer(1, 8))
tip = Table([[Paragraph('<b><font color="#1746c7">PRO TIP</font></b>&nbsp;&nbsp;Personalize the first line of every email — reference a specific video or post. '
    'It triples reply rates versus a generic blast.', body)]], colWidths=[CONTENT_W-0.3*inch])
tip.setStyle(TableStyle([
    ("BACKGROUND",(0,0),(-1,-1), colors.HexColor("#fff7e6")),
    ("LEFTPADDING",(0,0),(-1,-1),14),("RIGHTPADDING",(0,0),(-1,-1),14),
    ("TOPPADDING",(0,0),(-1,-1),12),("BOTTOMPADDING",(0,0),(-1,-1),12),
    ("LINEBEFORE",(0,0),(0,-1),3, colors.HexColor("#e8a200")),
    ("ROUNDEDCORNERS",[6,6,6,6]),
]))
story.append(tip)

# ===== PAGE 3: OUTREACH TRACKER =====
story.append(PageBreak())
story.append(Spacer(1, 0.30*inch))
story.append(Paragraph("PROSPECT LIST", eyebrow))
story.append(Paragraph("Outreach Tracker", S("title3", fontName="Helvetica-Bold", fontSize=22, leading=25, textColor=INK)))
story.append(Spacer(1, 4))
story.append(Paragraph("Log each creator as you find them. Aim for the 5K–50K follower sweet spot, then send your personalized pitch.", body_sl))
story.append(Spacer(1, 14))

hdr = ["Creator / Handle", "Platform", "Followers", "Contact (email / DM)", "Status"]
seed = [["@thebiohackingnurse", "Instagram", "~17K", "TheBiohackingNurse@gmail.com", "To Contact"]]
rows = [hdr] + seed + [["", "", "", "", ""] for _ in range(12)]
colw = [1.55*inch, 0.85*inch, 0.85*inch, 2.05*inch, 0.85*inch]
tracker = Table(rows, colWidths=colw, rowHeights=[0.34*inch] + [0.36*inch]*13)
tracker.setStyle(TableStyle([
    ("BACKGROUND",(0,0),(-1,0), INK),
    ("TEXTCOLOR",(0,0),(-1,0), WHITE),
    ("FONTNAME",(0,0),(-1,0), "Helvetica-Bold"),
    ("FONTSIZE",(0,0),(-1,0), 8.5),
    ("VALIGN",(0,0),(-1,-1),"MIDDLE"),
    ("LEFTPADDING",(0,0),(-1,-1), 7),
    ("ROWBACKGROUNDS",(0,1),(-1,-1), [WHITE, PERI]),
    ("LINEBELOW",(0,0),(-1,-1), 0.5, LINE),
    ("LINEAFTER",(0,0),(-2,-1), 0.5, LINE),
    ("BOX",(0,0),(-1,-1), 1, PERI_DK),
    ("TEXTCOLOR",(0,1),(-1,-1), SLATE),
    ("FONTSIZE",(0,1),(-1,-1), 9),
]))
story.append(tracker)
story.append(Spacer(1, 14))

legend = Table([[
    Paragraph('<b><font color="#1746c7">STATUS KEY</font></b>&nbsp;&nbsp; '
              'To Contact → Sent → Replied → Signed Up → Active', body)]],
    colWidths=[CONTENT_W-0.3*inch])
legend.setStyle(TableStyle([
    ("BACKGROUND",(0,0),(-1,-1), PERI),
    ("LEFTPADDING",(0,0),(-1,-1),14),("RIGHTPADDING",(0,0),(-1,-1),14),
    ("TOPPADDING",(0,0),(-1,-1),10),("BOTTOMPADDING",(0,0),(-1,-1),10),
    ("LINEBEFORE",(0,0),(0,-1),3, BLUE),
    ("ROUNDEDCORNERS",[6,6,6,6]),
]))
story.append(legend)
story.append(Spacer(1, 8))

tools = Table([[Paragraph('<b><font color="#1746c7">PULL MORE LEADS</font></b>&nbsp;&nbsp; '
    'Use <b>Modash</b> (modash.io) — filter 5K–50K followers + bio keyword "peptide/biohacking"; it surfaces public emails. '
    'Also: <b>Feedspot</b> Top Biohack TikTok list &amp; <b>Influencer Hero</b> biohacking directory. '
    'Search workaround: peptide creators dodge moderation with "Pep," "Peppers," and chili-pepper emojis.', body)]],
    colWidths=[CONTENT_W-0.3*inch])
tools.setStyle(TableStyle([
    ("BACKGROUND",(0,0),(-1,-1), MINT),
    ("LEFTPADDING",(0,0),(-1,-1),14),("RIGHTPADDING",(0,0),(-1,-1),14),
    ("TOPPADDING",(0,0),(-1,-1),10),("BOTTOMPADDING",(0,0),(-1,-1),10),
    ("LINEBEFORE",(0,0),(0,-1),3, GREEN),
    ("ROUNDEDCORNERS",[6,6,6,6]),
]))
story.append(tools)


doc = SimpleDocTemplate(OUT, pagesize=letter,
    leftMargin=0.7*inch, rightMargin=0.7*inch, topMargin=1.15*inch, bottomMargin=0.8*inch,
    title="Omen Labs — Affiliate Kit", author="Omen Labs")
doc.build(story, onFirstPage=header_footer, onLaterPages=header_footer)
print("WROTE", OUT)
