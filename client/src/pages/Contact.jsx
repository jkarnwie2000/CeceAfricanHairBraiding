import { useState } from 'react';
import { BUSINESS } from '@shared/business.js';
import Seo from '../components/Seo.jsx';
import { HoursList, SocialLinks } from '../components/Footer.jsx';
import { Alert, Field, Spinner } from '../components/ui.jsx';
import { IconPhone, IconMail, IconPin } from '../components/Icons.jsx';
import { miscApi } from '../api/index.js';
import { getErrorMessage } from '../api/http.js';
import { useAuth } from '../context/AuthContext.jsx';

export default function Contact() {
  const { user } = useAuth();
  const [form, setForm] = useState({ name: user?.name || '', email: user?.email || '', phone: '', subject: '', message: '', website: '' });
  const [state, setState] = useState({ busy: false, done: '', error: '' });
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const a = BUSINESS.address;

  const submit = async (e) => {
    e.preventDefault();
    setState({ busy: true, done: '', error: '' });
    try {
      const r = await miscApi.contact(form);
      setState({ busy: false, done: r.message, error: '' });
      setForm({ ...form, subject: '', message: '' });
    } catch (err) {
      setState({ busy: false, done: '', error: getErrorMessage(err) });
    }
  };

  return (
    <>
      <Seo title="Contact Us" description={`Contact ${BUSINESS.name}: call ${BUSINESS.phone}, email us, or visit the salon in ${a.city}, ${a.state}.`} />
      <header className="page-header">
        <div className="container">
          <span className="eyebrow">Get in touch</span>
          <h1>Contact us</h1>
          <p className="lead">Questions about a style, bridal party bookings or an order? We usually reply within one business day.</p>
        </div>
      </header>
      <section className="section-sm">
        <div className="container contact-layout">
          <form className="panel stack" onSubmit={submit}>
            <h2 className="h-sm">Send a message</h2>
            {state.done && <Alert type="success">{state.done}</Alert>}
            {state.error && <Alert type="error">{state.error}</Alert>}
            <div className="form-grid">
              <Field label="Name" required>{(p) => <input {...p} className="input" autoComplete="name" minLength={2} value={form.name} onChange={set('name')} />}</Field>
              <Field label="Email" required>{(p) => <input {...p} type="email" className="input" autoComplete="email" value={form.email} onChange={set('email')} />}</Field>
              <Field label="Phone (optional)">{(p) => <input {...p} type="tel" className="input" autoComplete="tel" value={form.phone} onChange={set('phone')} />}</Field>
              <Field label="Subject">{(p) => <input {...p} className="input" maxLength={150} value={form.subject} onChange={set('subject')} />}</Field>
              <Field label="Message" required className="span-2">{(p) => <textarea {...p} className="textarea" minLength={10} maxLength={3000} rows={6} value={form.message} onChange={set('message')} />}</Field>
            </div>
            <input className="hp-field" tabIndex={-1} autoComplete="off" aria-hidden="true" name="website" value={form.website} onChange={set('website')} />
            <button type="submit" className="btn btn-lg" disabled={state.busy}>
              {state.busy ? <Spinner label="Sending" /> : 'Send message'}
            </button>
          </form>
          <aside className="stack">
            <div className="card card-pad">
              <h2 className="h-sm">Visit the salon</h2>
              <ul className="contact-list">
                <li><IconPin size={20} /><a href={BUSINESS.mapUrl} target="_blank" rel="noopener noreferrer">{a.line1}<br />{a.city}, {a.state} {a.postalCode}</a></li>
                <li><IconPhone size={20} /><a href={`tel:${BUSINESS.phoneHref}`}>{BUSINESS.phone}</a></li>
                <li><IconMail size={20} /><a href={`mailto:${BUSINESS.email}`}>{BUSINESS.email}</a></li>
              </ul>
              <SocialLinks />
            </div>
            <div className="card card-pad">
              <h2 className="h-sm">Hours</h2>
              <HoursList className="hours-list" />
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
