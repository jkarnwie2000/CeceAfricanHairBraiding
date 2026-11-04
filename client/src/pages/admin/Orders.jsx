import { Fragment, useEffect, useState } from 'react';
import { Alert, EmptyState, Field, PageLoader, Pagination, Spinner, StatusBadge } from '../../components/ui.jsx';
import { IconBag, IconSearch } from '../../components/Icons.jsx';
import { useAsync } from '../../hooks/useAsync.js';
import { useToast } from '../../context/ToastContext.jsx';
import { ordersApi } from '../../api/index.js';
import { getErrorMessage } from '../../api/http.js';
import { money, formatTimestamp, ORDER_STATUS_BADGE, PAYMENT_STATUS_BADGE, titleCase } from '../../utils/format.js';

const NEXT = {
  processing: ['shipped', 'delivered', 'cancelled'],
  shipped: ['delivered', 'processing'],
  delivered: ['shipped'],
  pending_payment: ['cancelled'],
  cancelled: [],
};

function OrderDetail({ order, onUpdated }) {
  const toast = useToast();
  const [form, setForm] = useState({ status: '', trackingNumber: order.trackingNumber || '', carrier: order.carrier || '', note: '', notifyCustomer: true });
  const [busy, setBusy] = useState(false);
  const a = order.shippingAddress;

  const save = async (e) => {
    e.preventDefault();
    if (form.status === 'cancelled' && !window.confirm('Cancel this order? Remember to issue a refund in your Stripe Dashboard if the customer was charged.')) return;
    setBusy(true);
    try {
      const body = { trackingNumber: form.trackingNumber, carrier: form.carrier, note: form.note, notifyCustomer: form.notifyCustomer };
      if (form.status) body.status = form.status;
      const r = await ordersApi.adminUpdate(order._id, body);
      onUpdated(r.order);
      setForm((f) => ({ ...f, status: '', note: '' }));
      toast.success('Order updated.');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="order-detail">
      <div>
        <h3 className="h-xs">Items</h3>
        <ul className="order-items">
          {order.items.map((i) => (
            <li key={i.product}>
              <img src={i.image} alt="" className="thumb" width="40" height="40" />
              <span>{i.name}</span>
              <span className="muted small">× {i.quantity}</span>
              <span className="order-amt">{money(i.priceCents * i.quantity)}</span>
            </li>
          ))}
        </ul>
        <dl className="totals small">
          <div><dt>Subtotal</dt><dd>{money(order.subtotalCents)}</dd></div>
          <div><dt>Shipping</dt><dd>{money(order.shippingCents)}</dd></div>
          <div><dt>Tax</dt><dd>{money(order.taxCents)}</dd></div>
          <div className="grand"><dt>Total</dt><dd>{money(order.totalCents)}</dd></div>
        </dl>
        {order.stockIssue && <Alert type="warning" title="Needs attention">{order.stockIssueDetail}</Alert>}
      </div>
      <div>
        <h3 className="h-xs">Customer</h3>
        <p className="small">
          {order.customer.firstName} {order.customer.lastName}<br />
          <a href={`mailto:${order.customer.email}`}>{order.customer.email}</a><br />
          {order.customer.phone}
        </p>
        <h3 className="h-xs">Ship to</h3>
        <p className="small">
          {a.line1}{a.line2 ? `, ${a.line2}` : ''}<br />{a.city}, {a.state} {a.postalCode}<br />{a.country}
        </p>
        {order.stripePaymentIntentId && (
          <p className="small muted">Stripe payment: <code>{order.stripePaymentIntentId}</code></p>
        )}
        <h3 className="h-xs">History</h3>
        <ul className="history small">
          {order.statusHistory?.map((h, i) => (
            <li key={i}><strong>{titleCase(h.status)}</strong> — {h.note} <span className="muted">({formatTimestamp(h.at, true)})</span></li>
          ))}
        </ul>
      </div>
      <form className="stack" onSubmit={save}>
        <h3 className="h-xs">Update fulfillment</h3>
        <Field label="Change status">
          {(p) => (
            <select {...p} className="select" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} disabled={!NEXT[order.status]?.length}>
              <option value="">Keep “{titleCase(order.status)}”</option>
              {(NEXT[order.status] || []).map((s) => <option key={s} value={s}>{titleCase(s)}</option>)}
            </select>
          )}
        </Field>
        <Field label="Carrier">{(p) => <input {...p} className="input" placeholder="UPS, USPS, FedEx…" value={form.carrier} onChange={(e) => setForm({ ...form, carrier: e.target.value })} />}</Field>
        <Field label="Tracking number">{(p) => <input {...p} className="input" value={form.trackingNumber} onChange={(e) => setForm({ ...form, trackingNumber: e.target.value })} />}</Field>
        <Field label="Internal note">{(p) => <input {...p} className="input" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />}</Field>
        <label className="checkbox"><input type="checkbox" checked={form.notifyCustomer} onChange={(e) => setForm({ ...form, notifyCustomer: e.target.checked })} /> Email the customer about status changes</label>
        <button className="btn btn-sm" type="submit" disabled={busy}>{busy ? <Spinner label="Saving" /> : 'Save update'}</button>
      </form>
    </div>
  );
}

