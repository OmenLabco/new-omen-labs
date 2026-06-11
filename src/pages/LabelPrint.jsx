import { useState } from 'react';
import OmenLogo from '../components/OmenLogo';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

const PRODUCTS = [
  { name: 'GLP-3 RT',          dose: '5mg',      purity: '99.5', category: 'Performance', lot: 'OL-2026-001' },
  { name: 'BPC-157',           dose: '5mg',      purity: '99.8', category: 'Recovery',    lot: 'OL-2026-002' },
  { name: 'GHK-Cu',            dose: '50mg',     purity: '99.6', category: 'Longevity',   lot: 'OL-2026-003' },
  { name: 'TB-500',            dose: '5mg',      purity: '99.0', category: 'Recovery',    lot: 'OL-2026-004' },
  { name: 'Ipamorelin',        dose: '2mg',      purity: '99.3', category: 'Performance', lot: 'OL-2026-005' },
  { name: 'MT2',               dose: '10mg',     purity: '99.8', category: 'Aesthetics',  lot: 'OL-2026-006' },
  { name: 'MT1',               dose: '10mg',     purity: '99.3', category: 'Aesthetics',  lot: 'OL-2026-007' },
  { name: 'GLOW',              dose: '70mg',     purity: '98.7', category: 'Aesthetics',  lot: 'OL-2026-008' },
  { name: 'KLOW',              dose: '80mg',     purity: '99.2', category: 'Performance', lot: 'OL-2026-009' },
  { name: 'WOLVERINE',         dose: '10mg',     purity: '99.4', category: 'Recovery',    lot: 'OL-2026-010' },
  { name: 'CJC+Ipamorelin',   dose: '5mg/5mg',  purity: '99.0', category: 'Performance', lot: 'OL-2026-011' },
  { name: 'IGF1-LR3',         dose: '1mg',      purity: '99.2', category: 'Performance', lot: 'OL-2026-012' },
  { name: 'GLP-3RT',          dose: '10mg',     purity: '99.5', category: 'Performance', lot: 'OL-2026-013' },
  { name: 'GLP-3RT',          dose: '20mg',     purity: '99.5', category: 'Performance', lot: 'OL-2026-014' },
  { name: 'Tirzepatide',      dose: '10mg',     purity: '99.3', category: 'Performance', lot: 'OL-2026-015' },
  { name: 'Semax',            dose: '10mg',     purity: '99.1', category: 'Longevity',   lot: 'OL-2026-016' },
  { name: 'NAD+',             dose: '500mg',    purity: '99.5', category: 'Longevity',   lot: 'OL-2026-017' },
  { name: 'TB500',            dose: '2mg',      purity: '99.0', category: 'Recovery',    lot: 'OL-2026-018' },
  { name: 'KPV',              dose: '10mg',     purity: '99.2', category: 'Recovery',    lot: 'OL-2026-019' },
  { name: 'MOTS-c',          dose: '10mg',     purity: '99.0', category: 'Longevity',   lot: 'OL-2026-020' },
  { name: 'BAC Water',        dose: '3ml',      purity: '99.9', category: 'Recovery',    lot: 'OL-2026-021' },
  { name: 'MT-1',            dose: '10mg',     purity: '99.3', category: 'Aesthetics',  lot: 'OL-2026-022' },
  { name: 'MT-2',            dose: '10mg',     purity: '99.3', category: 'Aesthetics',  lot: 'OL-2026-023' },
  { name: 'Adamax',          dose: '10mg',     purity: '99.1', category: 'Longevity',   lot: 'OL-2026-024' },
];

const SCALE = 4;

// ─── 40×20mm (landscape) ───────────────────────────────────────────────────
const W40 = 40, H40 = 20;
const PX_W40 = Math.round((W40 / 25.4) * 96 * SCALE);
const PX_H40 = Math.round((H40 / 25.4) * 96 * SCALE);

