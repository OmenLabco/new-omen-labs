/**
 * ProductVialImage
 *
 * Renders the standard Omen Labs product shot: a floating black vial (no label)
 * on a dark background. Used everywhere a product image is shown.
 * Props (name/dose/purity/category) are accepted for backward compatibility but
 * no longer drawn — the physical label is applied to real vials, not the render.
 */
export default function ProductVialImage({ name = '', className = '', style = {} }) {
  return (
    <img
      src="/vial.png"
      alt={name ? `${name} — Omen Labs vial` : 'Omen Labs vial'}
      className={className}
      style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block', ...style }}
      loading="lazy"
    />
  );
}