export default function Orders() {
  const [status, setStatus] = useState('all');
  const [paymentStatus, setPaymentStatus] = useState('paid');
  const [q, setQ] = useState('');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(null);
  const list = useAsync(() => ordersApi.adminList({ status, paymentStatus, q: query || undefined, page }), [status, paymentStatus, query, page]);

  useEffect(() => {
    const t = setTimeout(() => { setQuery(q.trim()); setPage(1); }, 300);
    return () => clearTimeout(t);
  }, [q]);

  const replace = (o) => list.setData((d) => ({ ...d, orders: d.orders.map((x) => (x._id === o._id ? o : x)) }));

  return (
    <div className="admin-page">
      <div className="admin-head">
        <div>
          <h1>Orders</h1>
          <p className="muted">Orders are marked paid only after Stripe confirms payment via webhook.</p>
        </div>
      </div>
      <div className="admin-filters">
        <div className="search-box">
          <IconSearch size={18} />
          <label htmlFor="oq" className="sr-only">Search orders</label>
          <input id="oq" type="search" className="input" placeholder="Order #, name or email" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <label htmlFor="os" className="sr-only">Order status</label>
        <select id="os" className="select" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
          <option value="all">All statuses</option>
          {['processing', 'shipped', 'delivered', 'pending_payment', 'cancelled'].map((s) => <option key={s} value={s}>{titleCase(s)}</option>)}
        </select>
        <label htmlFor="op" className="sr-only">Payment status</label>
        <select id="op" className="select" value={paymentStatus} onChange={(e) => { setPaymentStatus(e.target.value); setPage(1); }}>
          <option value="all">Any payment</option>
          {['paid', 'unpaid', 'failed', 'expired', 'refunded'].map((s) => <option key={s} value={s}>{titleCase(s)}</option>)}
        </select>
      </div>
      {list.error && <Alert type="error" onRetry={list.reload}>{list.error}</Alert>}
      {list.loading && !list.data ? (
        <PageLoader />
      ) : list.data?.orders.length ? (
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Order</th><th>Customer</th><th>Payment</th><th>Status</th><th className="num">Total</th><th><span className="sr-only">Details</span></th></tr></thead>
            <tbody>
              {list.data.orders.map((o) => (
                <Fragment key={o._id}>
                  <tr>
                    <td><strong>{o.orderNumber}</strong>{o.stockIssue && <span className="badge badge-danger" style={{ marginLeft: 6 }}>!</span>}<br /><span className="small muted">{formatTimestamp(o.createdAt, true)}</span></td>
                    <td>{o.customer.firstName} {o.customer.lastName}<br /><span className="small muted">{o.customer.email}</span></td>
                    <td><StatusBadge map={PAYMENT_STATUS_BADGE} value={o.paymentStatus} /></td>
                    <td><StatusBadge map={ORDER_STATUS_BADGE} value={o.status} /></td>
                    <td className="num">{money(o.totalCents)}</td>
                    <td>
                      <button type="button" className="btn btn-ghost btn-sm" aria-expanded={open === o._id} onClick={() => setOpen(open === o._id ? null : o._id)}>
                        {open === o._id ? 'Close' : 'Manage'}
                      </button>
                    </td>
                  </tr>
                  {open === o._id && (
                    <tr className="detail-row">
                      <td colSpan={6}><OrderDetail order={o} onUpdated={replace} /></td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        !list.loading && <EmptyState icon={IconBag} title="No orders match">Try changing the filters.</EmptyState>
      )}
      <Pagination page={page} pages={list.data?.pages} onChange={setPage} />
    </div>
  );
}
