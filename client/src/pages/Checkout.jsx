import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import Seo from '../components/Seo.jsx';
import OrderSummary from '../components/OrderSummary.jsx';
import { Alert, Field, Spinner } from '../components/ui.jsx';
import { IconLock, IconShield, IconCheckCircle, IconArrowLeft } from '../components/Icons.jsx';
import { useCart } from '../context/CartContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useCartQuote } from '../hooks/useCartQuote.js';
import { checkoutApi } from '../api/index.js';
import { getErrorDetails, getErrorMessage } from '../api/http.js';

const STATES = 'AL AK AZ AR CA CO CT DE DC FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY'.split(' ');
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const EMPTY = { firstName: '', lastName: '', email: '', phone: '', line1: '', line2: '', city: '', state: '', postalCode: '', country: 'US' };

function validate(f) {
  const e = {};
  if (!f.firstName.trim()) e.firstName = 'First name is required.';
  if (!f.lastName.trim()) e.lastName = 'Last name is required.';
  if (!EMAIL_RE.test(f.email.trim())) e.email = 'Enter a valid email address.';
  if (!/^[0-9+().\-\s]{7,25}$/.test(f.phone.trim())) e.phone = 'Enter a valid phone number.';
  if (f.line1.trim().length < 3) e.line1 = 'Street address is required.';
  if (f.city.trim().length < 2) e.city = 'City is required.';
  if (!f.state) e.state = 'Select a state.';
  if (!/^\d{5}(-\d{4})?$/.test(f.postalCode.trim())) e.postalCode = 'Enter a valid ZIP code.';
  return e;
}

