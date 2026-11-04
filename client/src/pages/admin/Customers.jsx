import { useEffect, useState } from 'react';
import { Alert, EmptyState, PageLoader, Pagination } from '../../components/ui.jsx';
import { IconUsers, IconSearch } from '../../components/Icons.jsx';
import { useAsync } from '../../hooks/useAsync.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { adminApi } from '../../api/index.js';
import { getErrorMessage } from '../../api/http.js';
import { money, formatTimestamp } from '../../utils/format.js';

export default function Customers() {
  const { user } = useAuth();
  const toast = useToast();
  const [q, setQ] = useState('');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const list = useAsync(() => adminApi.customers({ q: query || undefined, page }), [query, page]);

  useEffect(() => {
    const t = setTimeout(() => { setQuery(q.trim()); setPage(1); }, 300);
    return () => clearTimeout(t);
  }, [q]);

  const toggleRole = async (c) => {
    const role = c.role === 'admin' ? 'customer' : 'admin';
    if (!window.confirm(role === 'admin' ? `Give ${c.name} full admin access?` : `Remove admin access from ${c.name}?`)) return;
    try {
      await adminApi.setRole(c.id, role);
      toast.success('Role updated.');
      list.reload();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-head">
        <div>
          <h1>Customers</h1>
          <p className="muted">{list.data ? `${list.data.total} registered accounts` : 'Registered customer accounts.'}</p>
        </div>
      </div>
      <div className="admin-filters">
        <div className="search-box">
          <IconSearch size={18} />
          <label htmlFor="cq" className="sr-only">Search customers</label>
          <input id="cq" type="search" className="input" placeholder="Name, email or phone" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </div>
      {list.error && <Alert type="error" onRetry={list.reload}>{list.error}</Alert>}
      {list.loading && !list.data ? (
        <PageLoader />
      ) : list.data?.customers.length ? (
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Customer</th><th>Phone</th><th className="num">Orders</th><th className="num">Spent</th><th className="num">Bookings</th><th>Joined</th><th>Role</th></tr></thead>
            <tbody>
              {list.data.customers.map((c) => (
                <tr key={c.id}>
                  <td><strong>{c.name}</strong><br /><a className="small" href={`mailto:${c.email}`}>{c.email}</a></td>
                  <td className="small">{c.phone || '—'}</td>
                  <td className="num">{c.orders}</td>
                  <td className="num">{money(c.spentCents)}</td>
                  <td className="num">{c.appointments}</td>
                  <td className="small">{formatTimestamp(c.createdAt)}</td>
                  <td>
                    <span className={`badge ${c.role === 'admin' ? 'badge-dark' : ''}`}>{c.role}</span>{' '}
                    {String(c.id) !== user.id && (
                      <button type="button" className="link-btn small" onClick={() => toggleRole(c)}>
                        {c.role === 'admin' ? 'Revoke' : 'Make admin'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        !list.loading && <EmptyState icon={IconUsers} title="No customers found" />
      )}
      <Pagination page={page} pages={list.data?.pages} onChange={setPage} />
    </div>
  );
}
