import { useEffect, useRef, useState } from 'react';
import createGlobe from 'cobe';

// Tiny critically-damped spring so drag has inertia without pulling in a dep.
function makeSpring(initial = 0, { stiffness = 0.1, damping = 0.75 } = {}) {
  let value = initial;
  let target = initial;
  let velocity = 0;
  return {
    set: (t) => { target = t; },
    step: () => {
      const force = (target - value) * stiffness;
      velocity = (velocity + force) * damping;
      value += velocity;
      return value;
    },
  };
}

const AUTO_ROTATE_SPEED = 0.004; // radians/frame when idle
const DRAG_SENSITIVITY = 1 / 160; // px -> radians
const THETA = 0.3;               // fixed vertical tilt (must match cobe config)
const MARKER_R = 0.82;           // marker distance from globe centre (globe surface ≈ 0.8)
const DEG = Math.PI / 180;

// Precompute the unit-sphere point for a [lat, lng] exactly the way cobe does
// (decoded from cobe's marker vertex shader) so our HTML dots align with the map.
function toSpherePoint(lat, lng) {
  const latR = lat * DEG;
  const aR = lng * DEG - Math.PI;
  const cl = Math.cos(latR);
  return [-cl * Math.cos(aR), Math.sin(latR), cl * Math.sin(aR)];
}

// Colors visible on a dark navy card. mapBrightness + a lighter baseColor make the
// continents actually read as dotted land instead of a black ball.
const BASE_COLOR = [0.18, 0.28, 0.52];
const GLOW_COLOR = [0.2, 0.45, 1.0];

