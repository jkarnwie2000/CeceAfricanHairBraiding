import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Alert, EmptyState, Field, Modal, PageLoader, Pagination, Spinner, StatusBadge } from '../../components/ui.jsx';
import { IconCalendar, IconSearch, IconTrash } from '../../components/Icons.jsx';
import { useAsync } from '../../hooks/useAsync.js';
import { useToast } from '../../context/ToastContext.jsx';
import { appointmentsApi } from '../../api/index.js';
import { getErrorMessage } from '../../api/http.js';
import { moneyShort, formatDateShort, formatDateLong, formatTimestamp, APPOINTMENT_STATUS_BADGE, titleCase } from '../../utils/format.js';

const FILTERS = ['upcoming', 'pending', 'confirmed', 'completed', 'cancelled', 'no_show', 'all'];

function RescheduleModal({ appt, onClose, onSaved }) {
  const [date, setDate] = useState(appt.date);
  const [time, setTime] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const slots = useAsync(() => (date ? appointmentsApi.availability(appt.service, date, appt.id) : Promise.resolve(null)), [date]);

  const save = async () => {
    setBusy(true);
    setError('');
    try {
      const r = await appointmentsApi.adminUpdate(appt.id, { date, startMinutes: time, notifyCustomer: true });
      onSaved(r.appointment);
    } catch (err) {
      setError(getErrorMessage(err));
      setBusy(false);
    }
  };

  return (
    <Modal
      title={`Reschedule ${appt.confirmationCode}`}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button type="button" className="btn" onClick={save} disabled={busy || time == null}>{busy ? <Spinner label="Saving" /> : 'Save new time'}</button>
        </>
      }
    >
      <div className="stack">
        <p className="muted small" style={{ margin: 0 }}>{appt.serviceName} for {appt.customer.name} · currently {formatDateLong(appt.date)}, {appt.timeLabel}</p>
        <Field label="New date">{(p) => <input {...p} type="date" className="input" value={date} onChange={(e) => { setDate(e.target.value); setTime(null); }} />}</Field>
        {slots.loading && <Spinner />}
        {slots.error && <Alert type="error">{slots.error}</Alert>}
        {slots.data?.reason && <Alert type="info">{slots.data.reason}</Alert>}
        {slots.data && !slots.data.reason && (
          <Field label="Start time">
            {(p) => (
              <select {...p} className="select" value={time ?? ''} onChange={(e) => setTime(e.target.value === '' ? null : Number(e.target.value))}>
                <option value="">Select a time…</option>
                {slots.data.slots.map((s) => (
                  <option key={s.startMinutes} value={s.startMinutes} disabled={!s.available}>{s.label}{s.available ? '' : ' (full)'}</option>
                ))}
              </select>
            )}
          </Field>
        )}
        {error && <Alert type="error">{error}</Alert>}
        <p className="small muted" style={{ margin: 0 }}>The client will be emailed the new time.</p>
      </div>
    </Modal>
  );
}

