import { useMemo, useState } from 'react';

const WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const pad = (n) => String(n).padStart(2, '0');
const ymd = (y, m, d) => `${y}-${pad(m + 1)}-${pad(d)}`;
const monthLabel = (y, m) => new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(Date.UTC(y, m, 1)));

/**
 * Month-grid date picker. Only dates in `available` (Map date → openSlots) are selectable.
 */
export default function Calendar({ available, value, onChange, minDate, maxDate }) {
  const start = value || minDate;
  const [view, setView] = useState(() => {
    const [y, m] = start.split('-').map(Number);
    return { y, m: m - 1 };
  });

  const cells = useMemo(() => {
    const first = new Date(Date.UTC(view.y, view.m, 1)).getUTCDay();
    const days = new Date(Date.UTC(view.y, view.m + 1, 0)).getUTCDate();
    const out = Array.from({ length: first }, () => null);
    for (let d = 1; d <= days; d++) out.push(ymd(view.y, view.m, d));
    return out;
  }, [view]);

  const move = (delta) =>
    setView((v) => {
      const m = v.m + delta;
      return { y: v.y + Math.floor(m / 12), m: ((m % 12) + 12) % 12 };
    });

  const minMonth = minDate.slice(0, 7);
  const maxMonth = maxDate.slice(0, 7);
  const thisMonth = `${view.y}-${pad(view.m + 1)}`;

  return (
    <div className="calendar">
      <div className="calendar-head">
        <button type="button" className="icon-btn" onClick={() => move(-1)} disabled={thisMonth <= minMonth} aria-label="Previous month">
          ‹
        </button>
        <h3 aria-live="polite">{monthLabel(view.y, view.m)}</h3>
        <button type="button" className="icon-btn" onClick={() => move(1)} disabled={thisMonth >= maxMonth} aria-label="Next month">
          ›
        </button>
      </div>
      <div className="calendar-grid" role="grid" aria-label="Choose a date">
        {WEEK.map((w) => (
          <div key={w} className="calendar-dow" role="columnheader" aria-label={w}>
            {w.slice(0, 2)}
          </div>
        ))}
        {cells.map((date, i) => {
          if (!date) return <div key={`e${i}`} aria-hidden="true" />;
          const open = available.get(date);
          const selected = date === value;
          const label = new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric', timeZone: 'UTC' }).format(
            new Date(`${date}T00:00:00Z`)
          );
          return (
            <button
              type="button"
              key={date}
              role="gridcell"
              className={`calendar-day${open ? ' available' : ''}${selected ? ' selected' : ''}`}
              disabled={!open}
              aria-pressed={selected}
              aria-label={open ? `${label}, ${open} times available` : `${label}, unavailable`}
              onClick={() => onChange(date)}
            >
              {Number(date.slice(8))}
            </button>
          );
        })}
      </div>
      <div className="calendar-legend small muted">
        <span>
          <i className="dot available" /> Available
        </span>
        <span>
          <i className="dot" /> Unavailable
        </span>
      </div>
    </div>
  );
}
