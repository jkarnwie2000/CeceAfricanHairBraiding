import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Seo from '../components/Seo.jsx';
import { Alert, EmptyState, PageLoader, Spinner, StatusBadge } from '../components/ui.jsx';
import { IconCheckCircle, IconBag } from '../components/Icons.jsx';
import { useCart } from '../context/CartContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { checkoutApi } from '../api/index.js';
import { getErrorMessage, getStatus } from '../api/http.js';
import { money, ORDER_STATUS_BADGE } from '../utils/format.js';

/**
 * Stripe redirects here after payment. The order is marked paid ONLY by the verified webhook,
 * so we poll briefly until the webhook has been processed.
 */
export default function CheckoutSuccess() {
  const [params] = useSearchParams();
  const sessionId = params.get('session_id');
  const { clear } = useCart();
  const { user } = useAuth();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');
  const [waiting, setWaiting] = useState(true);
  const cleared = useRef(false);

  useEffect(() => {
    if (!cleared.current && sessionId) {
      clear(); // the customer completed Stripe Checkout — empty the cart
      cleared.current = true;
    }
  }, [sessionId, clear]);

  useEffect(() => {
    if (!sessionId) return undefined;
    let attempts = 0;
    let timer;
    let stopped = false;
    const poll = async () => {
      attempts++;
      try {
        const r = await checkoutApi.getBySession(sessionId);
        if (stopped) return;
        setOrder(r.order);
        if (r.order.paymentStatus === 'paid' || attempts >= 15) {
          setWaiting(false);
          return;
        }
      } catch (err) {
        if (stopped) return;
        if (getStatus(err) !== 404 || attempts >= 15) {
          setError(getErrorMessage(err));
          setWaiting(false);
          return;
        }
      }
      timer = setTimeout(poll, 2000);
    };
    poll();
    return () => {
      stopped = true;
      clearTimeout(timer);
    };
  }, [sessionId]);

  if (!sessionId)
    return (
      <section className="section">
        <EmptyState icon={IconBag} title="No order to show" action={<Link to="/shop" className="btn">Go to shop</Link>} />
      </section>
    );
  if (!order && !error) return <PageLoader label="Confirming your payment…" />;
  if (error && !order)
    return (
      <section className="section">
        <div className="container container-narrow">
          <Alert type="warning" title="We're still confirming your order">
            {error} If your payment went through you&apos;ll receive a confirmation email shortly.
          </Alert>
        </div>
      </section>
    );

  const paid = order.paymentStatus === 'paid';
  const a = order.shippingAddress;

  return (
    <>
      <Seo title="Order Confirmation" noindex />
      <section className="section">
        <div className="container container-narrow">
          <div className="card card-pad confirm-card">
            <div className="confirm-icon">{paid ? <IconCheckCircle size={40} /> : <Spinner large />}</div>
            <h1>{paid ? 'Thank you for your order!' : 'Finalizing your order…'}</h1>
            <p className="lead" style={{ marginInline: 'auto' }}>
              {paid ? (
                <>Your payment was successful. A confirmation email is on its way to <strong>{order.customer.email}</strong>.</>
              ) : waiting ? (
                'Your payment was submitted. We are waiting for confirmation from Stripe — this usually takes a few seconds.'
              ) : (
                'Your payment is still being confirmed. You will receive an email as soon as it completes — no need to pay again.'
              )}
            </p>
            <dl className="summary-list">
              <div><dt>Order number</dt><dd><strong>{order.orderNumber}</strong></dd></div>
              <div><dt>Status</dt><dd><StatusBadge map={ORDER_STATUS_BADGE} value={order.status} /></dd></div>
              <div><dt>Ship to</dt><dd>{order.customer.firstName} {order.customer.lastName}, {a.line1}{a.line2 ? `, ${a.line2}` : ''}, {a.city}, {a.state} {a.postalCode}</dd></div>
            </dl>
            <ul className="summary-lines" style={{ textAlign: 'left' }}>
              {order.items.map((i) => (
                <li key={i.product}>
                  <span className="summary-thumb">
                    <img src={i.image} alt="" width="56" height="56" />
                    <span className="summary-qty">{i.quantity}</span>
                  </span>
                  <span className="summary-name">{i.name}</span>
                  <span className="summary-amt">{money(i.priceCents * i.quantity)}</span>
                </li>
              ))}
            </ul>
            <dl className="totals" style={{ textAlign: 'left' }}>
              <div><dt>Subtotal</dt><dd>{money(order.subtotalCents)}</dd></div>
              <div><dt>Shipping</dt><dd>{order.shippingCents ? money(order.shippingCents) : 'Free'}</dd></div>
              <div><dt>Tax</dt><dd>{money(order.taxCents)}</dd></div>
              <div className="grand"><dt>Total paid</dt><dd>{money(order.totalCents)}</dd></div>
            </dl>
            <div className="row" style={{ justifyContent: 'center', marginTop: 24 }}>
              {user ? (
                <Link to="/account/orders" className="btn">Track my order</Link>
              ) : (
                <Link to="/register" className="btn">Create an account to track orders</Link>
              )}
              <Link to="/shop" className="btn btn-outline">Continue shopping</Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
