import { useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Seo from '../components/Seo.jsx';
import { EmptyState } from '../components/ui.jsx';
import { IconBag } from '../components/Icons.jsx';
import { checkoutApi } from '../api/index.js';

/** Stripe "back" button lands here. The cart is untouched, and the pending order is released. */
export default function CheckoutCancel() {
  const [params] = useSearchParams();
  const sent = useRef(false);

  useEffect(() => {
    const orderId = params.get('order');
    const token = params.get('token');
    if (sent.current || !orderId || !token) return;
    sent.current = true;
    checkoutApi.cancel(orderId, token).catch(() => {
      /* Non-critical: the Stripe session also expires automatically. */
    });
  }, [params]);

  return (
    <>
      <Seo title="Checkout Cancelled" noindex />
      <section className="section">
        <EmptyState
          icon={IconBag}
          title="Checkout cancelled"
          action={
            <div className="row" style={{ justifyContent: 'center' }}>
              <Link to="/cart" className="btn">Return to cart</Link>
              <Link to="/shop" className="btn btn-outline">Keep shopping</Link>
            </div>
          }
        >
          No payment was taken. Your items are still saved in your cart whenever you&apos;re ready.
        </EmptyState>
      </section>
    </>
  );
}
