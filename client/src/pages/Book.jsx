import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { BOOKING_POLICY, BUSINESS } from '@shared/business.js';
import Seo from '../components/Seo.jsx';
import DateTimePicker from '../components/booking/DateTimePicker.jsx';
import { Alert, Field, PageLoader, Spinner } from '../components/ui.jsx';
import { IconCheckCircle, IconClock, IconTag, IconCalendar } from '../components/Icons.jsx';
import { useAsync } from '../hooks/useAsync.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { appointmentsApi, servicesApi } from '../api/index.js';
import { getErrorMessage, getStatus } from '../api/http.js';
import { moneyShort, formatDuration, formatDateLong, formatMinutes } from '../utils/format.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Book() {
  const [params, setParams] = useSearchParams();
  const { user } = useAuth();
  const toast = useToast();
  const { data, loading, error, reload } = useAsync(() => servicesApi.list(), []);
  const services = useMemo(() => data?.services || [], [data]);

  const [serviceId, setServiceId] = useState(null);
  const [date, setDate] = useState(null);
  const [time, setTime] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '', notes: '' });
  const [errors, setErrors] = useState({});
  const [step, setStep] = useState('choose'); // choose → review → done
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [result, setResult] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Pre-select from ?service=slug (Book Now buttons)
  useEffect(() => {
    if (!services.length || serviceId) return;
    const slug = params.get('service');
    const match = services.find((s) => s.slug === slug);
    if (match) setServiceId(match._id);
  }, [services, params, serviceId]);

  useEffect(() => {
    if (user) setForm((f) => ({ ...f, name: f.name || user.name, email: f.email || user.email, phone: f.phone || user.phone || '' }));
  }, [user]);

  const service = services.find((s) => s._id === serviceId);
  const onTime = useCallback((t) => setTime(t), []);

  const chooseService = (s) => {
    setServiceId(s._id);
    setDate(null);
    setTime(null);
    setParams({ service: s.slug }, { replace: true });
  };

  const validate = () => {
    const e = {};
    if (form.name.trim().length < 2) e.name = 'Please enter your full name.';
    if (!EMAIL_RE.test(form.email.trim())) e.email = 'Please enter a valid email address.';
    if (!/^[0-9+().\-\s]{7,25}$/.test(form.phone.trim())) e.phone = 'Please enter a valid phone number.';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const goReview = (e) => {
    e.preventDefault();
    if (!service || !date || time == null) {
      setSubmitError('Please choose a service, date and time.');
      return;
    }
    if (!validate()) return;
    setSubmitError('');
    setStep('review');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const submit = async () => {
    setSubmitting(true);
    setSubmitError('');
    try {
      const r = await appointmentsApi.create({ serviceId, date, startMinutes: time, ...form });
      setResult(r);
      setStep('done');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      const msg = getErrorMessage(err);
      setSubmitError(msg);
      if (getStatus(err) === 409) {
        toast.error('That time was just taken — please pick another.');
        setTime(null);
        setRefreshKey((k) => k + 1);
        setStep('choose');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <PageLoader label="Loading services…" />;

  if (step === 'done' && result) {
    const a = result.appointment;
    return (
      <>
        <Seo title="Appointment Requested" noindex />
        <section className="section">
          <div className="container container-narrow">
            <div className="card card-pad confirm-card">
              <div className="confirm-icon">
                <IconCheckCircle size={40} />
              </div>
              <h1>You&apos;re booked in!</h1>
              <p className="lead" style={{ marginInline: 'auto' }}>
                Thank you, {a.customer.name.split(' ')[0]}. We&apos;ve received your request and sent a confirmation to <strong>{a.customer.email}</strong>. Our
                team will confirm your appointment shortly.
              </p>
              <dl className="summary-list">
                <div><dt>Confirmation #</dt><dd><strong>{a.confirmationCode}</strong></dd></div>
                <div><dt>Service</dt><dd>{a.serviceName}</dd></div>
                <div><dt>Date</dt><dd>{a.dateLabel}</dd></div>
                <div><dt>Time</dt><dd>{a.timeLabel}</dd></div>
                <div><dt>Starting price</dt><dd>{moneyShort(a.priceCents)}</dd></div>
                <div><dt>Status</dt><dd><span className="badge badge-warning">Pending confirmation</span></dd></div>
              </dl>
              <div className="row" style={{ justifyContent: 'center', marginTop: 24 }}>
                <Link className="btn" to={`/appointments/${a.id}?token=${result.manageToken}`}>
                  Manage this appointment
                </Link>
                <Link className="btn btn-outline" to="/shop">
                  Shop hair care
                </Link>
              </div>
              <p className="small muted" style={{ marginTop: 20 }}>
                Need to change something? You can cancel or reschedule online up to {BOOKING_POLICY.cancellationWindowHours} hours before your appointment.
              </p>
            </div>
          </div>
        </section>
      </>
    );
  }

  return (
    <>
      <Seo title="Book an Appointment" description="Book your braiding appointment online at Cece African Hair Braiding. Choose your style, pick a date and time, and get instant confirmation." />
      <header className="page-header">
        <div className="container">
          <span className="eyebrow">Online booking</span>
          <h1>Book an appointment</h1>
          <p className="lead">Choose your style, pick an open time, and you&apos;re set. Real-time availability means no double bookings.</p>
        </div>
      </header>

      <section className="section-sm">
        <div className="container booking-layout">
          <div className="booking-main">
            {error && <Alert type="error" onRetry={reload}>{error}</Alert>}

            {step === 'review' ? (
              <div className="panel">
                <h2 className="step-title">Review your booking</h2>
                <dl className="summary-list">
                  <div><dt>Service</dt><dd>{service.name}</dd></div>
                  <div><dt>Date</dt><dd>{formatDateLong(date)}</dd></div>
                  <div><dt>Time</dt><dd>{formatMinutes(time)} – {formatMinutes(time + service.durationMinutes)}</dd></div>
                  <div><dt>Estimated duration</dt><dd>{formatDuration(service.durationMinutes)}</dd></div>
                  <div><dt>Starting price</dt><dd>{moneyShort(service.priceCents)}</dd></div>
                  <div><dt>Name</dt><dd>{form.name}</dd></div>
                  <div><dt>Email</dt><dd>{form.email}</dd></div>
                  <div><dt>Phone</dt><dd>{form.phone}</dd></div>
                  {form.notes && <div><dt>Special requests</dt><dd>{form.notes}</dd></div>}
                </dl>
                {submitError && <Alert type="error">{submitError}</Alert>}
                <p className="small muted" style={{ marginTop: 16 }}>
                  By booking you agree to our cancellation policy: changes can be made online up to {BOOKING_POLICY.cancellationWindowHours} hours before your appointment.
                  Payment is taken at the salon.
                </p>
                <div className="row" style={{ marginTop: 20 }}>
                  <button type="button" className="btn btn-lg" onClick={submit} disabled={submitting}>
                    {submitting ? <><Spinner label="Booking" /> Booking…</> : 'Confirm appointment'}
                  </button>
                  <button type="button" className="btn btn-ghost" onClick={() => setStep('choose')} disabled={submitting}>
                    Edit details
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={goReview} noValidate>
                <fieldset className="panel step">
                  <legend className="step-title">
                    <span className="step-num">1</span> Choose your service
                  </legend>
                  <div className="service-options">
                    {services.map((s) => (
                      <label key={s._id} className={`service-option${s._id === serviceId ? ' selected' : ''}`}>
                        <input type="radio" name="service" value={s._id} checked={s._id === serviceId} onChange={() => chooseService(s)} className="sr-only" />
                        <img src={s.image} alt="" loading="lazy" width="64" height="64" />
                        <span className="service-option-text">
                          <strong>{s.name}</strong>
                          <span className="small muted">
                            From {moneyShort(s.priceCents)} · {formatDuration(s.durationMinutes)}
                          </span>
                        </span>
                      </label>
                    ))}
                  </div>
                </fieldset>

                <fieldset className="panel step" disabled={!service}>
                  <legend className="step-title">
                    <span className="step-num">2</span> Pick a date &amp; time
                  </legend>
                  {service ? (
                    <DateTimePicker serviceId={serviceId} date={date} time={time} onDate={setDate} onTime={onTime} refreshKey={refreshKey} />
                  ) : (
                    <p className="muted">Select a service first to see available dates.</p>
                  )}
                </fieldset>

                <fieldset className="panel step">
                  <legend className="step-title">
                    <span className="step-num">3</span> Your details
                  </legend>
                  <div className="form-grid">
                    <Field label="Full name" required error={errors.name} className="span-2">
                      {(p) => <input {...p} className="input" autoComplete="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />}
                    </Field>
                    <Field label="Email address" required error={errors.email}>
                      {(p) => <input {...p} type="email" className="input" autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />}
                    </Field>
                    <Field label="Phone number" required error={errors.phone}>
                      {(p) => <input {...p} type="tel" className="input" autoComplete="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />}
                    </Field>
                    <Field label="Special requests" hint="Size, length, color, or anything we should know (optional)" className="span-2">
                      {(p) => <textarea {...p} className="textarea" maxLength={1000} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />}
                    </Field>
                  </div>
                  {!user && (
                    <p className="small muted" style={{ marginTop: 12, marginBottom: 0 }}>
                      Have an account? <Link to="/login?redirect=/book">Log in</Link> to see this booking in your account.
                    </p>
                  )}
                </fieldset>

                {submitError && <Alert type="error">{submitError}</Alert>}
                <button type="submit" className="btn btn-lg" style={{ marginTop: 8 }} disabled={!service || !date || time == null}>
                  Review booking
                </button>
              </form>
            )}
          </div>

          <aside className="booking-summary" aria-label="Booking summary">
            <div className="card card-pad sticky">
              <h2 className="h-sm">Your appointment</h2>
              {service ? (
                <>
                  <img src={service.image} alt={service.imageAlt || service.name} className="summary-img" width="400" height="260" />
                  <h3 style={{ marginTop: 14 }}>{service.name}</h3>
                  <ul className="summary-meta">
                    <li><IconTag size={16} /> From {moneyShort(service.priceCents)}</li>
                    <li><IconClock size={16} /> {formatDuration(service.durationMinutes)}</li>
                    <li><IconCalendar size={16} /> {date ? `${formatDateLong(date)}${time != null ? ` at ${formatMinutes(time)}` : ''}` : 'Choose a date'}</li>
                  </ul>
                </>
              ) : (
                <p className="muted">Select a service to get started.</p>
              )}
              <hr />
              <p className="small muted" style={{ margin: 0 }}>
                Questions? Call <a href={`tel:${BUSINESS.phoneHref}`}>{BUSINESS.phone}</a>
              </p>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
