import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Seo from '../components/Seo.jsx';
import ProductCard from '../components/ProductCard.jsx';
import { Alert, Breadcrumbs, EmptyState, Field, PageLoader, QuantityStepper, Rating, Spinner, StarRating } from '../components/ui.jsx';
import { IconBag, IconTruck, IconShield, IconLeaf, IconBox } from '../components/Icons.jsx';
import { useAsync } from '../hooks/useAsync.js';
import { useCart } from '../context/CartContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { productsApi } from '../api/index.js';
import { getErrorMessage } from '../api/http.js';
import { money, formatTimestamp } from '../utils/format.js';

function ReviewForm({ productId, onCreated }) {
  const [form, setForm] = useState({ rating: 5, title: '', comment: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const r = await productsApi.addReview(productId, form);
      onCreated(r.review);
      setForm({ rating: 5, title: '', comment: '' });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };
  return (
    <form className="panel stack" onSubmit={submit}>
      <h3>Write a review</h3>
      <fieldset className="rating-input">
        <legend className="label">Your rating</legend>
        {[1, 2, 3, 4, 5].map((n) => (
          <label key={n} className={n <= form.rating ? 'on' : ''}>
            <input type="radio" name="rating" value={n} checked={form.rating === n} onChange={() => setForm({ ...form, rating: n })} className="sr-only" />
            <span aria-hidden="true">★</span>
            <span className="sr-only">{n} star{n > 1 ? 's' : ''}</span>
          </label>
        ))}
      </fieldset>
      <Field label="Title (optional)">
        {(p) => <input {...p} className="input" maxLength={120} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />}
      </Field>
      <Field label="Your review" required>
        {(p) => <textarea {...p} className="textarea" minLength={5} maxLength={2000} required value={form.comment} onChange={(e) => setForm({ ...form, comment: e.target.value })} />}
      </Field>
      {error && <Alert type="error">{error}</Alert>}
      <button className="btn" type="submit" disabled={busy}>
        {busy ? <Spinner label="Submitting" /> : 'Submit review'}
      </button>
    </form>
  );
}

export default function ProductDetail() {
  const { slug } = useParams();
  const { user } = useAuth();
  const { addItem, items } = useCart();
  const toast = useToast();
  const { data, loading, error, reload } = useAsync(() => productsApi.get(slug), [slug]);
  const product = data?.product;
  const reviews = useAsync(() => (product ? productsApi.reviews(product._id) : Promise.resolve({ reviews: [] })), [product?._id]);
  const [qty, setQty] = useState(1);
  useEffect(() => setQty(1), [slug]);

  if (loading) return <PageLoader label="Loading product…" />;
  if (error)
    return (
      <section className="section">
        <EmptyState icon={IconBox} title="Product not found" action={<Link className="btn" to="/shop">Back to shop</Link>}>
          {error}
        </EmptyState>
      </section>
    );

  const inCart = items.find((i) => i.productId === product._id)?.quantity || 0;
  const remaining = Math.max(0, product.inventory - inCart);
  const soldOut = product.inventory <= 0;
  const onSale = product.compareAtPriceCents > product.priceCents;
  const reviewList = reviews.data?.reviews || [];

  const add = () => {
    const r = addItem(product, qty);
    if (r.added > 0) {
      toast.success(r.limited ? `Added ${r.added} — that's all we have in stock.` : `${product.name} added to your cart.`, { action: { to: '/cart', label: 'View cart' } });
      setQty(1);
    } else {
      toast.info(`You already have all ${product.inventory} available units in your cart.`);
    }
  };

  return (
    <>
      <Seo title={product.name} description={product.description.slice(0, 155)} image={product.images?.[0]} />
      <section className="section-sm">
        <div className="container">
          <Breadcrumbs items={[{ label: 'Shop', to: '/shop' }, { label: product.category?.name, to: `/shop?category=${product.category?.slug}` }, { label: product.name }]} />
          <div className="pdp">
            <div className="pdp-media">
              <img src={product.images?.[0]} alt={product.name} width="700" height="875" />
            </div>
            <div className="pdp-info">
              {product.brand && <span className="eyebrow">{product.brand}</span>}
              <h1 className="pdp-title">{product.name}</h1>
              <a href="#reviews" className="pdp-rating">
                <Rating average={product.ratingAverage} count={product.ratingCount} />
              </a>
              <p className="pdp-price">
                {money(product.priceCents)}
                {onSale && <s>{money(product.compareAtPriceCents)}</s>}
              </p>
              <p className="pdp-stock">
                {soldOut ? (
                  <span className="badge badge-danger">Out of stock</span>
                ) : product.inventory <= 5 ? (
                  <span className="badge badge-warning">Only {product.inventory} left in stock</span>
                ) : (
                  <span className="badge badge-success">In stock</span>
                )}
              </p>
              <p className="pdp-desc">{product.description}</p>

              {!soldOut && (
                <div className="pdp-buy">
                  <QuantityStepper value={Math.min(qty, Math.max(1, remaining))} min={1} max={Math.max(1, remaining)} onChange={setQty} disabled={remaining === 0} />
                  <button type="button" className="btn btn-lg" onClick={add} disabled={remaining === 0}>
                    <IconBag size={18} /> {remaining === 0 ? 'All in your cart' : 'Add to cart'}
                  </button>
                </div>
              )}
              {inCart > 0 && (
                <p className="small muted">
                  {inCart} in your cart · <Link to="/cart">View cart</Link>
                </p>
              )}

              <ul className="pdp-perks">
                <li><IconTruck size={18} /> Free shipping on orders over $75</li>
                <li><IconShield size={18} /> Secure checkout with Stripe</li>
                <li><IconLeaf size={18} /> Salon-tested by our braiders</li>
              </ul>
              {product.tags?.length > 0 && (
                <div className="row" style={{ gap: 6 }}>
                  {product.tags.map((t) => (
                    <Link key={t} to={`/shop?q=${encodeURIComponent(t)}`} className="badge">
                      {t}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="section-sm section-alt" id="reviews" aria-labelledby="reviews-heading">
        <div className="container reviews-layout">
          <div>
            <h2 id="reviews-heading">Customer reviews</h2>
            <div className="row" style={{ marginBottom: 20 }}>
              <StarRating value={product.ratingAverage} size={20} />
              <span className="muted">
                {product.ratingCount ? `${product.ratingAverage.toFixed(1)} out of 5 · ${product.ratingCount} review${product.ratingCount > 1 ? 's' : ''}` : 'No reviews yet'}
              </span>
            </div>
            {reviews.loading && <Spinner />}
            {reviews.error && <Alert type="error" onRetry={reviews.reload}>{reviews.error}</Alert>}
            {!reviews.loading && reviewList.length === 0 && <p className="muted">Be the first to share your experience with this product.</p>}
            <ul className="review-list">
              {reviewList.map((r) => (
                <li key={r._id} className="review">
                  <div className="row-between">
                    <StarRating value={r.rating} size={14} />
                    <span className="small muted">{formatTimestamp(r.createdAt)}</span>
                  </div>
                  {r.title && <h3>{r.title}</h3>}
                  <p>{r.comment}</p>
                  <p className="small muted" style={{ margin: 0 }}>
                    {r.name}
                    {r.verifiedPurchase && <span className="badge badge-success" style={{ marginLeft: 8 }}>Verified purchase</span>}
                  </p>
                </li>
              ))}
            </ul>
          </div>
          <div>
            {user ? (
              <ReviewForm
                productId={product._id}
                onCreated={() => {
                  toast.success('Thank you for your review!');
                  reviews.reload();
                  reload();
                }}
              />
            ) : (
              <div className="panel">
                <h3>Share your thoughts</h3>
                <p className="muted">Log in to write a review for this product.</p>
                <Link to={`/login?redirect=/shop/${product.slug}`} className="btn btn-outline">
                  Log in to review
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      {data.related?.length > 0 && (
        <section className="section-sm" aria-labelledby="related-heading">
          <div className="container">
            <h2 id="related-heading">You may also like</h2>
            <div className="grid grid-4">
              {data.related.map((p) => (
                <ProductCard key={p._id} product={p} />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
