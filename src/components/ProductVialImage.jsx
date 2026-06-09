/**
 * ProductVialImage
 *
 * Renders a photorealistic vial with a black paper label that looks
 * physically stuck onto the glass cylinder.
 *
 * Technique:
 *  - Real vial photo as base
 *  - Label is NOT a flat rectangle — it's built with:
 *    • Elliptical arcs for top & bottom edges (cylinder curve)
 *    • Perspective skew: left edge slightly taller than right (3/4 view)
 *    • Paper thickness: a thin lighter strip at top & bottom edges
 *    • Drop shadows at label edges where paper meets glass
 *    • Matte black surface with subtle noise texture
 *    • QR wraps to the right side, fading into the cylinder's shadow
 */

const VIAL_PHOTO = 'https://media.base44.com/images/public/69f985f39cc1fe91aec19c71/ac8658872_generated_image.png';

function HexLogo({ cx, cy, r = 6 }) {
  const pts = Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 180) * (30 + 60 * i);
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  });
  const ir = r * 0.68;
  const ipts = Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 180) * (30 + 60 * i);
    return [cx + ir * Math.cos(a), cy + ir * Math.sin(a)];
  });
  return (
    <g>
      <polygon points={pts.map(p => p.join(',')).join(' ')} stroke="white" strokeWidth="1" fill="none" strokeLinejoin="round" />
      {[[0,1],[2,3],[4,5]].map(([a,b], i) => (
        <line key={i} x1={ipts[a][0]} y1={ipts[a][1]} x2={ipts[b][0]} y2={ipts[b][1]}
          stroke="white" strokeWidth="0.8" strokeLinecap="round" />
      ))}
      <circle cx={cx} cy={cy} r="1" fill="white" />
    </g>
  );
}

const QR_OUTER = [[1,1,1,1,1,1,1],[1,0,0,0,0,0,1],[1,0,1,1,1,0,1],[1,0,1,0,1,0,1],[1,0,1,1,1,0,1],[1,0,0,0,0,0,1],[1,1,1,1,1,1,1]];
const QR_INNER = [[0,0,1,0,1,1,0],[0,1,1,0,0,1,0],[1,0,0,1,1,0,1],[0,1,0,0,1,1,0],[1,0,1,1,0,0,1],[0,1,0,1,0,1,0],[0,0,1,1,1,0,0]];

function QRBlock({ x, y, size = 20 }) {
  const cell = size / 7;
  return (
    <g>
      <rect x={x-1.5} y={y-1.5} width={size+3} height={size+3} rx="1.5" fill="black" fillOpacity="0.35" />
      {QR_OUTER.map((row, r) => row.map((on, c) => on ? (
        <rect key={`o${r}${c}`} x={x+c*cell} y={y+r*cell} width={cell-0.3} height={cell-0.3} fill="white" fillOpacity="0.92" />
      ) : null))}
      {QR_INNER.map((row, r) => row.map((on, c) => on && !QR_OUTER[r][c] ? (
        <rect key={`i${r}${c}`} x={x+c*cell+cell*0.15} y={y+r*cell+cell*0.15} width={cell*0.7} height={cell*0.7} fill="white" fillOpacity="0.8" />
      ) : null))}
    </g>
  );
}

