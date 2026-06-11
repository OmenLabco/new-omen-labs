import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

/**
 * Interactive floating vial cluster for the hero.
 * Desktop: vials bob idly and shift with cursor parallax (each at a different depth).
 * Mobile/touch: same cluster with the idle float only.
 */
const VIALS = [
  {
    src: '/hero/bpc.png',
    alt: 'BPC-157 10mg vial',
    to: '/product/bpc-157',
    label: 'BPC-157',
    sub: 'from $40',
    depth: 26,
    className: 'absolute left-[2%] bottom-[6%] w-[38%] z-10',
    rotate: -10,
    float: 5.2,
  },
  {
    src: '/hero/glp.png',
    alt: 'GLP-3 RT 10mg vial',
    to: '/product/glp-rt',
    label: 'GLP-3 RT',
    sub: 'from $80',
    depth: 44,
    className: 'absolute left-[28%] bottom-[10%] w-[46%] z-20',
    rotate: 3,
    float: 6.5,
  },
  {
    src: '/hero/ghk.png',
    alt: 'GHK-Cu 100mg vial',
    to: '/product/ghk-cu',
    label: 'GHK-Cu',
    sub: 'from $35',
    depth: 32,
    className: 'absolute right-[2%] bottom-[4%] w-[36%] z-10',
    rotate: 12,
    float: 4.4,
  },
];

function Vial({ v, mx, my }) {
  const x = useTransform(mx, (val) => val * v.depth);
  const y = useTransform(my, (val) => val * v.depth * 0.6);

  return (
    <motion.div className={v.className} style={{ x, y }}>
      <motion.div
        animate={{ y: [0, -12, 0] }}
        transition={{ duration: v.float, repeat: Infinity, ease: 'easeInOut' }}
      >
        <Link to={v.to} className="group block relative" aria-label={v.label}>
          <motion.img
            src={v.src}
            alt={v.alt}
            draggable="false"
            className="w-full h-auto select-none drop-shadow-[0_24px_28px_rgba(40,70,160,0.28)] transition-transform duration-300 group-hover:scale-[1.05]"
            style={{ rotate: v.rotate }}
          />
          {/* hover chip */}
          <span className="pointer-events-none absolute left-1/2 -bottom-2 -translate-x-1/2 translate-y-full whitespace-nowrap rounded-full border border-primary/25 bg-white/90 backdrop-blur px-3 py-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-lg shadow-primary/10">
            <span className="text-[11px] font-semibold text-foreground">{v.label}</span>
            <span className="ml-1.5 font-mono text-[10px] text-primary">{v.sub}</span>
          </span>
        </Link>
      </motion.div>
    </motion.div>
  );
}

export default function HeroVials() {
  const ref = useRef(null);
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const mx = useSpring(rawX, { stiffness: 60, damping: 18 });
  const my = useSpring(rawY, { stiffness: 60, damping: 18 });

  const onMove = (e) => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    rawX.set(((e.clientX - r.left) / r.width - 0.5) * 2);
    rawY.set(((e.clientY - r.top) / r.height - 0.5) * 2);
  };
  const onLeave = () => {
    rawX.set(0);
    rawY.set(0);
  };

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className="relative w-full aspect-[5/4] max-w-[340px] sm:max-w-[440px] lg:max-w-none mx-auto"
    >
      {/* soft glow behind cluster */}
      <div
        className="absolute inset-[8%] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 60% 50% at 50% 55%, rgba(90,130,255,0.16) 0%, transparent 70%)' }}
      />
      {VIALS.map((v) => (
        <Vial key={v.label} v={v} mx={mx} my={my} />
      ))}
    </div>
  );
}
