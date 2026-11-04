import { Link, useNavigate } from 'react-router-dom';
import Seo from '../components/Seo.jsx';
import OrderSummary from '../components/OrderSummary.jsx';
import { Alert, EmptyState, QuantityStepper } from '../components/ui.jsx';
import { IconBag, IconTrash, IconLock, IconArrowLeft } from '../components/Icons.jsx';
import { useCart } from '../context/CartContext.jsx';
import { useCartQuote } from '../hooks/useCartQuote.js';
import { money } from '../utils/format.js';

export default function Cart() {
  const { items, updateQuantity, removeItem, count } = useCart();
  const { quote, loading, error, notices } = useCartQuote();
  const navigate = useNavigate();

  if (!items.length) {
    return (
      <>
        <Seo title="Your Cart" noindex />
        <section className="section">
          <EmptyState
            icon={IconBag}
            title="Your cart is empty"
            action={
              <Link to="/shop" className="btn">
                Start shopping
              </Link>
            }
          >
            Discover braiding hair, oils and edge control loved by our braiders.
          </EmptyState>
        </section>
      </>
    );
  }

  const canCheckout = !loading && !error && quote?.lines?.length > 0;

  return (
    <>
      <Seo title="Your Cart" noindex />
      <section className="section-sm">
        <div className="container">
          <h1 className="h-page">Your cart <span className="muted">({count})</span></h1>
          <div className="cart-layout">
            <div>
              {notices.length > 0 && (
                <Alert type="warning" title="We updated your cart">
                  <ul>{notices.map((n) => <li key={n}>{n}</li>)}</ul>
                </Alert>
              )}
              {error && <Alert type="error">{error}</Alert>}
              <ul className="cart-lines">
                {items.map((i) => (
                  <li key={i.productId} className="cart-line">
                    <Link to={`/shop/${i.slug}`} className="cart-img">
                      <img src={i.image} alt={i.name} width="96" height="120" loading="lazy" />
                    </Link>
                    <div className="cart-info">
                      <Link to={`/shop/${i.slug}`} className="cart-name">{i.name}</Link>
                      <span className="small muted">{money(i.priceCents)} each</span>
                      {i.inventory <= 5 && <span className="small" style={{ color: 'var(--warning)' }}>Only {i.inventory} in stock</span>}
                      <div className="cart-controls">
                        <QuantityStepper value={i.quantity} min={1} max={Math.min(i.inventory ?? 99, 99)} onChange={(q) => updateQuantity(i.productId, q)} label={`Quantity for ${i.name}`} />
                        <button type="button" className="link-btn danger row" style={{ gap: 4 }} onClick={() => removeItem(i.productId)} aria-label={`Remove ${i.name} from cart`}>
                          <IconTrash size={16} /> Remove
                        </button>
                      </div>
                    </div>
                    <div className="cart-amt">{money(i.priceCents * i.quantity)}</div>
                  </li>
                ))}
              </ul>
              <Link to="/shop" className="btn btn-ghost" style={{ marginTop: 12 }}>
                <IconArrowLeft size={16} /> Continue shopping
              </Link>
            </div>
            <aside>
              <OrderSummary totals={quote?.totals} loading={loading} compact>
                <button type="button" className="btn btn-lg btn-block" style={{ marginTop: 16 }} disabled={!canCheckout} onClick={() => navigate('/checkout')}>
                  <IconLock size={18} /> Proceed to checkout
                </button>
                <p className="small muted text-center" style={{ margin: '12px 0 0' }}>
                  Taxes and shipping calculated securely on our server.
                </p>
              </OrderSummary>
            </aside>
          </div>
        </div>
      </section>
    </>
  );
}