function Label40Dark({ product }) {
  return (
    <div style={{
      width: '40mm', height: '20mm',
      backgroundColor: '#080A10',
      display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
      padding: '2mm 3mm',
      fontFamily: "'Space Grotesk', sans-serif",
      boxSizing: 'border-box',
      border: '0.3mm solid rgba(255,255,255,0.08)',
      borderRadius: '1.5mm',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <OmenLogo size={13} className="text-white" />
        <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: '4.5pt', letterSpacing: '0.35em', fontFamily: "'IBM Plex Mono', monospace", textTransform: 'uppercase', fontWeight: 400 }}>OMEN LABS</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '2mm' }}>
        <span style={{ color: '#FFF', fontSize: '10pt', fontWeight: 700, letterSpacing: '-0.01em', lineHeight: 1, fontFamily: "'Space Grotesk', sans-serif", flexShrink: 0 }}>{product.name}</span>
        <span style={{ color: '#FFF', fontSize: '5pt', fontWeight: 600, fontFamily: "'IBM Plex Mono', monospace", whiteSpace: 'nowrap', border: '0.35mm solid rgba(255,255,255,0.5)', borderRadius: '1.5mm', padding: '0.5mm 1mm', display: 'inline-flex', alignItems: 'center', lineHeight: 'normal', flexShrink: 0 }}>{product.dose}</span>
      </div>
      <div style={{ height: '0.2mm', backgroundColor: 'rgba(255,255,255,0.18)', margin: '0.8mm 0 0.5mm' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '4pt', fontFamily: "'IBM Plex Mono', monospace", letterSpacing: '0.12em', textTransform: 'uppercase' }}>PURITY ≥{product.purity}% · RESEARCH USE ONLY</span>
        <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '4pt', fontFamily: "'IBM Plex Mono', monospace", letterSpacing: '0.08em' }}>OmenLabs.co</span>
      </div>
    </div>
  );
}

function Label40White({ product }) {
  const s = SCALE;
  return (
    <div style={{
      width: PX_W40, height: PX_H40,
      backgroundColor: '#FFF',
      display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
      padding: `${6 * s}px ${9 * s}px`,
      fontFamily: "'Space Grotesk', sans-serif",
      boxSizing: 'border-box',
      border: `${1 * s}px solid #E0E0E0`,
      borderRadius: `${4 * s}px`,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ color: '#000' }}><OmenLogo size={13 * s} /></div>
        <span style={{ color: '#555', fontSize: `${4.5 * s}pt`, letterSpacing: '0.35em', fontFamily: "'IBM Plex Mono', monospace", textTransform: 'uppercase', fontWeight: 400 }}>OMEN LABS</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: `${6 * s}px` }}>
        <span style={{ color: '#000', fontSize: `${10 * s}pt`, fontWeight: 700, letterSpacing: '-0.01em', lineHeight: 1, fontFamily: "'Space Grotesk', sans-serif", flexShrink: 0 }}>{product.name}</span>
        <span style={{ color: '#000', fontSize: `${5 * s}pt`, fontWeight: 600, fontFamily: "'IBM Plex Mono', monospace", whiteSpace: 'nowrap', border: `${1 * s}px solid #333`, borderRadius: `${4 * s}px`, padding: `${1.5 * s}px ${3 * s}px`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1, flexShrink: 0 }}>{product.dose}</span>
      </div>
      <div style={{ height: `${1 * s}px`, backgroundColor: '#CCC', margin: `${2 * s}px 0` }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ color: '#555', fontSize: `${4 * s}pt`, fontFamily: "'IBM Plex Mono', monospace", letterSpacing: '0.12em', textTransform: 'uppercase' }}>PURITY ≥{product.purity}% · RESEARCH USE ONLY</span>
        <span style={{ color: '#777', fontSize: `${4 * s}pt`, fontFamily: "'IBM Plex Mono', monospace", letterSpacing: '0.08em' }}>OmenLabs.co</span>
      </div>
    </div>
  );
}

// ─── 30×50mm (portrait) ────────────────────────────────────────────────────
const W30 = 50, H30 = 30;
const PX_W30 = Math.round((W30 / 25.4) * 96 * SCALE);
const PX_H30 = Math.round((H30 / 25.4) * 96 * SCALE);

