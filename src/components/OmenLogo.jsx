export default function OmenLogo({ size = 32, className = '' }) {
  // Hexagon points (flat-top orientation, radius R)
  const R = 44; // outer radius
  const cx = 50, cy = 50;
  // 6 vertices: starting from top-right, going clockwise
  // flat-top: angles 30, 90, 150, 210, 270, 330
  const pts = Array.from({ length: 6 }, (_, i) => {
    const angle = (Math.PI / 180) * (30 + 60 * i);
    return [cx + R * Math.cos(angle), cy + R * Math.sin(angle)];
  });

  const hex = pts.map(p => p.join(',')).join(' ');

  // Inner double-bond arcs (benzene style) — 3 alternating sides get a parallel inner line
  // sides 0,2,4 (every other side)
  const innerR = R * 0.72;
  const innerPts = Array.from({ length: 6 }, (_, i) => {
    const angle = (Math.PI / 180) * (30 + 60 * i);
    return [cx + innerR * Math.cos(angle), cy + innerR * Math.sin(angle)];
  });

  // Double bond sides: 0-1, 2-3, 4-5 (alternating)
  const doubleSides = [[0, 1], [2, 3], [4, 5]];

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Outer hexagon */}
      <polygon
        points={hex}
        stroke="currentColor"
        strokeWidth="4"
        fill="none"
        strokeLinejoin="round"
      />

      {/* Inner double-bond lines (benzene alternating sides) */}
      {doubleSides.map(([a, b], i) => (
        <line
          key={i}
          x1={innerPts[a][0]}
          y1={innerPts[a][1]}
          x2={innerPts[b][0]}
          y2={innerPts[b][1]}
          stroke="currentColor"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
      ))}

      {/* Center dot */}
      <circle cx={cx} cy={cy} r="4" fill="currentColor" />
    </svg>
  );
}