function BlockedDates() {
  const toast = useToast();
  const { data, loading, reload } = useAsync(() => appointmentsApi.blockedDates(), []);
  const [form, setForm] = useState({ date: '', reason: '' });
  const add = async (e) => {
    e.preventDefault();
    try {
      const r = await appointmentsApi.addBlockedDate(form);
      toast.success(r.affectedAppointments ? `Date closed. Note: ${r.affectedAppointments} existing appointment(s) on this day need to be rescheduled.` : 'Date closed for booking.');
      setForm({ date: '', reason: '' });
      reload();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };
  const remove = async (id) => {
    await appointmentsApi.removeBlockedDate(id);
    reload();
  };
  return (
    <section className="panel" aria-labelledby="closed-title">
      <h2 id="closed-title" className="h-sm">Closed dates &amp; holidays</h2>
      <p className="small muted">Block days off so customers can&apos;t book them.</p>
      <form className="row" onSubmit={add} style={{ alignItems: 'flex-end' }}>
        <Field label="Date">{(p) => <input {...p} type="date" className="input" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />}</Field>
        <Field label="Reason">{(p) => <input {...p} className="input" placeholder="Holiday" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />}</Field>
        <button className="btn btn-sm" type="submit">Close date</button>
      </form>
      {loading ? <Spinner /> : (
        <ul className="mini-list" style={{ marginTop: 12 }}>
          {data?.blockedDates.length ? data.blockedDates.map((b) => (
            <li key={b._id}>
              <span><strong>{formatDateShort(b.date)}</strong> <span className="muted small">{b.reason}</span></span>
              <button type="button" className="icon-btn" onClick={() => remove(b._id)} aria-label={`Reopen ${b.date}`}><IconTrash size={16} /></button>
            </li>
          )) : <li className="muted small">No closed dates.</li>}
        </ul>
      )}
    </section>
  );
}

export default function Appointments() {
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const status = FILTERS.includes(params.get('status')) ? params.get('status') : 'upcoming';
  const [q, setQ] = useState('');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [busyId, setBusyId] = useState(null);
  const [rescheduling, setRescheduling] = useState(null);
  const [notes, setNotes] = useState({});
  const list = useAsync(() => appointmentsApi.adminList({ status, q: query || undefined, page }), [status, query, page]);

  useEffect(() => {
    const t = setTimeout(() => { setQuery(q.trim()); setPage(1); }, 300);
    return () => clearTimeout(t);
  }, [q]);

  const replace = (a) => list.setData((d) => ({ ...d, appointments: d.appointments.map((x) => (x.id === a.id ? { ...x, ...a } : x)) }));

  const update = async (a, body, msg) => {
    setBusyId(a.id);
    try {
      const r = await appointmentsApi.adminUpdate(a.id, body);
      replace(r.appointment);
      toast.success(msg);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-head">
        <div>
          <h1>Appointments</h1>
          <p className="muted">{list.data?.pendingCount ? `${list.data.pendingCount} request(s) awaiting approval.` : 'Approve, reschedule and track salon bookings.'}</p>
        </div>
      </div>

      <div className="tabs" role="tablist" aria-label="Appointment filter">
        {FILTERS.map((f) => (
          <button key={f} type="button" role="tab" aria-selected={status === f} onClick={() => { setParams({ status: f }); setPage(1); }}>
            {titleCase(f)}
          </button>
        ))}
      </div>
      <div className="admin-filters">
        <div className="search-box">
          <IconSearch size={18} />
          <label htmlFor="aq" className="sr-only">Search appointments</label>
          <input id="aq" type="search" className="input" placeholder="Name, email, phone or confirmation #" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </div>

      {list.error && <Alert type="error" onRetry={list.reload}>{list.error}</Alert>}
      {list.loading && !list.data ? (
        <PageLoader />
      ) : list.data?.appointments.length ? (
        <ul className="admin-appt-list">
          {list.data.appointments.map((a) => (
            <li key={a.id} className="panel admin-appt">
              <div className="admin-appt-main">
                <div className="appt-date" aria-hidden="true">
                  <span>{formatDateShort(a.date).split(',')[0]}</span>
                  <strong>{a.date.slice(8)}</strong>
                </div>
                <div>
                  <div className="row" style={{ gap: 8 }}>
                    <h3 style={{ margin: 0 }}>{a.customer.name}</h3>
                    <StatusBadge map={APPOINTMENT_STATUS_BADGE} value={a.status} />
                  </div>
                  <p className="small" style={{ margin: '4px 0' }}>
                    <strong>{a.serviceName}</strong> · {formatDateShort(a.date)} · {a.timeLabel} · from {moneyShort(a.priceCents)}
                  </p>
                  <p className="small muted" style={{ margin: 0 }}>
                    <a href={`mailto:${a.customer.email}`}>{a.customer.email}</a> · <a href={`tel:${a.customer.phone}`}>{a.customer.phone}</a> · #{a.confirmationCode} · booked {formatTimestamp(a.createdAt)}
                  </p>
                  {a.notes && <p className="small appt-notes">“{a.notes}”</p>}
                </div>
              </div>
              <div className="admin-appt-actions">
                {busyId === a.id && <Spinner label="Updating" />}
                {a.status === 'pending' && <button type="button" className="btn btn-sm" disabled={busyId === a.id} onClick={() => update(a, { status: 'confirmed' }, 'Appointment confirmed — client notified.')}>Approve</button>}
                {['pending', 'confirmed'].includes(a.status) && (
                  <>
                    <button type="button" className="btn btn-outline btn-sm" disabled={busyId === a.id} onClick={() => setRescheduling(a)}>Reschedule</button>
                    {a.status === 'confirmed' && <button type="button" className="btn btn-outline btn-sm" disabled={busyId === a.id} onClick={() => update(a, { status: 'completed', notifyCustomer: false }, 'Marked completed.')}>Complete</button>}
                    {a.status === 'confirmed' && <button type="button" className="btn btn-ghost btn-sm" disabled={busyId === a.id} onClick={() => update(a, { status: 'no_show', notifyCustomer: false }, 'Marked no-show.')}>No-show</button>}
                    <button type="button" className="btn btn-ghost btn-sm" disabled={busyId === a.id} onClick={() => window.confirm(`Cancel ${a.customer.name}'s appointment? They will be emailed.`) && update(a, { status: 'cancelled' }, 'Appointment cancelled — client notified.')}>Cancel</button>
                  </>
                )}
                <details className="appt-admin-notes">
                  <summary className="small">Notes{a.adminNotes ? ' •' : ''}</summary>
                  <textarea
                    className="textarea"
                    aria-label="Private admin notes"
                    defaultValue={a.adminNotes}
                    onChange={(e) => setNotes({ ...notes, [a.id]: e.target.value })}
                  />
                  <button type="button" className="btn btn-sm btn-outline" onClick={() => update(a, { adminNotes: notes[a.id] ?? a.adminNotes, notifyCustomer: false }, 'Notes saved.')}>Save notes</button>
                </details>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        !list.loading && <EmptyState icon={IconCalendar} title="No appointments here">Nothing matches this filter.</EmptyState>
      )}
      <Pagination page={page} pages={list.data?.pages} onChange={setPage} />

      <BlockedDates />

      {rescheduling && (
        <RescheduleModal
          appt={rescheduling}
          onClose={() => setRescheduling(null)}
          onSaved={(a) => {
            replace(a);
            setRescheduling(null);
            toast.success('Appointment rescheduled — client notified.');
          }}
        />
      )}
    </div>
  );
}