function Label30Dark({ product }) {
  return (
    <div style={{
      width: '50mm', height: '30mm',
      backgroundColor: '#080A10',
      display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
      padding: '2.5mm 3.5mm',
      fontFamily: "'Space Grotesk', sans-serif",
      boxSizing: 'border-box',
      border: '0.3mm solid rgba(255,255,255,0.08)',
      borderRadius: '1.5mm',
    }}>
      {/* Top: logo + brand */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <OmenLogo size={13} className="text-white" />
        <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: '4pt', letterSpacing: '0.3em', fontFamily: "'IBM Plex Mono', monospace", textTransform: 'uppercase', fontWeight: 400 }}>OMEN LABS</span>
      </div>

      {/* Middle: name + dose */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '2.5mm' }}>
        <span style={{ color: '#FFF', fontSize: '12pt', fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1, fontFamily: "'Space Grotesk', sans-serif", flexShrink: 0 }}>{product.name}</span>
        <span style={{ color: '#FFF', fontSize: '6pt', fontWeight: 600, fontFamily: "'IBM Plex Mono', monospace", whiteSpace: 'nowrap', border: '0.35mm solid rgba(255,255,255,0.5)', borderRadius: '1.5mm', padding: '0.6mm 1.2mm', display: 'inline-flex', alignItems: 'center', lineHeight: 'normal', flexShrink: 0 }}>{product.dose}</span>
      </div>

      {/* Hairline */}
      <div style={{ height: '0.2mm', backgroundColor: 'rgba(255,255,255,0.15)' }} />

      {/* Bottom: purity + lot + site */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '4pt', fontFamily: "'IBM Plex Mono', monospace", letterSpacing: '0.1em', textTransform: 'uppercase' }}>PURITY ≥{product.purity}% · RESEARCH USE ONLY</span>
        <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '3.5pt', fontFamily: "'IBM Plex Mono', monospace", letterSpacing: '0.06em' }}>OmenLabs.co</span>
      </div>
    </div>
  );
}

function Label30White({ product }) {
  const s = SCALE;
  return (
    <div style={{
      width: PX_W30, height: PX_H30,
      backgroundColor: '#FFF',
      display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
      padding: `${7 * s}px ${10 * s}px`,
      fontFamily: "'Space Grotesk', sans-serif",
      boxSizing: 'border-box',
      border: `${1 * s}px solid #E0E0E0`,
      borderRadius: `${4 * s}px`,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ color: '#000' }}><OmenLogo size={13 * s} /></div>
        <span style={{ color: '#555', fontSize: `${4 * s}pt`, letterSpacing: '0.3em', fontFamily: "'IBM Plex Mono', monospace", textTransform: 'uppercase', fontWeight: 400 }}>OMEN LABS</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: `${7 * s}px` }}>
        <span style={{ color: '#000', fontSize: `${12 * s}pt`, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1, fontFamily: "'Space Grotesk', sans-serif", flexShrink: 0 }}>{product.name}</span>
        <span style={{ color: '#000', fontSize: `${6 * s}pt`, fontWeight: 600, fontFamily: "'IBM Plex Mono', monospace", whiteSpace: 'nowrap', border: `${1 * s}px solid #333`, borderRadius: `${4 * s}px`, padding: `${1.5 * s}px ${4 * s}px`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1, flexShrink: 0 }}>{product.dose}</span>
      </div>

      <div style={{ height: `${1 * s}px`, backgroundColor: '#CCC' }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ color: '#555', fontSize: `${4 * s}pt`, fontFamily: "'IBM Plex Mono', monospace", letterSpacing: '0.1em', textTransform: 'uppercase' }}>PURITY ≥{product.purity}% · RESEARCH USE ONLY</span>
        <span style={{ color: '#999', fontSize: `${3.5 * s}pt`, fontFamily: "'IBM Plex Mono', monospace", letterSpacing: '0.06em' }}>OmenLabs.co</span>
      </div>
    </div>
  );
}

// ─── PDF helper ────────────────────────────────────────────────────────────
async function generatePDF({ product, WhiteComponent, pxW, pxH, wMM, hMM, orientation, suffix }) {
  const container = document.createElement('div');
  container.style.cssText = `position:fixed;top:-9999px;left:-9999px;width:${pxW}px;height:${pxH}px;`;
  document.body.appendChild(container);

  const { createRoot } = await import('react-dom/client');
  const root = createRoot(container);
  root.render(<WhiteComponent product={product} />);
  await new Promise(r => setTimeout(r, 600));

  const canvas = await html2canvas(container.firstChild, {
    scale: 1, useCORS: true, backgroundColor: '#ffffff',
    width: pxW, height: pxH, logging: false,
  });

  root.unmount();
  document.body.removeChild(container);

  const imgData = canvas.toDataURL('image/png');
  const doc = new jsPDF({ orientation, unit: 'mm', format: [wMM, hMM] });
  doc.addImage(imgData, 'PNG', 0, 0, wMM, hMM);
  doc.save(`${product.name.replace(/\s+/g, '_')}_${suffix}.pdf`);
}

