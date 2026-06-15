/**
 * ProductVialImage — shows the product's own render when available.
 * Products without a render yet show a blurred donor vial render with an
 * "Image coming soon" overlay (donor: BPC-157 render).
 */
const PLACEHOLDER_RENDER = '/products/glp-rt.jpeg';

export default function ProductVialImage({ image = null, name = '', className = '', style = {} }) {
  if (image) {
    return (
      <img
        src={image}
        alt={name ? `${name} — Omen Labs vial` : 'Omen Labs vial'}
        className={`render ${className}`}
        style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block', ...style }}
        loading="lazy"
      />
    );
  }

  // Blurred placeholder
  return (
    <div
      className={className}
      style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', containerType: 'inline-size', ...style }}
    >
      <img
        src={PLACEHOLDER_RENDER}
        alt={name ? `${name} — render coming soon` : 'Render coming soon'}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          display: 'block',
          filter: 'blur(10px) brightness(0.75)',
          transform: 'scale(1.08)', // hide blur edge bleed
        }}
        loading="lazy"
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <span
          style={{
            fontFamily: "'IBM Plex Mono', ui-monospace, monospace",
            textTransform: 'uppercase',
            letterSpacing: '0.22em',
            color: 'rgba(255,255,255,0.85)',
            background: 'rgba(5,8,16,0.55)',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: '9999px',
            padding: '0.5em 1.1em',
            fontSize: 'clamp(7px, 5cqw, 12px)',
            whiteSpace: 'nowrap',
          }}
        >
          Image coming soon
        </span>
      </div>
    </div>
  );
}
