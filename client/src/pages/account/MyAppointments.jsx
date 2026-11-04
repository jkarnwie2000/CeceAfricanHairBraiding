import { Link } from 'react-router-dom';
import { Alert, EmptyState, PageLoader, StatusBadge } from '../../components/ui.jsx';
import { IconCalendar } from '../../components/Icons.jsx';
import { useAsync } from '../../hooks/useAsync.js';
import { appointmentsApi } from '../../api/index.js';
import { moneyShort, APPOINTMENT_STATUS_BADGE } from '../../utils/format.js';

function AppointmentRow({ a }) {
  return (
    <li className="panel appt-row">
      <div className="appt-date" aria-hidden="true">
        <span>{a.dateLabel.split(',')[1]?.trim().slice(0, 3)}</span>
        <strong>{a.date.slice(8)}</strong>
      </div>
      <div className="appt-info">
        <h3>{a.serviceName}</h3>
        <span className="muted small">
          {a.dateLabel} · {a.timeLabel} · from {moneyShort(a.priceCents)}
        </span>
        <span className="small muted">#{a.confirmationCode}</span>
      </div>
      <div className="appt-actions">
        <StatusBadge map={APPOINTMENT_STATUS_BADGE} value={a.status} />
        {a.canCancel && (
          <Link to={`/appointments/${a.id}`} className="btn btn-outline btn-sm">
            Manage
          </Link>
        )}
      </div>
    </li>
  );
}

export default function MyAppointments() {
  const { data, loading, error, reload } = useAsync(() => appointmentsApi.mine(), []);
  if (loading) return <PageLoader label="Loading appointments…" />;
  if (error) return <Alert type="error" onRetry={reload}>{error}</Alert>;

  return (
    <div className="stack">
      <div className="row-between">
        <h2 className="h-sm" style={{ margin: 0 }}>Upcoming appointments</h2>
        <Link to="/book" className="btn btn-sm">Book new</Link>
      </div>
      {data.upcoming.length ? (
        <ul className="appt-list">{data.upcoming.map((a) => <AppointmentRow key={a.id} a={a} />)}</ul>
      ) : (
        <EmptyState icon={IconCalendar} title="No upcoming appointments" action={<Link to="/book" className="btn">Book an appointment</Link>}>
          Ready for your next look?
        </EmptyState>
      )}
      {data.past.length > 0 && (
        <>
          <h2 className="h-sm" style={{ marginTop: 32 }}>Past &amp; cancelled</h2>
          <ul className="appt-list">{data.past.map((a) => <AppointmentRow key={a.id} a={a} />)}</ul>
        </>
      )}
    </div>
  );
}
