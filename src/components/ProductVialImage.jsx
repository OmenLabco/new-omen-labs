/**
 * ProductVialImage — shows the product's own render when available,
 * falling back to the generic blank vial. Pass `image` (path) from the product.
 */
export default function ProductVialImage({ image = null, name = '', className = '', style = {} }) {
  return (
    <img
      src={image || '/vial.png'}
      alt={name ? `${name} — Omen Labs vial` : 'Omen Labs vial'}
      className={className}
      style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block', ...style }}
      loading="lazy"
    />
  );
}