export default function VisitorGlobe({ points = [] }) {
  const canvasRef = useRef(null);
  const overlayRef = useRef(null);
  const tipRef = useRef(null);

  const pointsRef = useRef([]);       // [{ key, label, count, p:[x,y,z] }]
  const nodeMap = useRef(new Map());  // key -> dot DOM node
  const phiRef = useRef(0);           // accumulated auto-rotation
  const widthRef = useRef(0);         // CSS px width of the (square) canvas
  const draggingRef = useRef(false);
  const dragStartRef = useRef(0);
  const rotStartRef = useRef(0);
  const rotationRef = useRef(0);      // committed drag rotation (radians)
  const springRef = useRef(makeSpring(0));
  const hoverKeyRef = useRef(null);

  const [hover, setHover] = useState(null); // { label, count } for the tooltip text

  // Keep the projected-points ref in sync with incoming data (no globe re-init).
  useEffect(() => {
    pointsRef.current = points.map((pt) => ({
      key: pt.key,
      label: pt.label,
      count: pt.count,
      p: toSpherePoint(pt.lat, pt.lon),
    }));
    // Prune stale DOM refs, and release a hover on a dot that no longer exists
    // (otherwise its pointerleave never fires and the globe stays paused).
    const keys = new Set(points.map((p) => p.key));
    for (const k of nodeMap.current.keys()) if (!keys.has(k)) nodeMap.current.delete(k);
    if (hoverKeyRef.current && !keys.has(hoverKeyRef.current)) {
      hoverKeyRef.current = null;
      setHover(null);
    }
  }, [points]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const measure = () => { widthRef.current = canvas.offsetWidth || 360; };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(canvas);

    // --- drag: window-level listeners so a drag keeps tracking off-canvas ---
    const onMove = (e) => {
      rotationRef.current = rotStartRef.current + (e.clientX - dragStartRef.current) * DRAG_SENSITIVITY;
      springRef.current.set(rotationRef.current);
    };
    const onUp = () => {
      draggingRef.current = false;
      canvas.style.cursor = 'grab';
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    const onDown = (e) => {
      draggingRef.current = true;
      dragStartRef.current = e.clientX;
      rotStartRef.current = rotationRef.current;
      canvas.style.cursor = 'grabbing';
      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
    };
    canvas.addEventListener('pointerdown', onDown);

    const globe = createGlobe(canvas, {
      devicePixelRatio: dpr,
      width: widthRef.current * dpr,
      height: widthRef.current * dpr,
      phi: 0,
      theta: THETA,
      dark: 1,
      diffuse: 1.4,
      mapSamples: 20000,
      mapBrightness: 8,
      baseColor: BASE_COLOR,
      markerColor: [0.3, 0.55, 1.0],
      glowColor: GLOW_COLOR,
      opacity: 1,
      markers: [], // we draw our own HTML dots for hover/tooltips
      onRender: (state) => {
        const paused = draggingRef.current || hoverKeyRef.current !== null;
        if (!paused) phiRef.current += AUTO_ROTATE_SPEED;
        const phi = phiRef.current + springRef.current.step();
        state.phi = phi;
        state.theta = THETA;
        state.width = widthRef.current * dpr;
        state.height = widthRef.current * dpr;

        // Project each visitor dot to screen and move its DOM node.
        const W = widthRef.current;
        const cph = Math.cos(phi), sph = Math.sin(phi);
        const cth = Math.cos(THETA), sth = Math.sin(THETA);
        for (const item of pointsRef.current) {
          const node = nodeMap.current.get(item.key);
          if (!node) continue;
          const [px, py, pz] = item.p;
          const lx = cph * px + sph * pz;
          const ly = sph * sth * px + cth * py - cph * sth * pz;
          const lz = -sph * cth * px + sth * py + cph * cth * pz;
          const x = (lx * MARKER_R * 0.5 + 0.5) * W;
          const y = (0.5 - ly * MARKER_R * 0.5) * W;
          const front = lz > 0;
          node.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`;
          node.style.opacity = front ? '1' : '0.12';
          node.style.pointerEvents = front ? 'auto' : 'none';
          node.style.zIndex = front ? '2' : '1';
          if (hoverKeyRef.current === item.key && tipRef.current) {
            tipRef.current.style.transform = `translate(${x}px, ${y - 16}px) translate(-50%, -100%)`;
          }
        }
      },
    });

    const t = setTimeout(() => { canvas.style.opacity = '1'; }, 0);
    return () => {
      clearTimeout(t);
      ro.disconnect();
      canvas.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      globe.destroy();
    };
  }, []);

  return (
    <div className="relative mx-auto w-full max-w-[420px]" style={{ aspectRatio: '1 / 1' }}>
      {/* ambient brand bloom behind the sphere */}
      <div className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(circle at 50% 50%, rgba(43,107,255,0.30) 0%, rgba(43,107,255,0.06) 55%, transparent 100%)' }} />
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: '100%', cursor: 'grab', contain: 'layout paint size', opacity: 0, transition: 'opacity 0.6s ease', touchAction: 'none' }}
      />
      {/* hover dots overlay */}
      <div ref={overlayRef} className="pointer-events-none absolute inset-0">
        {points.map((pt) => (
          <div
            key={pt.key}
            ref={(el) => { if (el) nodeMap.current.set(pt.key, el); else nodeMap.current.delete(pt.key); }}
            className="absolute left-0 top-0"
            style={{ transform: 'translate(-9999px,-9999px)' }}
            onPointerEnter={() => { hoverKeyRef.current = pt.key; setHover({ label: pt.label, count: pt.count }); }}
            onPointerLeave={() => { hoverKeyRef.current = null; setHover(null); }}
          >
            {/* generous transparent hit area */}
            <div className="relative flex items-center justify-center" style={{ width: 22, height: 22, cursor: 'pointer' }}>
              <span className="absolute rounded-full" style={{ width: 22, height: 22, background: 'radial-gradient(circle, rgba(91,141,255,0.5) 0%, transparent 70%)' }} />
              <span className="visitor-dot-pulse absolute rounded-full" style={{ width: 10, height: 10, background: 'rgba(91,141,255,0.55)' }} />
              <span className="absolute rounded-full" style={{ width: 6, height: 6, background: '#eaf1ff', boxShadow: '0 0 6px 1px rgba(120,170,255,0.9)' }} />
            </div>
          </div>
        ))}
      </div>
      {/* tooltip */}
      <div
        ref={tipRef}
        className="pointer-events-none absolute left-0 top-0 z-10 whitespace-nowrap rounded-lg border border-white/10 bg-[#0a0f1f]/95 px-2.5 py-1.5 shadow-xl transition-opacity"
        style={{ transform: 'translate(-9999px,-9999px)', opacity: hover ? 1 : 0 }}
      >
        {hover && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-white">{hover.label}</span>
            <span className="text-[10px] font-semibold text-primary tabular-nums">{hover.count} {hover.count === 1 ? 'visitor' : 'visitors'}</span>
          </div>
        )}
        <span className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent" style={{ borderTopColor: 'rgba(10,15,31,0.95)' }} />
      </div>
    </div>
  );
}