// ─── Brand asset SVG export (transparent background) ──────────────────────
function downloadBrandSVG(color, filename) {
  // Logo drawn in a 100×100 viewBox unit space, scaled to 80px tall
  const logoScale = 80 / 100;
  const logoW = 100 * logoScale; // 80px
  const logoH = 100 * logoScale; // 80px

  // Hex geometry in original 100×100 space
  const R = 44, cx = 50, cy = 50;
  const pts = Array.from({ length: 6 }, (_, i) => {
    const angle = (Math.PI / 180) * (30 + 60 * i);
    return [cx + R * Math.cos(angle), cy + R * Math.sin(angle)];
  });
  const hexPts = pts.map(p => p.map(v => v.toFixed(3)).join(',')).join(' ');
  const innerR = R * 0.72;
  const innerPts = Array.from({ length: 6 }, (_, i) => {
    const angle = (Math.PI / 180) * (30 + 60 * i);
    return [cx + innerR * Math.cos(angle), cy + innerR * Math.sin(angle)];
  });
  const doubleSides = [[0, 1], [2, 3], [4, 5]];
  const doubleLines = doubleSides.map(([a, b]) =>
    `<line x1="${innerPts[a][0].toFixed(3)}" y1="${innerPts[a][1].toFixed(3)}" x2="${innerPts[b][0].toFixed(3)}" y2="${innerPts[b][1].toFixed(3)}" stroke="${color}" stroke-width="3.5" stroke-linecap="round"/>`
  ).join('\n    ');

  // Canvas dimensions: logo (80px + 10px offset) + padding
  const gap = 20;
  const textX = logoW + gap;
  const svgH = logoH + 20; // 100px to accommodate logo translate + bottom corner
  const svgW = textX + 420; // enough room for full text

  // Vertically center text within the taller canvas
  const textBaseline = svgH * 0.72;

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${svgW}" height="${svgH}" viewBox="0 0 ${svgW} ${svgH}" xmlns="http://www.w3.org/2000/svg">
  <g transform="translate(0, 18) scale(${logoScale})">
    <polygon points="${hexPts}" stroke="${color}" stroke-width="4" fill="none" stroke-linejoin="round"/>
    ${doubleLines}
    <circle cx="${cx}" cy="${cy}" r="4" fill="${color}"/>
  </g>
  <text
    x="${textX}"
    y="${textBaseline}"
    font-family="IBM Plex Mono, Courier New, monospace"
    font-size="48"
    font-weight="400"
    letter-spacing="8"
    fill="${color}"
    xml:space="preserve"
  >OMEN LABS</text>
</svg>`;

  const blob = new Blob([svg], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Main page ─────────────────────────────────────────────────────────────
export default function LabelPrint() {
  const [tab, setTab] = useState('40x20');
  const [selected, setSelected] = useState(null);
  const [pdfLoading, setPdfLoading] = useState(null);

  const is40 = tab === '40x20';

  const handlePrint = (product) => {
    setSelected({ product, size: tab });
    setTimeout(() => { window.print(); }, 50);
  };

  const handleDownloadPDF = async (product) => {
    const key = `${product.name}-${tab}`;
    setPdfLoading(key);
    if (is40) {
      await generatePDF({ product, WhiteComponent: Label40White, pxW: PX_W40, pxH: PX_H40, wMM: W40, hMM: H40, orientation: 'landscape', suffix: '40x20mm' });
    } else {
      await generatePDF({ product, WhiteComponent: Label30White, pxW: PX_W30, pxH: PX_H30, wMM: W30, hMM: H30, orientation: 'landscape', suffix: '50x30mm' });
    }
    setPdfLoading(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@300;400;500;600&family=Space+Grotesk:wght@400;600;700&display=swap');
        @media print {
          body * { visibility: hidden !important; }
          #niimbot-print-target, #niimbot-print-target * { visibility: visible !important; }
          #niimbot-print-target { position: fixed !important; top: 0 !important; left: 0 !important; margin: 0 !important; padding: 0 !important; }
          @page { size: ${is40 ? '40mm 20mm' : '50mm 30mm'}; margin: 0; }
        }
      `}</style>

      <div className="max-w-5xl mx-auto px-6 py-16 pt-28">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-px w-6 bg-primary" />
            <span className="font-mono text-[11px] uppercase tracking-[0.25em] text-primary">Label Studio</span>
          </div>
          <h1 className="text-4xl font-bold tracking-tight">Vial Labels</h1>
          <p className="text-muted-foreground mt-2 text-sm">Optimized for Niimbot M2. Print or download each label individually.</p>
        </div>

        {/* Brand Asset Downloads */}
        <div className="mb-10 p-5 rounded-xl border border-border bg-card">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground mb-4">Brand Assets — Transparent Background</p>
          <div className="flex flex-wrap gap-3 items-center">
            {/* Black version preview */}
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-white">
              <OmenLogo size={18} style={{ color: '#000' }} />
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '12px', letterSpacing: '0.2em', color: '#000', fontWeight: 400 }}>OMEN LABS</span>
            </div>
            {/* White version preview */}
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg border border-black/10 bg-black">
              <OmenLogo size={18} style={{ color: '#fff' }} />
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '12px', letterSpacing: '0.2em', color: '#fff', fontWeight: 400 }}>OMEN LABS</span>
            </div>
            <div className="flex gap-2 ml-auto">
              <button
                onClick={() => downloadBrandSVG('#000000', 'OmenLabs_Logo_Black.svg')}
                className="h-9 px-4 rounded-lg border border-border text-xs font-mono text-muted-foreground hover:text-foreground hover:border-black/20 transition-colors"
              >
                ↓ Black SVG
              </button>
              <button
                onClick={() => downloadBrandSVG('#ffffff', 'OmenLabs_Logo_White.svg')}
                className="h-9 px-4 rounded-lg border border-black/10 bg-black text-xs font-mono text-white hover:border-black/30 transition-colors"
              >
                ↓ White SVG
              </button>
            </div>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex gap-2 mb-8">
          {[['40x20', '40 × 20mm'], ['30x50', '50 × 30mm']].map(([val, label]) => (
            <button
              key={val}
              onClick={() => setTab(val)}
              className={`h-9 px-5 rounded-lg text-xs font-mono font-medium transition-colors border ${tab === val ? 'bg-primary text-white border-primary' : 'border-border text-muted-foreground hover:text-foreground hover:border-black/20'}`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Label list */}
        <div className="flex flex-col gap-3">
          {PRODUCTS.map((p) => {
            const key = `${p.name}-${tab}`;
            return (
              <div key={p.name} className="flex items-center gap-6 p-4 rounded-xl border border-border bg-card hover:border-black/10 transition-colors">
                <div className="shrink-0">
                  {is40 ? <Label40Dark product={p} /> : <Label30Dark product={p} />}
                </div>
                <div className="flex-1 text-xs text-muted-foreground font-mono">
                  <p className="text-foreground font-semibold text-sm mb-1">{p.name}</p>
                  <p>{is40 ? '40 × 20mm' : '50 × 30mm'} · Niimbot M2</p>
                  <p className="mt-0.5">LOT: {p.lot}</p>
                </div>
                <div className="shrink-0 flex items-center gap-2">
                  <button
                    onClick={() => handleDownloadPDF(p)}
                    disabled={pdfLoading === key}
                    className="flex items-center gap-1.5 h-9 px-4 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:text-foreground hover:border-black/20 transition-colors disabled:opacity-50"
                  >
                    {pdfLoading === key ? 'Generating…' : 'PDF'}
                  </button>
                  <button
                    onClick={() => handlePrint(p)}
                    className="flex items-center gap-2 h-9 px-5 rounded-lg bg-primary text-white text-xs font-medium hover:bg-primary/90 transition-colors"
                  >
                    Print
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {selected && (
        <div id="niimbot-print-target" style={{ position: 'fixed', top: 0, left: 0, zIndex: -1 }}>
          {selected.size === '40x20' ? <Label40Dark product={selected.product} /> : <Label30Dark product={selected.product} />}
        </div>
      )}
    </div>
  );
}