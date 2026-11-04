import { useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import AuthShell from './AuthShell.jsx';
import { Alert, Field, Spinner } from '../../components/ui.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { getErrorMessage } from '../../api/http.js';

/** Only allow same-site relative redirects (prevents open-redirect abuse). */
export const safeRedirect = (r, fallback = '/account') => (r && r.startsWith('/') && !r.startsWith('//') ? r : fallback);

export default function Login() {
  const { login, user, ready } = useAuth();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [form, setForm] = useState({ email: '', password: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const redirect = params.get('redirect');

  if (ready && user) return <Navigate to={safeRedirect(redirect, user.role === 'admin' ? '/admin' : '/account')} replace />;

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const u = await login(form.email, form.password);
      toast.success(`Welcome back, ${u.name.split(' ')[0]}!`);
      navigate(safeRedirect(redirect, u.role === 'admin' ? '/admin' : '/account'), { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
      setBusy(false);
    }
  };

  return (
    <AuthShell title="Welcome back" subtitle="Log in to manage appointments, track orders and check out faster.">
      <form onSubmit={submit} className="stack">
        {error && <Alert type="error">{error}</Alert>}
        <Field label="Email address" required>
          {(p) => <input {...p} type="email" className="input" autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />}
        </Field>
        <Field label="Password" required>
          {(p) => <input {...p} type="password" className="input" autoComplete="current-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />}
        </Field>
        <div className="row-between small">
          <Link to="/forgot-password">Forgot your password?</Link>
        </div>
        <button type="submit" className="btn btn-lg btn-block" disabled={busy}>
          {busy ? <Spinner label="Logging in" /> : 'Log in'}
        </button>
        <p className="text-center muted">
          New to Cece? <Link to={`/register${redirect ? `?redirect=${encodeURIComponent(redirect)}` : ''}`}>Create an account</Link>
        </p>
      </form>
    </AuthShell>
  );
}
