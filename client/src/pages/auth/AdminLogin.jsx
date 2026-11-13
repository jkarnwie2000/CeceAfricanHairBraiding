import { useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import AuthShell from './AuthShell.jsx';
import { safeRedirect } from './Login.jsx';
import { Alert, Field, Spinner } from '../../components/ui.jsx';
import { IconLock } from '../../components/Icons.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { getErrorMessage } from '../../api/http.js';

/** Staff sign-in. Only accounts with the admin role get through to the dashboard. */
export default function AdminLogin() {
  const { login, logout, user, ready } = useAuth();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [form, setForm] = useState({ email: '', password: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const redirect = safeRedirect(params.get('redirect'), '/admin');
  const target = redirect.startsWith('/admin') ? redirect : '/admin';

  if (ready && user?.role === 'admin') return <Navigate to={target} replace />;

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const u = await login(form.email, form.password);
      if (u.role !== 'admin') {
        // Valid customer account, but not staff: sign back out so nobody is left half-logged-in here.
        await logout();
        setError('This account does not have admin access. Customers can sign in on the regular login page.');
        setBusy(false);
        return;
      }
      toast.success(`Welcome back, ${u.name.split(' ')[0]}!`);
      navigate(target, { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
      setBusy(false);
    }
  };

  return (
    <AuthShell
      eyebrow="Admin portal"
      title="Admin log in"
      seoTitle="Admin Log In"
      subtitle="Sign in to manage orders, appointments, products and services."
    >
      <form onSubmit={submit} className="stack" noValidate>
        {error && <Alert type="error">{error}</Alert>}
        {ready && user && user.role !== 'admin' && !error && (
          <Alert type="info">
            You're signed in as {user.email}, which is a customer account. Sign in below with an admin account.
          </Alert>
        )}
        <Field label="Email address" required>
          {(p) => (
            <input
              {...p}
              type="email"
              className="input"
              autoComplete="username"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          )}
        </Field>
        <Field label="Password" required>
          {(p) => (
            <input
              {...p}
              type="password"
              className="input"
              autoComplete="current-password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          )}
        </Field>
        <div className="row-between small">
          <Link to="/forgot-password?admin=1">Forgot password?</Link>
        </div>
        <button type="submit" className="btn btn-lg btn-block" disabled={busy || !form.email || !form.password}>
          {busy ? (
            <Spinner label="Signing in" />
          ) : (
            <>
              <IconLock size={18} /> Log in to dashboard
            </>
          )}
        </button>
        <p className="text-center muted">
          New team member? <Link to="/admin/register">Create a new admin account</Link>
        </p>
        <p className="text-center small muted" style={{ margin: 0 }}>
          Shopping or booking? <Link to="/login">Customer log in</Link>
        </p>
      </form>
    </AuthShell>
  );
}
