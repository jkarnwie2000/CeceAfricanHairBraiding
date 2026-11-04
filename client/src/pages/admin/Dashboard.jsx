import { Link } from 'react-router-dom';
import SalesChart from '../../components/admin/SalesChart.jsx';
import { Alert, PageLoader, StatusBadge } from '../../components/ui.jsx';
import { useAsync } from '../../hooks/useAsync.js';
import { adminApi } from '../../api/index.js';
import { money, formatTimestamp, formatDateShort, ORDER_STATUS_BADGE, APPOINTMENT_STATUS_BADGE } from '../../utils/format.js';

function Stat({ label, value, sub, to }) {
  const body = (
    <>
      <span className="stat-label">{label}</span>
      <span className="stat-value">{value}</span>
      {sub && <span className="stat-sub">{sub}</span>}
    </>
  );
  return to ? (
    <Link to={to} className="stat card">
      {body}
    </Link>
  ) : (
    <div className="stat card">{body}</div>
  );
}

export default function Dashboard() {
  const { data: s, loading, error, reload } = useAsync(() => adminApi.stats(), []);
  if (loading) return <PageLoader label="Loading dashboard…" />;
  if (error) return <Alert type="error" onRetry={reload}>{error}</Alert>;

  const statusOrder = ['processing', 'shipped', 'delivered', 'pending_payment', 'cancelled'];

  return (
    <div className="admin-page">
      <div className="admin-head">
        <div>
          <h1>Dashboard</h1>
          <p className="muted">Sales, orders and appointments at a glance.</p>
        </div>
        <button type="button" className="btn btn-outline btn-sm" onClick={reload}>Refresh</button>
      </div>

      <div className="stats-grid">
        <Stat label="Total sales" value={money(s.revenueCents)} sub={`${s.paidOrders} paid orders`} to="/admin/orders" />
        <Stat label="Last 30 days" value={money(s.revenueLast30Cents)} sub={`This month: ${money(s.revenueThisMonthCents)}`} />
        <Stat label="Average order" value={money(s.averageOrderCents)} />
        <Stat label="Pending bookings" value={s.pendingAppointments} sub="Awaiting your approval" to="/admin/appointments?status=pending" />
        <Stat label="Customers" value={s.customers} sub={`${s.newCustomers} new in 30 days`} to="/admin/customers" />
        <Stat label="Reviews" value={s.reviews.count} sub={s.reviews.count ? `Avg ${s.reviews.average} ★` : 'No reviews yet'} to="/admin/reviews" />
      </div>

      <section className="panel" aria-labelledby="sales-title">
        <div className="row-between">
          <h2 id="sales-title" className="h-sm" style={{ margin: 0 }}>Daily revenue · last 30 days</h2>
          <span className="small muted">Paid orders, incl. tax &amp; shipping</span>
        </div>
        <SalesChart series={s.salesSeries} />
      </section>

      <div className="admin-two-col">
        <section className="panel" aria-labelledby="recent-title">
          <div className="row-between">
            <h2 id="recent-title" className="h-sm">Recent orders</h2>
            <Link to="/admin/orders" className="small">View all</Link>
          </div>
          {s.recentOrders.length ? (
            <div className="table-wrap">
              <table className="table">
                <thead><tr><th>Order</th><th>Customer</th><th>Status</th><th className="num">Total</th></tr></thead>
                <tbody>
                  {s.recentOrders.map((o) => (
                    <tr key={o._id}>
                      <td><strong>{o.orderNumber}</strong><br /><span className="small muted">{formatTimestamp(o.createdAt)}</span></td>
                      <td>{o.customer.firstName} {o.customer.lastName}</td>
                      <td><StatusBadge map={ORDER_STATUS_BADGE} value={o.status} /></td>
                      <td className="num">{money(o.totalCents)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="muted">No orders yet.</p>
          )}
          <div className="status-counts">
            {statusOrder.map((k) => (
              <span key={k}>
                <StatusBadge map={ORDER_STATUS_BADGE} value={k} /> {s.ordersByStatus[k] || 0}
              </span>
            ))}
          </div>
        </section>

        <section className="panel" aria-labelledby="upcoming-title">
          <div className="row-between">
            <h2 id="upcoming-title" className="h-sm">Upcoming appointments</h2>
            <Link to="/admin/appointments" className="small">Manage</Link>
          </div>
          {s.upcomingAppointments.length ? (
            <ul className="mini-list">
              {s.upcomingAppointments.map((a) => (
                <li key={a._id}>
                  <div>
                    <strong>{a.customer.name}</strong>
                    <span className="small muted">{a.serviceName}</span>
                  </div>
                  <div className="text-right">
                    <span className="small">{formatDateShort(a.date)} · {a.timeLabel}</span>
                    <StatusBadge map={APPOINTMENT_STATUS_BADGE} value={a.status} />
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted">No upcoming appointments.</p>
          )}
        </section>
      </div>

      <div className="admin-two-col">
        <section className="panel" aria-labelledby="low-title">
          <h2 id="low-title" className="h-sm">Low stock</h2>
          {s.lowStock.length ? (
            <ul className="mini-list">
              {s.lowStock.map((p) => (
                <li key={p._id}>
                  <div className="row" style={{ flexWrap: 'nowrap' }}>
                    <img src={p.images?.[0]} alt="" className="thumb" width="40" height="40" />
                    <span>{p.name}</span>
                  </div>
                  <span className={`badge ${p.inventory === 0 ? 'badge-danger' : 'badge-warning'}`}>{p.inventory === 0 ? 'Out of stock' : `${p.inventory} left`}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted">All products are well stocked.</p>
          )}
          <Link to="/admin/products" className="small">Update inventory →</Link>
        </section>
        <section className="panel" aria-labelledby="top-title">
          <h2 id="top-title" className="h-sm">Best sellers</h2>
          <ul className="mini-list">
            {s.topProducts.map((p) => (
              <li key={p._id}>
                <div className="row" style={{ flexWrap: 'nowrap' }}>
                  <img src={p.images?.[0]} alt="" className="thumb" width="40" height="40" />
                  <span>{p.name}</span>
                </div>
                <span className="small muted">{p.soldCount} sold</span>
              </li>
            ))}
          </ul>
          <p className="small muted" style={{ marginBottom: 0 }}>
            {s.unreadMessages} unread message{s.unreadMessages === 1 ? '' : 's'} · {s.subscribers} newsletter subscriber{s.subscribers === 1 ? '' : 's'} ·{' '}
            <Link to="/admin/messages">Inbox</Link>
          </p>
        </section>
      </div>
    </div>
  );
}
