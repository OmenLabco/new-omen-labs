import { useEffect, useRef, useCallback } from 'react';
import createGlobe from 'cobe';

// Tiny critically-damped spring so drag has inertia without pulling in a dep.
function makeSpring(initial = 0, { stiffness = 0.09, damping = 0.72 } = {}) {
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

const AUTO_ROTATE_SPEED = 0.0032; // radians/frame when idle
const DRAG_SENSITIVITY = 1 / 220; // px -> radians

// Module-level so the defaults keep a STABLE identity across renders. If these
// were inline literals, every 5s poll re-render would change the init effect's
// deps and destroy/recreate the WebGL globe (flicker + rotation reset).
const BASE_COLOR = [0.09, 0.15, 0.29];
const MARKER_COLOR = [0.3, 0.55, 1.0];
const GLOW_COLOR = [0.17, 0.42, 1.0];

// Interactive cobe globe. Markers update live (via a ref read inside onRender) so
// the 5s poll never re-creates the WebGL context — rotation stays perfectly smooth.
export default function VisitorGlobe({
  markers = [],
  baseColor = BASE_COLOR,
  markerColor = MARKER_COLOR,
  glowColor = GLOW_COLOR,
}) {
  const canvasRef = useRef(null);
  const markersRef = useRef(markers);
  const phiRef = useRef(0);
  const widthRef = useRef(0);
  const pointerDownXRef = useRef(null);
  const rotationRef = useRef(0);
  const springRef = useRef(makeSpring(0));
  const pulseRef = useRef(0);

  useEffect(() => { markersRef.current = markers; }, [markers]);

  const onPointerDown = useCallback((clientX) => {
    pointerDownXRef.current = clientX - rotationRef.current / DRAG_SENSITIVITY;
    if (canvasRef.current) canvasRef.current.style.cursor = 'grabbing';
  }, []);
  const onPointerUp = useCallback(() => {
    pointerDownXRef.current = null;
    if (canvasRef.current) canvasRef.current.style.cursor = 'grab';
  }, []);
  const onPointerMove = useCallback((clientX) => {
    if (pointerDownXRef.current !== null) {
      rotationRef.current = (clientX - pointerDownXRef.current) * DRAG_SENSITIVITY;
      springRef.current.set(rotationRef.current);
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const measure = () => { widthRef.current = canvas.offsetWidth || 360; };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(canvas);

    const globe = createGlobe(canvas, {
      devicePixelRatio: dpr,
      width: widthRef.current * dpr,
      height: widthRef.current * dpr,
      phi: 0,
      theta: 0.28,
      dark: 1,
      diffuse: 1.2,
      mapSamples: 16000,
      mapBrightness: 6,
      baseColor,
      markerColor,
      glowColor,
      opacity: 0.95,
      markers: markersRef.current,
      onRender: (state) => {
        if (pointerDownXRef.current === null) phiRef.current += AUTO_ROTATE_SPEED;
        state.phi = phiRef.current + springRef.current.step();
        state.theta = 0.28;
        state.width = widthRef.current * dpr;
        state.height = widthRef.current * dpr;
        pulseRef.current += 0.05;
        const pulse = 1 + 0.35 * Math.sin(pulseRef.current);
        state.markers = markersRef.current.map((m) => ({ ...m, size: (m.size ?? 0.05) * pulse }));
      },
    });

    const t = setTimeout(() => { canvas.style.opacity = '1'; }, 0);
    return () => {
      clearTimeout(t);
      ro.disconnect();
      globe.destroy();
    };
  }, [baseColor, markerColor, glowColor]);

  return (
    <div className="relative mx-auto w-full max-w-[420px]" style={{ aspectRatio: '1 / 1' }}>
      {/* ambient brand bloom behind the sphere */}
      <div className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(circle at 50% 50%, rgba(43,107,255,0.28) 0%, rgba(43,107,255,0.06) 55%, transparent 100%)' }} />
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: '100%', cursor: 'grab', contain: 'layout paint size', opacity: 0, transition: 'opacity 0.6s ease', touchAction: 'none' }}
        onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); onPointerDown(e.clientX); }}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onPointerOut={onPointerUp}
        onPointerMove={(e) => onPointerMove(e.clientX)}
        onTouchMove={(e) => { if (e.touches[0]) onPointerMove(e.touches[0].clientX); }}
      />
    </div>
  );
}