export default function ProductVialImage({ name = '', dose = '', purity = 99, className = '', style = {} }) {
  const VW = 260, VH = 340;

  // ── Vial cylinder geometry (matched to photo) ──────────────────────────
  // Glass body in photo: x 48–215, y 105–295
  const vL = 48, vR = 215;          // vial left/right x
  const vCx = (vL + vR) / 2;        // 131.5
  const vRad = (vR - vL) / 2;       // 83.5  (horizontal radius of cylinder)

  // Label vertical extent — sits in the middle of the glass body
  // Slightly narrower than full height to show bare glass above/below
  const lTop = 162;
  const lBot = 268;
  const lH = lBot - lTop;

  // ── Cylinder arc depth ──
  // For a cylindrical wrap, top/bottom edges are ellipses.
  // ry controls how "deep" the curve looks. ~8px for this vial diameter.
  const arcRy = 14;

  // ── Perspective: label covers ~75% of the visible front face ──
  // The label starts and ends before the very edge of the cylinder
  // to look like it doesn't go all the way around on the visible side.
  // This also gives room for the glass edge highlights to show.
  const margin = 20; // px from cylinder edge
  const lL = vL + margin;      // label left x
  const lR = vR - margin - 10; // label right x (slightly asymmetric — label wraps more to right)
  const lW = lR - lL;
  const arcRx = lW / 2;        // horizontal radius for arcs
  const lCx = lL + lW / 2;

  // ── The label path ──
  // Top edge: elliptical arc bowing DOWN (paper wraps around top of cylinder)
  // Bottom edge: elliptical arc bowing DOWN (same direction = wrapped band)
  //
  // M lL, lTop
  // A arcRx arcRy → arc to lR, lTop (sweeping downward in the middle)
  // L lR, lBot
  // A arcRx arcRy → arc back to lL, lBot
  // Z
  //
  // For a front-facing cylinder, the top arc bows slightly downward at the center,
  // and the bottom arc also bows downward — creating the "wrapped band" illusion.

  const topArc  = `M ${lL} ${lTop} A ${arcRx} ${arcRy} 0 0 1 ${lR} ${lTop}`;
  const botArc  = `M ${lL} ${lBot} A ${arcRx} ${arcRy} 0 0 1 ${lR} ${lBot}`;

  const labelPath = `${topArc} L ${lR} ${lBot} A ${arcRx} ${arcRy} 0 0 0 ${lL} ${lBot} Z`;

  // ── Paper edge thickness lines (top and bottom) ──
  // 2px lighter strip just inside the arc = paper has physical thickness
  const topEdgePath = `M ${lL+2} ${lTop+1} A ${arcRx} ${arcRy} 0 0 1 ${lR-2} ${lTop+1}`;
  const botEdgePath = `M ${lL+2} ${lBot-1} A ${arcRx} ${arcRy} 0 0 1 ${lR-2} ${lBot-1}`;

  // ── Drop shadow path (slightly expanded, behind label) ──
  const shadowPath = `M ${lL-2} ${lTop-1} A ${arcRx+2} ${arcRy+1} 0 0 1 ${lR+2} ${lTop-1} L ${lR+2} ${lBot+1} A ${arcRx+2} ${arcRy+1} 0 0 0 ${lL-2} ${lBot+1} Z`;

  // ── Content layout ──
  // QR sits in the right "wrapping" zone — define first so text can avoid it
  const qrSize = 26;
  const qrX = lR - qrSize - 4;
  const qrY = lTop + (lH - qrSize) / 2 + 4;

  const cl = lL + 10;  // content left
  const cr = qrX - 6;  // content right — stops before the QR so text never runs under it
  const nLen = name.length;
  const nSize = nLen > 14 ? 8 : nLen > 10 ? 10 : nLen > 7 ? 11.5 : 13;
  const doseLen = (dose || '').length;
  const badgeW = Math.max(24, doseLen * 5 + 8);

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${VW} ${VH}`}
      className={className}
      style={style}
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <clipPath id="lc">
          <path d={labelPath} />
        </clipPath>

        {/* Matte label surface — very subtle radial brighten at center left (studio light) */}
        <radialGradient id="labelSurface" cx="30%" cy="40%" r="70%">
          <stop offset="0%"   stopColor="#1a1a1a" stopOpacity="1" />
          <stop offset="100%" stopColor="#050505" stopOpacity="1" />
        </radialGradient>

        {/* Left paper edge fade — glass shows through at the very left edge */}
        <linearGradient id="lEdge" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"  stopColor="black" stopOpacity="0.0" />
          <stop offset="100%" stopColor="black" stopOpacity="0.0" />
        </linearGradient>

        {/* Right side — label wraps around, content fades into cylinder shadow */}
        <linearGradient id="rFade" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%"  stopColor="#050505" stopOpacity="0" />
          <stop offset="55%" stopColor="#050505" stopOpacity="0" />
          <stop offset="78%" stopColor="#020202" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.75" />
        </linearGradient>

        {/* Drop shadow filter for label */}
        <filter id="labelShadow" x="-5%" y="-5%" width="110%" height="110%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="2.5" result="blur" />
          <feOffset dx="0" dy="1" result="offset" />
          <feComposite in="offset" in2="SourceGraphic" operator="out" result="shadow" />
          <feColorMatrix in="shadow" type="matrix"
            values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.55 0" result="coloredShadow" />
          <feMerge>
            <feMergeNode in="coloredShadow" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* ── Base vial photo ── */}
      <image href={VIAL_PHOTO} x="0" y="0" width={VW} height={VH}
        preserveAspectRatio="xMidYMid meet" />

      {/* ── Drop shadow (slightly behind label so it looks raised off glass) ── */}
      <path d={shadowPath} fill="black" opacity="0.30" />

      {/* ── Main label, clipped to curved band ── */}
      <g clipPath="url(#lc)" filter="url(#labelShadow)">

        {/* Matte black paper surface */}
        <path d={labelPath} fill="url(#labelSurface)" />

        {/* ── Label content ── */}

        {/* Header row: logo + brand */}
        <HexLogo cx={cl + 6} cy={lTop + 13} r={5.5} />
        <text x={cl + 16} y={lTop + 17}
          fontFamily="'IBM Plex Mono', monospace"
          fontSize="4.8" fontWeight="400" letterSpacing="1.8"
          fill="rgba(255,255,255,0.6)">OMEN LABS</text>

        {/* Hairline */}
        <line x1={cl} y1={lTop + 22} x2={cr} y2={lTop + 22}
          stroke="rgba(255,255,255,0.11)" strokeWidth="0.5" />

        {/* Product name */}
        <text x={cl} y={lTop + 43}
          fontFamily="'Space Grotesk', sans-serif"
          fontSize={nSize} fontWeight="700" letterSpacing="-0.2"
          fill="white">{name}</text>

        {/* Dose badge */}
        <rect x={cl} y={lTop + 48} width={badgeW} height={11} rx="2"
          fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="0.65" />
        <text x={cl + badgeW/2} y={lTop + 55.5}
          textAnchor="middle" dominantBaseline="middle"
          fontFamily="'IBM Plex Mono', monospace"
          fontSize="5.5" fontWeight="500"
          fill="rgba(255,255,255,0.85)">{dose}</text>

        {/* Divider */}
        <line x1={cl} y1={lTop + 66} x2={cr} y2={lTop + 66}
          stroke="rgba(255,255,255,0.11)" strokeWidth="0.5" />

        {/* Purity (two lines so it never runs under the QR) */}
        <text x={cl} y={lTop + 77}
          fontFamily="'IBM Plex Mono', monospace"
          fontSize="4.4" fill="rgba(255,255,255,0.55)">PURITY ≥{purity}%</text>
        <text x={cl} y={lTop + 85}
          fontFamily="'IBM Plex Mono', monospace"
          fontSize="4.4" fill="rgba(255,255,255,0.4)">RESEARCH USE ONLY</text>

        {/* Website */}
        <text x={cl} y={lTop + 95}
          fontFamily="'IBM Plex Mono', monospace"
          fontSize="3.4" letterSpacing="0.2"
          fill="rgba(255,255,255,0.22)">OmenLabs.co</text>

        {/* Right side fade — wraps into darkness (drawn BEFORE the QR) */}
        <path d={labelPath} fill="url(#rFade)" />

        {/* QR — crisp, on top of the fade */}
        <QRBlock x={qrX} y={qrY} size={qrSize} />

      </g>

      {/* ── Paper top edge highlight ── (thin bright line = paper has thickness) */}
      <path d={topEdgePath} fill="none"
        stroke="rgba(255,255,255,0.18)" strokeWidth="1.2" />

      {/* ── Paper bottom edge highlight ── */}
      <path d={botEdgePath} fill="none"
        stroke="rgba(255,255,255,0.12)" strokeWidth="1" />

      {/* ── Dark seam at top label edge (shadow where paper meets glass) ── */}
      <path d={`M ${lL} ${lTop} A ${arcRx} ${arcRy} 0 0 1 ${lR} ${lTop}`}
        fill="none" stroke="rgba(0,0,0,0.5)" strokeWidth="2" />

      {/* ── Dark seam at bottom label edge ── */}
      <path d={`M ${lL} ${lBot} A ${arcRx} ${arcRy} 0 0 1 ${lR} ${lBot}`}
        fill="none" stroke="rgba(0,0,0,0.45)" strokeWidth="2" />

    </svg>
  );
}