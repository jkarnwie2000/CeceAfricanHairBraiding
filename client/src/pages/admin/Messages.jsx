import { useState } from 'react';
import { Alert, EmptyState, PageLoader, Pagination } from '../../components/ui.jsx';
import { IconChat } from '../../components/Icons.jsx';
import { useAsync } from '../../hooks/useAsync.js';
import { adminApi } from '../../api/index.js';
import { formatTimestamp } from '../../utils/format.js';

export default function Messages() {
  const [page, setPage] = useState(1);
  const [tab, setTab] = useState('messages');
  const list = useAsync(() => adminApi.messages({ page }), [page]);
  const subs = useAsync(() => (tab === 'subscribers' ? adminApi.subscribers() : Promise.resolve(null)), [tab]);

  const mark = async (m, isRead) => {
    await adminApi.markMessage(m._id, isRead);
    list.setData((d) => ({ ...d, messages: d.messages.map((x) => (x._id === m._id ? { ...x, isRead } : x)) }));
  };

  const exportCsv = () => {
    const rows = ['email,subscribed_at', ...subs.data.subscribers.map((s) => `${s.email},${s.createdAt}`)];
    const url = URL.createObjectURL(new Blob([rows.join('\n')], { type: 'text/csv' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'newsletter-subscribers.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="admin-page">
      <div className="admin-head">
        <div>
          <h1>Inbox</h1>
          <p className="muted">Contact-form messages and newsletter subscribers.</p>
        </div>
      </div>
      <div className="tabs" role="tablist">
        <button type="button" role="tab" aria-selected={tab === 'messages'} onClick={() => setTab('messages')}>Messages</button>
        <button type="button" role="tab" aria-selected={tab === 'subscribers'} onClick={() => setTab('subscribers')}>Newsletter subscribers</button>
      </div>

      {tab === 'messages' && (
        <>
          {list.error && <Alert type="error" onRetry={list.reload}>{list.error}</Alert>}
          {list.loading && !list.data ? (
            <PageLoader />
          ) : list.data?.messages.length ? (
            <ul className="stack" style={{ listStyle: 'none', padding: 0 }}>
              {list.data.messages.map((m) => (
                <li key={m._id} className={`panel message${m.isRead ? '' : ' unread'}`}>
                  <div className="row-between">
                    <div>
                      <strong>{m.subject || '(no subject)'}</strong>{!m.isRead && <span className="badge badge-gold" style={{ marginLeft: 8 }}>New</span>}
                      <div className="small muted">
                        {m.name} · <a href={`mailto:${m.email}?subject=${encodeURIComponent(`Re: ${m.subject || 'Your message'}`)}`}>{m.email}</a>{m.phone ? ` · ${m.phone}` : ''}
                      </div>
                    </div>
                    <span className="small muted">{formatTimestamp(m.createdAt, true)}</span>
                  </div>
                  <p style={{ whiteSpace: 'pre-wrap', margin: '12px 0' }}>{m.message}</p>
                  <div className="row">
                    <a className="btn btn-sm" href={`mailto:${m.email}?subject=${encodeURIComponent(`Re: ${m.subject || 'Your message'}`)}`} onClick={() => !m.isRead && mark(m, true)}>Reply by email</a>
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => mark(m, !m.isRead)}>{m.isRead ? 'Mark unread' : 'Mark read'}</button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            !list.loading && <EmptyState icon={IconChat} title="No messages yet" />
          )}
          <Pagination page={page} pages={list.data?.pages} onChange={setPage} />
        </>
      )}

      {tab === 'subscribers' &&
        (subs.loading ? (
          <PageLoader />
        ) : subs.error ? (
          <Alert type="error">{subs.error}</Alert>
        ) : (
          <div className="panel">
            <div className="row-between">
              <h2 className="h-sm" style={{ margin: 0 }}>{subs.data?.subscribers.length || 0} subscribers</h2>
              {subs.data?.subscribers.length > 0 && <button type="button" className="btn btn-outline btn-sm" onClick={exportCsv}>Export CSV</button>}
            </div>
            <ul className="mini-list" style={{ marginTop: 12 }}>
              {subs.data?.subscribers.map((s) => (
                <li key={s._id}><span>{s.email}</span><span className="small muted">{formatTimestamp(s.createdAt)}</span></li>
              ))}
            </ul>
          </div>
        ))}
    </div>
  );
}
