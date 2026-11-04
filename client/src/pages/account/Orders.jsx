import { Link } from 'react-router-dom';
import { Alert, EmptyState, PageLoader, StatusBadge } from '../../components/ui.jsx';
import { IconBag } from '../../components/Icons.jsx';
import { useAsync } from '../../hooks/useAsync.js';
import { ordersApi } from '../../api/index.js';
import { money, formatTimestamp, ORDER_STATUS_BADGE } from '../../utils/format.js';

const STEPS = ['processing', 'shipped', 'delivered'];

function Tracker({ status }) {
  if (status === 'cancelled') return null;
  const idx = STEPS.indexOf(status);
  return (
    <div className="tracker" aria-label={`Order progress: ${status}`}>
      {['Ordered', 'Processing', 'Shipped', 'Delivered'].map((label, i) => (
        <div key={label} className={`tracker-step${i <= idx + 1 ? ' done' : ''}`}>
          {label}
        </div>
      ))}
    </div>
  );
}

export default function Orders() {
  const { data, loading, error, reload } = useAsync(() => ordersApi.mine(), []);
  if (loading) return <PageLoader label="Loading your orders…" />;
  if (error) return <Alert type="error" onRetry={reload}>{error}</Alert>;
  if (!data.orders.length)
    return (
      <EmptyState icon={IconBag} title="No orders yet" action={<Link to="/shop" className="btn">Shop now</Link>}>
        When you place an order, you can track it here.
      </EmptyState>
    );

  return (
    <div className="stack">
      {data.orders.map((o) => (
        <article key={o.id} className="panel order-card">
          <div className="row-between">
            <div>
              <h2 className="h-sm" style={{ margin: 0 }}>Order {o.orderNumber}</h2>
              <span className="small muted">Placed {formatTimestamp(o.createdAt)} · {money(o.totalCents)}</span>
            </div>
            <StatusBadge map={ORDER_STATUS_BADGE} value={o.paymentStatus === 'refunded' ? 'cancelled' : o.status} />
          </div>
          <Tracker status={o.status} />
          {o.trackingNumber && (
            <p className="small">
              Tracking: <strong>{o.carrier} {o.trackingNumber}</strong>
            </p>
          )}
          <ul className="order-items">
            {o.items.map((i) => (
              <li key={i.product}>
                <img src={i.image} alt="" width="48" height="48" className="thumb" loading="lazy" />
                <Link to={`/shop/${i.slug}`}>{i.name}</Link>
                <span className="muted small">× {i.quantity}</span>
                <span className="order-amt">{money(i.priceCents * i.quantity)}</span>
              </li>
            ))}
          </ul>
        </article>
      ))}
    </div>
  );
}
