import { useCallback, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { BUSINESS } from '@shared/business.js';
import Seo from '../components/Seo.jsx';
import DateTimePicker from '../components/booking/DateTimePicker.jsx';
import { Alert, EmptyState, Field, PageLoader, Spinner, StatusBadge } from '../components/ui.jsx';
import { IconCalendar } from '../components/Icons.jsx';
import { useAsync } from '../hooks/useAsync.js';
import { useToast } from '../context/ToastContext.jsx';
import { appointmentsApi } from '../api/index.js';
import { getErrorMessage } from '../api/http.js';
import { moneyShort, formatDuration, APPOINTMENT_STATUS_BADGE } from '../utils/format.js';

export default function ManageAppointment() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const token = params.get('token') || undefined;
  const toast = useToast();
  const { data, loading, error, setData } = useAsync(() => appointmentsApi.get(id, token), [id, token]);
  const [mode, setMode] = useState(null); // 'cancel' | 'reschedule'
  const [reason, setReason] = useState('');
  const [date, setDate] = useState(null);
  const [time, setTime] = useState(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState('');
  const onTime = useCallback((t) => setTime(t), []);

  if (loading) return <PageLoader label="Loading your appointment…" />;
  if (error)
    return (
      <section className="section">
        <EmptyState icon={IconCalendar} title="We couldn't open this appointment" action={<Link to="/login" className="btn">Log in to your account</Link>}>
          {error}
        </EmptyState>
      </section>
    );

  const a = data.appointment;

  const doCancel = async () => {
    setBusy(true);
    setActionError('');
    try {
      const r = await appointmentsApi.cancel(id, { token, reason });
      setData({ appointment: r.appointment });
      setMode(null);
      toast.success('Your appointment has been cancelled.');
    } catch (err) {
      setActionError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const doReschedule = async () => {
    setBusy(true);
    setActionError('');
    try {
      const r = await appointmentsApi.reschedule(id, { token, date, startMinutes: time });
      setData({ appointment: r.appointment });
      setMode(null);
      setDate(null);
      setTime(null);
      toast.success('Your appointment has been rescheduled. We will re-confirm it shortly.');
    } catch (err) {
      setActionError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Seo title="Manage Appointment" noindex />
      <header className="page-header">
        <div className="container">
          <span className="eyebrow">Confirmation #{a.confirmationCode}</span>
          <h1>Your appointment</h1>
        </div>
      </header>
      <section className="section-sm">
        <div className="container container-narrow">
          <div className="panel">
            <div className="row-between">
              <h2 style={{ margin: 0 }}>{a.serviceName}</h2>
              <StatusBadge map={APPOINTMENT_STATUS_BADGE} value={a.status} />
            </div>
            <dl className="summary-list">
              <div><dt>Date</dt><dd>{a.dateLabel}</dd></div>
              <div><dt>Time</dt><dd>{a.timeLabel}</dd></div>
              <div><dt>Duration</dt><dd>{formatDuration(a.durationMinutes)}</dd></div>
              <div><dt>Starting price</dt><dd>{moneyShort(a.priceCents)}</dd></div>
              <div><dt>Name</dt><dd>{a.customer.name}</dd></div>
              {a.notes && <div><dt>Notes</dt><dd>{a.notes}</dd></div>}
            </dl>

            {['pending', 'confirmed'].includes(a.status) && !a.canCancel && (
              <Alert type="info">
                This appointment is less than {a.cancellationWindowHours} hours away, so it can no longer be changed online. Please call us at{' '}
                <a href={`tel:${BUSINESS.phoneHref}`}>{BUSINESS.phone}</a>.
              </Alert>
            )}

            {a.canCancel && !mode && (
              <div className="row" style={{ marginTop: 20 }}>
                <button type="button" className="btn" onClick={() => setMode('reschedule')}>
                  Reschedule
                </button>
                <button type="button" className="btn btn-outline" onClick={() => setMode('cancel')}>
                  Cancel appointment
                </button>
              </div>
            )}

            {mode === 'cancel' && (
              <div className="stack" style={{ marginTop: 24 }}>
                <h3>Cancel this appointment?</h3>
                <Field label="Reason (optional)">
                  {(p) => <textarea {...p} className="textarea" maxLength={300} value={reason} onChange={(e) => setReason(e.target.value)} />}
                </Field>
                {actionError && <Alert type="error">{actionError}</Alert>}
                <div className="row">
                  <button type="button" className="btn btn-danger" onClick={doCancel} disabled={busy}>
                    {busy ? <Spinner label="Cancelling" /> : 'Yes, cancel appointment'}
                  </button>
                  <button type="button" className="btn btn-ghost" onClick={() => setMode(null)} disabled={busy}>
                    Keep appointment
                  </button>
                </div>
              </div>
            )}

            {mode === 'reschedule' && (
              <div className="stack" style={{ marginTop: 24 }}>
                <h3>Choose a new date &amp; time</h3>
                <DateTimePicker serviceId={a.service} date={date} time={time} onDate={setDate} onTime={onTime} excludeId={a.id} />
                {actionError && <Alert type="error">{actionError}</Alert>}
                <div className="row">
                  <button type="button" className="btn" onClick={doReschedule} disabled={busy || !date || time == null}>
                    {busy ? <Spinner label="Saving" /> : 'Confirm new time'}
                  </button>
                  <button type="button" className="btn btn-ghost" onClick={() => setMode(null)} disabled={busy}>
                    Never mind
                  </button>
                </div>
              </div>
            )}
          </div>
          <p className="text-center" style={{ marginTop: 24 }}>
            <Link to="/book">Book another appointment</Link>
          </p>
        </div>
      </section>
    </>
  );
}
