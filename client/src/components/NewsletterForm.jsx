import { useState } from 'react';
import { miscApi } from '../api/index.js';
import { getErrorMessage } from '../api/http.js';
import { Spinner } from './ui.jsx';

export default function NewsletterForm({ dark = true }) {
  const [email, setEmail] = useState('');
  const [hp, setHp] = useState('');
  const [state, setState] = useState({ status: 'idle', message: '' });

  const submit = async (e) => {
    e.preventDefault();
    setState({ status: 'loading', message: '' });
    try {
      const r = await miscApi.subscribe(email, hp);
      setState({ status: 'success', message: r.message });
      setEmail('');
    } catch (err) {
      setState({ status: 'error', message: getErrorMessage(err) });
    }
  };

  return (
    <div>
      <form className="newsletter-form" onSubmit={submit} noValidate={false}>
        <label htmlFor="newsletter-email" className="sr-only">
          Email address
        </label>
        <input
          id="newsletter-email"
          className="input"
          type="email"
          required
          autoComplete="email"
          placeholder="Your email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input className="hp-field" tabIndex={-1} autoComplete="off" aria-hidden="true" value={hp} onChange={(e) => setHp(e.target.value)} name="website" />
        <button className={`btn ${dark ? 'btn-gold' : ''}`} type="submit" disabled={state.status === 'loading'}>
          {state.status === 'loading' ? <Spinner label="Subscribing" /> : 'Subscribe'}
        </button>
      </form>
      <p role="status" aria-live="polite" className="small" style={{ marginTop: 10, minHeight: '1.4em', color: state.status === 'error' ? '#ffb4ab' : 'inherit' }}>
        {state.message}
      </p>
    </div>
  );
}
