import { Alert, Spinner } from '../ui.jsx';

export default function TimeSlots({ loading, error, slots, value, onChange, reason, onRetry }) {
  if (loading)
    return (
      <div className="row muted" style={{ padding: '12px 0' }}>
        <Spinner label="Loading times" /> Loading available times…
      </div>
    );
  if (error) return <Alert type="error" onRetry={onRetry}>{error}</Alert>;
  if (reason) return <Alert type="info">{reason}</Alert>;
  const open = slots.filter((s) => s.available);
  if (!open.length) return <Alert type="info">This day is fully booked. Please choose another date.</Alert>;

  const groups = [
    ['Morning', slots.filter((s) => s.startMinutes < 720)],
    ['Afternoon', slots.filter((s) => s.startMinutes >= 720 && s.startMinutes < 1020)],
    ['Evening', slots.filter((s) => s.startMinutes >= 1020)],
  ].filter(([, list]) => list.length);

  return (
    <div className="slot-groups">
      {groups.map(([label, list]) => (
        <fieldset key={label} className="slot-group">
          <legend>{label}</legend>
          <div className="slots">
            {list.map((s) => (
              <button
                type="button"
                key={s.startMinutes}
                className={`slot${value === s.startMinutes ? ' selected' : ''}`}
                disabled={!s.available}
                aria-pressed={value === s.startMinutes}
                aria-label={s.available ? `${s.label}` : `${s.label}, booked`}
                onClick={() => onChange(s.startMinutes)}
              >
                {s.label}
              </button>
            ))}
          </div>
        </fieldset>
      ))}
    </div>
  );
}
