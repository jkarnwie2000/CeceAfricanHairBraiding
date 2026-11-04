import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { money } from '../utils/format.js';
import { Rating } from './ui.jsx';
import { IconBag } from './Icons.jsx';

/** `priority` = above-the-fold card: load its image eagerly (it's often the LCP element). */
export default function ProductCard({ product, priority = false }) {
  const { addItem } = useCart();
  const toast = useToast();
  const soldOut = product.inventory <= 0;
  const lowStock = !soldOut && product.inventory <= 5;
  const onSale = product.compareAtPriceCents && product.compareAtPriceCents > product.priceCents;

  const add = () => {
    const r = addItem(product, 1);
    if (r.added > 0) toast.success(`${product.name} added to your cart.`, { action: { to: '/cart', label: 'View cart' } });
    else toast.info(`You already have all ${product.inventory} available in your cart.`);
  };

  return (
    <article className="product-card">
      <div className="media">
        <img
          src={product.images?.[0] || '/images/products/braids-model.webp'}
          alt={product.name}
          loading={priority ? 'eager' : 'lazy'}
          fetchPriority={priority ? 'high' : 'auto'}
          decoding="async"
          width="400"
          height="500"
        />
        <div className="tags">
          {soldOut && <span className="badge badge-dark">Sold out</span>}
          {onSale && <span className="badge badge-gold">Sale</span>}
          {lowStock && <span className="badge badge-warning">Only {product.inventory} left</span>}
        </div>
      </div>
      <div className="body">
        {product.brand && <span className="brand">{product.brand}</span>}
        <h3>
          <Link to={`/shop/${product.slug}`}>{product.name}</Link>
        </h3>
        <Rating average={product.ratingAverage || 0} count={product.ratingCount || 0} />
        <div className="foot">
          <span className="price">
            {money(product.priceCents)}
            {onSale && <s aria-label={`was ${money(product.compareAtPriceCents)}`}>{money(product.compareAtPriceCents)}</s>}
          </span>
          <button
            type="button"
            className="btn btn-sm"
            onClick={add}
            disabled={soldOut}
            aria-label={soldOut ? `${product.name} is sold out` : `Add ${product.name} to cart`}
          >
            <IconBag size={16} />
            {soldOut ? 'Sold out' : 'Add'}
          </button>
        </div>
      </div>
    </article>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="product-card" aria-hidden="true">
      <div className="media skeleton" />
      <div className="body">
        <div className="skeleton" style={{ height: 12, width: '40%' }} />
        <div className="skeleton" style={{ height: 16, width: '90%' }} />
        <div className="skeleton" style={{ height: 16, width: '60%' }} />
      </div>
    </div>
  );
}