export default function Checkout() {
  const { items, payload } = useCart();
  const { user } = useAuth();
  const { quote, loading, error: quoteError, notices } = useCartQuote();
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  useEffect(() => {
    if (!user) return;
    const [firstName, ...rest] = (user.name || '').split(' ');
    setForm((f) => ({
      ...f,
      firstName: f.firstName || firstName || '',
      lastName: f.lastName || rest.join(' '),
      email: f.email || user.email,
      phone: f.phone || user.phone || '',
      line1: f.line1 || user.address?.line1 || '',
      line2: f.line2 || user.address?.line2 || '',
      city: f.city || user.address?.city || '',
      state: f.state || user.address?.state || '',
      postalCode: f.postalCode || user.address?.postalCode || '',
    }));
  }, [user]);

  if (!items.length && !submitting) return <Navigate to="/cart" replace />;

  const set = (k) => (e) => {
    setForm({ ...form, [k]: e.target.value });
    if (errors[k]) setErrors({ ...errors, [k]: undefined });
  };

  const submit = async (e) => {
    e.preventDefault();
    const v = validate(form);
    setErrors(v);
    if (Object.keys(v).length) {
      document.getElementById(`co-${Object.keys(v)[0]}`)?.focus();
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      const { firstName, lastName, email, phone, ...address } = form;
      const r = await checkoutApi.createSession({
        items: payload, // ids + quantities only — prices are looked up on the server
        customer: { firstName, lastName, email, phone },
        shippingAddress: address,
      });
      window.location.assign(r.url); // → Stripe-hosted secure checkout
    } catch (err) {
      setSubmitError({ message: getErrorMessage(err), details: getErrorDetails(err) });
      setSubmitting(false);
    }
  };

  const fieldProps = (k, label, extra = {}) => ({
    label,
    required: !extra.optional,
    error: errors[k],
    id: `co-${k}`,
    className: extra.className,
  });

  return (
    <>
      <Seo title="Secure Checkout" noindex />
      <section className="section-sm">
        <div className="container">
          <Link to="/cart" className="btn btn-ghost btn-sm" style={{ marginBottom: 8 }}>
            <IconArrowLeft size={16} /> Back to cart
          </Link>
          <h1 className="h-page">Secure checkout</h1>
          <div className="checkout-layout">
            <form onSubmit={submit} noValidate className="stack">
              {notices.length > 0 && (
                <Alert type="warning" title="We updated your cart">
                  <ul>{notices.map((n) => <li key={n}>{n}</li>)}</ul>
                </Alert>
              )}
              <fieldset className="panel">
                <legend className="step-title"><span className="step-num">1</span> Contact information</legend>
                <div className="form-grid">
                  <Field {...fieldProps('firstName', 'First name')}>{(p) => <input {...p} className="input" autoComplete="given-name" value={form.firstName} onChange={set('firstName')} />}</Field>
                  <Field {...fieldProps('lastName', 'Last name')}>{(p) => <input {...p} className="input" autoComplete="family-name" value={form.lastName} onChange={set('lastName')} />}</Field>
                  <Field {...fieldProps('email', 'Email address')} hint="Your receipt and order updates go here.">{(p) => <input {...p} type="email" className="input" autoComplete="email" value={form.email} onChange={set('email')} />}</Field>
                  <Field {...fieldProps('phone', 'Phone number')}>{(p) => <input {...p} type="tel" className="input" autoComplete="tel" value={form.phone} onChange={set('phone')} />}</Field>
                </div>
              </fieldset>

              <fieldset className="panel">
                <legend className="step-title"><span className="step-num">2</span> Shipping address</legend>
                <div className="form-grid">
                  <Field {...fieldProps('line1', 'Street address', { className: 'span-2' })}>{(p) => <input {...p} className="input" autoComplete="address-line1" value={form.line1} onChange={set('line1')} />}</Field>
                  <Field {...fieldProps('line2', 'Apartment, suite, etc.', { optional: true, className: 'span-2' })}>{(p) => <input {...p} className="input" autoComplete="address-line2" value={form.line2} onChange={set('line2')} />}</Field>
                  <Field {...fieldProps('city', 'City')}>{(p) => <input {...p} className="input" autoComplete="address-level2" value={form.city} onChange={set('city')} />}</Field>
                  <Field {...fieldProps('state', 'State')}>
                    {(p) => (
                      <select {...p} className="select" autoComplete="address-level1" value={form.state} onChange={set('state')}>
                        <option value="">Select…</option>
                        {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    )}
                  </Field>
                  <Field {...fieldProps('postalCode', 'ZIP code')}>{(p) => <input {...p} className="input" inputMode="numeric" autoComplete="postal-code" value={form.postalCode} onChange={set('postalCode')} />}</Field>
                  <Field {...fieldProps('country', 'Country')} hint="We currently ship within the U.S.">
                    {(p) => (
                      <select {...p} className="select" autoComplete="country" value={form.country} onChange={set('country')}>
                        <option value="US">United States</option>
                      </select>
                    )}
                  </Field>
                </div>
              </fieldset>

              <fieldset className="panel">
                <legend className="step-title"><span className="step-num">3</span> Payment</legend>
                <p className="muted" style={{ marginTop: 0 }}>
                  You&apos;ll enter your card or wallet details on Stripe&apos;s secure payment page. Your card information never touches our servers.
                </p>
                <ul className="trust-list">
                  <li><IconLock size={18} /> Secure Stripe Checkout</li>
                  <li><IconShield size={18} /> Protected payment processing</li>
                  <li><IconCheckCircle size={18} /> Instant order confirmation</li>
                </ul>
                {submitError && (
                  <Alert type="error" title="We couldn't start checkout">
                    {submitError.message}
                    {submitError.details?.length > 0 && <ul>{submitError.details.map((d, i) => <li key={i}>{d.message}</li>)}</ul>}
                  </Alert>
                )}
                {quoteError && <Alert type="error">{quoteError}</Alert>}
                <button type="submit" className="btn btn-lg btn-block" style={{ marginTop: 16 }} disabled={submitting || loading || !quote?.lines?.length}>
                  {submitting ? (
                    <><Spinner label="Redirecting to secure payment" /> Redirecting to secure payment…</>
                  ) : (
                    <><IconLock size={18} /> Secure checkout{quote?.totals ? ` · ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(quote.totals.totalCents / 100)}` : ''}</>
                  )}
                </button>
                <p className="small muted text-center" style={{ margin: '12px 0 0' }}>
                  By placing your order you agree to our <Link to="/terms">Terms</Link> and <Link to="/shipping-returns">Shipping &amp; Returns</Link> policy.
                </p>
              </fieldset>
            </form>
            <aside>
              <div className="sticky">
                <OrderSummary lines={quote?.lines} totals={quote?.totals} loading={loading} />
              </div>
            </aside>
          </div>
        </div>
      </section>
    </>
  );
}
