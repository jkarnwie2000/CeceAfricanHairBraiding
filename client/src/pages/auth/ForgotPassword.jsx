import { useState } from 'react';
import { Link } from 'react-router-dom';
import AuthShell from './AuthShell.jsx';
import { Alert, Field, Spinner } from '../../components/ui.jsx';
import { authApi } from '../../api/index.js';
import { getErrorMessage } from '../../api/http.js';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [state, setState] = useState({ busy: false, done: '', error: '' });

  const submit = async (e) => {
    e.preventDefault();
    setState({ busy: true, done: '', error: '' });
    try {
      const r = await authApi.forgotPassword(email);
      setState({ busy: false, done: r.message, error: '' });
    } catch (err) {
      setState({ busy: false, done: '', error: getErrorMessage(err) });
    }
  };

  return (
    <AuthShell title="Reset your password" subtitle="Enter the email you signed up with and we'll send you a secure reset link.">
      {state.done ? (
        <div className="stack">
          <Alert type="success">{state.done}</Alert>
          <p className="muted small">The link expires in 1 hour. Check your spam folder if you don&apos;t see it.</p>
          <Link to="/login" className="btn btn-outline">Back to log in</Link>
        </div>
      ) : (
        <form onSubmit={submit} className="stack">
          {state.error && <Alert type="error">{state.error}</Alert>}
          <Field label="Email address" required>
            {(p) => <input {...p} type="email" className="input" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />}
          </Field>
          <button type="submit" className="btn btn-lg btn-block" disabled={state.busy}>
            {state.busy ? <Spinner label="Sending" /> : 'Send reset link'}
          </button>
          <p className="text-center"><Link to="/login">Back to log in</Link></p>
        </form>
      )}
    </AuthShell>
  );
}
