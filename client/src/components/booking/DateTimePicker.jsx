import { useEffect, useMemo } from 'react';
import Calendar from './Calendar.jsx';
import TimeSlots from './TimeSlots.jsx';
import { Alert, Spinner } from '../ui.jsx';
import { useAsync } from '../../hooks/useAsync.js';
import { appointmentsApi } from '../../api/index.js';
import { formatDateLong } from '../../utils/format.js';

/**
 * Loads available dates for a service, then available times for the chosen date.
 * `excludeId` lets an existing appointment's own slot count as free when rescheduling.
 */
export default function DateTimePicker({ serviceId, date, time, onDate, onTime, excludeId, refreshKey = 0 }) {
  const dates = useAsync(() => appointmentsApi.availableDates(serviceId), [serviceId, refreshKey]);
  const slots = useAsync(() => (date ? appointmentsApi.availability(serviceId, date, excludeId) : Promise.resolve(null)), [serviceId, date, excludeId, refreshKey]);

  const available = useMemo(() => new Map((dates.data?.dates || []).map((d) => [d.date, d.openSlots])), [dates.data]);

  // If the chosen time is no longer offered (e.g. someone just booked it), clear it.
  useEffect(() => {
    if (time == null || !slots.data) return;
    const s = slots.data.slots.find((x) => x.startMinutes === time);
    if (!s || !s.available) onTime(null);
  }, [slots.data, time, onTime]);

  if (dates.loading)
    return (
      <div className="row muted">
        <Spinner /> Checking availability…
      </div>
    );
  if (dates.error) return <Alert type="error" onRetry={dates.reload}>{dates.error}</Alert>;
  if (!available.size)
    return <Alert type="info">There are no open appointments for this service in the next few weeks. Please call us — we may be able to fit you in.</Alert>;

  return (
    <div className="datetime-picker">
      <Calendar
        key={serviceId}
        available={available}
        value={date}
        onChange={(d) => {
          onDate(d);
          onTime(null);
        }}
        minDate={dates.data.today}
        maxDate={dates.data.lastDate}
      />
      <div className="time-panel">
        <h3 className="time-title">{date ? formatDateLong(date) : 'Select a date'}</h3>
        {date ? (
          <TimeSlots
            loading={slots.loading}
            error={slots.error}
            slots={slots.data?.slots || []}
            reason={slots.data?.reason}
            value={time}
            onChange={onTime}
            onRetry={slots.reload}
          />
        ) : (
          <p className="muted">Highlighted dates have open appointments. Pick one to see available start times.</p>
        )}
      </div>
    </div>
  );
}
