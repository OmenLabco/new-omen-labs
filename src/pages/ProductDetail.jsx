import { useState, useMemo } from 'react';
import { useParams, Link, useOutletContext } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Shield, FileCheck, Thermometer, Plus, Minus, Check, Tag } from 'lucide-react';
import OmenLogo from '../components/OmenLogo';
import { PRODUCTS, getProductBySlug } from '@/data/products';
import { cart } from '@/lib/cart';
import ProductVialImage from '../components/ProductVialImage';
import { Button } from '@/components/ui/button';
import PurityBadge from '../components/PurityBadge';
import { DISCOUNT_TIERS, getDiscountPct, getDiscountedPrice } from '../lib/discountTiers';

export default function ProductDetail() {
  const { slug } = useParams();
  const { loadCart } = useOutletContext();
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [variantIdx, setVariantIdx] = useState(0);

  const product = useMemo(() => getProductBySlug(slug), [slug]);
  const pairedProducts = useMemo(
    () => product ? PRODUCTS.filter(p => product.paired_products?.includes(p.name)) : [],
    [product]
  );

  const variants = product?.variants || [];
  const variant = variants[Math.min(variantIdx, variants.length - 1)] || { dose: '', price: product?.price || 0 };
  const basePrice = variant.price || 0;

  const discountPct = getDiscountPct(quantity);
  const discountedUnitPrice = product ? getDiscountedPrice(basePrice, quantity) : 0;

  const handleAddToCart = () => {
    cart.add({
      product_id: `${product.id}_${variant.dose}`,
      product_name: `${product.name} ${variant.dose}`,
      quantity,
      price: discountedUnitPrice,
    });
    setAdded(true);
    loadCart();
    setTimeout(() => setAdded(false), 2000);
  };

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Compound not found.</p>
        <Button asChild variant="outline">
          <Link to="/catalog">Return to Catalog</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-28 md:py-20 lg:pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Back */}
        <Link to="/catalog" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-5 lg:mb-8">
          <ArrowLeft className="h-4 w-4" />
          Back to Catalog
        </Link>

        {/* Mobile title (shows above the image; desktop title lives in right column) */}
        <div className="lg:hidden mb-5">
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary">
            {product.category} Protocol
          </span>
          <div className="mt-1.5 flex items-start justify-between gap-3">
            <h1 className="text-3xl font-bold tracking-tight">{product.name}</h1>
            <PurityBadge purity={product.purity} />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-20">
          {/* Left - Sticky Image + Cart */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="aspect-square rounded-2xl overflow-hidden relative" style={{background:'radial-gradient(circle at 50% 42%, #ffffff, #e9ecf2)'}}
            >
              <ProductVialImage
                image={product.image}
                name={product.name}
                className="w-full h-full"
              />
              {/* Logo watermark */}
              <div className="absolute bottom-4 right-4 opacity-25 flex items-center gap-2">
                <OmenLogo size={22} className="text-foreground" />
                <span className="font-semibold text-foreground text-[11px] tracking-[0.18em] uppercase">OMEN LABS</span>
              </div>
            </motion.div>

            {/* Add to cart */}
            <div className="mt-5 lg:mt-8 p-4 sm:p-6 border border-border rounded-2xl">
              {/* Price */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  {product.coming_soon ? (
                    <span className="text-2xl font-bold text-muted-foreground">Coming Soon</span>
                  ) : (
                    <>
                      <span className="text-3xl font-bold">${discountedUnitPrice.toFixed(2)}</span>
                      {discountPct > 0 && (
                        <span className="text-lg text-muted-foreground line-through">${basePrice.toFixed(2)}</span>
                      )}
                    </>
                  )}
                </div>
                <span className="hidden lg:block"><PurityBadge purity={product.purity} /></span>
              </div>

              {/* Dose selector */}
              {!product.coming_soon && variants.length > 1 && (
                <div className="mb-5">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground block mb-2">Size</span>
                  <div className="flex gap-2 flex-wrap">
                    {variants.map((v, i) => (
                      <button
                        key={v.dose}
                        onClick={() => setVariantIdx(i)}
                        className={`px-4 py-2 rounded-xl border text-sm font-medium transition-colors ${
                          i === variantIdx
                            ? 'border-primary bg-primary/10 text-foreground'
                            : 'border-border text-muted-foreground hover:text-foreground hover:border-black/20'
                        }`}
                      >
                        {v.dose} — ${v.price.toFixed(2)}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Active discount badge */}
              {discountPct > 0 && (
                <div className="mb-4 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 w-fit">
                  <Tag className="h-3 w-3 text-emerald-500" />
                  <span className="font-mono text-[11px] text-emerald-600 uppercase tracking-wider">
                    {discountPct}% multi-vial discount applied
                  </span>
                </div>
              )}

              {/* Discount tier chips */}
              <div className="flex gap-2 mb-5 flex-wrap">
                {[...DISCOUNT_TIERS].reverse().map((tier) => (
                  <div
                    key={tier.minQty}
                    className={`px-2.5 py-1 rounded-full border font-mono text-[10px] uppercase tracking-widest transition-colors ${
                      quantity >= tier.minQty
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600'
                        : 'border-border text-muted-foreground'
                    }`}
                  >
                    {tier.label}: {tier.pct}% off
                  </div>
                ))}
              </div>

              {/* Quantity */}
              <div className="flex items-center gap-4 mb-4">
                <span className="text-sm text-muted-foreground">Quantity</span>
                <div className="flex items-center gap-3 ml-auto">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-2 rounded-lg border border-border hover:bg-accent transition-colors"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="font-mono text-sm w-8 text-center">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="p-2 rounded-lg border border-border hover:bg-accent transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Subtotal */}
              {quantity > 1 && (
                <div className="flex items-center justify-between mb-4 font-mono text-[11px] text-muted-foreground border-t border-border pt-4">
                  <span>Subtotal ({quantity} vials)</span>
                  <span className="text-foreground font-semibold">${(discountedUnitPrice * quantity).toFixed(2)}</span>
                </div>
              )}

              <Button
                onClick={handleAddToCart}
                className="w-full h-12 text-sm font-medium tracking-wide"
                disabled={added || product.coming_soon}
              >
                {product.coming_soon ? (
                  'Coming Soon'
                ) : added ? (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Added to Protocol
                  </>
                ) : (
                  'Add to Protocol'
                )}
              </Button>

              <p className="mt-4 font-mono text-[10px] text-destructive text-center uppercase tracking-wider">
                For Research Use Only
              </p>
              <p className="mt-1.5 font-mono text-[10px] text-muted-foreground text-center uppercase tracking-wider">
                All sales are final — no returns or exchanges
              </p>
            </div>
          </div>

          {/* Right - Details */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="hidden lg:block">
              <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-primary">
                {product.category} Protocol
              </span>
              <h1 className="mt-4 text-4xl md:text-5xl font-bold tracking-tight">
                {product.name}
              </h1>
            </div>

            {product.sequence && (
              <p className="mt-4 hidden lg:block font-mono text-[11px] text-muted-foreground break-all leading-relaxed opacity-40">
                {product.sequence}
              </p>
            )}

            {/* Specs */}
            <div className="mt-2 lg:mt-10 space-y-0">
              {[
                { label: 'Molecular Weight', value: product.molecular_weight },
                { label: 'Purity', value: `≥${product.purity}%` },
                { label: 'Storage', value: product.storage },
                { label: 'Dosage', value: product.dosage },
              ].filter(s => s.value).map((spec) => (
                <div key={spec.label} className="flex items-center justify-between py-4 border-b border-border">
                  <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                    {spec.label}
                  </span>
                  <span className="text-sm font-medium">{spec.value}</span>
                </div>
              ))}
            </div>

            {/* Description */}
            {product.description && (
              <div className="mt-10">
                <h3 className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground mb-4">
                  Research Summary
                </h3>
                <p className="text-sm text-muted-foreground leading-[1.8]">
                  {product.description}
                </p>
              </div>
            )}

            {/* COA */}
            <div className="mt-10 p-5 rounded-2xl border border-primary/20 bg-primary/[0.02]">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <FileCheck className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">Certificate of Analysis</p>
                  <p className="text-[12px] text-muted-foreground">
                    HPLC test results available upon request
                  </p>
                </div>
              </div>
            </div>

            {/* Paired Products */}
            {pairedProducts.length > 0 && (
              <div className="mt-12">
                <h3 className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground mb-6">
                  Frequently Paired Protocols
                </h3>
                <div className="space-y-3">
                  {pairedProducts.map((p) => (
                    <Link
                      key={p.id}
                      to={`/product/${p.slug}`}
                      className="flex items-center justify-between p-4 rounded-xl border border-border hover:border-primary/20 hover:bg-primary/[0.02] transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <ProductVialImage
                          image={p.image}
                          name={p.name}
                          className="h-10 w-10"
                        />
                        <div>
                          <p className="text-sm font-medium">{p.name}</p>
                          <p className="font-mono text-[10px] text-muted-foreground">{p.category}</p>
                        </div>
                      </div>
                      <span className="text-sm font-semibold">{p.price != null ? `$${p.price.toFixed(2)}` : 'TBA'}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Mobile sticky buy bar */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 frosted border-t border-black/[0.08] px-4 py-3"
        style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}>
        <div className="flex items-center gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground truncate">
              {product.name}{variant.dose ? ` · ${variant.dose}` : ''}{quantity > 1 ? ` × ${quantity}` : ''}
            </p>
            <p className="text-lg font-bold leading-tight">
              {product.coming_soon ? 'TBA' : `$${(discountedUnitPrice * quantity).toFixed(2)}`}
            </p>
          </div>
          <Button
            onClick={handleAddToCart}
            disabled={added || product.coming_soon}
            className="flex-1 h-12 text-sm font-semibold tracking-wide"
          >
            {product.coming_soon ? 'Coming Soon' : added ? (
              <><Check className="mr-2 h-4 w-4" /> Added</>
            ) : (
              'Add to Protocol'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}