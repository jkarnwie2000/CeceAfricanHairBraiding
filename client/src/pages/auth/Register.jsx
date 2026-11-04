import { useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import AuthShell from './AuthShell.jsx';
import { safeRedirect } from './Login.jsx';
import { Alert, Field, Spinner } from '../../components/ui.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { getErrorMessage } from '../../api/http.js';

export default function Register() {
  const { register, user, ready } = useAuth();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const redirect = params.get('redirect');

  if (ready && user) return <Navigate to={safeRedirect(redirect)} replace />;

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    const v = {};
    if (form.name.trim().length < 2) v.name = 'Please enter your name.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) v.email = 'Enter a valid email address.';
    if (form.phone && !/^[0-9+().\-\s]{7,25}$/.test(form.phone)) v.phone = 'Enter a valid phone number.';
    if (form.password.length < 8) v.password = 'Use at least 8 characters.';
    if (form.password !== form.confirm) v.confirm = 'Passwords do not match.';
    setErrors(v);
    if (Object.keys(v).length) return;
    setBusy(true);
    setError('');
    try {
      const u = await register({ name: form.name, email: form.email, phone: form.phone, password: form.password });
      toast.success(`Welcome to Cece, ${u.name.split(' ')[0]}!`);
      navigate(safeRedirect(redirect), { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
      setBusy(false);
    }
  };

  return (
    <AuthShell title="Create your account" subtitle="Book faster, track your orders and see all your appointments in one place.">
      <form onSubmit={submit} className="stack" noValidate>
        {error && <Alert type="error">{error}</Alert>}
        <Field label="Full name" required error={errors.name}>
          {(p) => <input {...p} className="input" autoComplete="name" value={form.name} onChange={set('name')} />}
        </Field>
        <Field label="Email address" required error={errors.email}>
          {(p) => <input {...p} type="email" className="input" autoComplete="email" value={form.email} onChange={set('email')} />}
        </Field>
        <Field label="Phone (optional)" error={errors.phone}>
          {(p) => <input {...p} type="tel" className="input" autoComplete="tel" value={form.phone} onChange={set('phone')} />}
        </Field>
        <Field label="Password" required error={errors.password} hint="At least 8 characters.">
          {(p) => <input {...p} type="password" className="input" autoComplete="new-password" value={form.password} onChange={set('password')} />}
        </Field>
        <Field label="Confirm password" required error={errors.confirm}>
          {(p) => <input {...p} type="password" className="input" autoComplete="new-password" value={form.confirm} onChange={set('confirm')} />}
        </Field>
        <button type="submit" className="btn btn-lg btn-block" disabled={busy}>
          {busy ? <Spinner label="Creating account" /> : 'Create account'}
        </button>
        <p className="small muted text-center">
          By creating an account you agree to our <Link to="/terms">Terms</Link> and <Link to="/privacy">Privacy Policy</Link>.
        </p>
        <p className="text-center muted">
          Already have an account? <Link to={`/login${redirect ? `?redirect=${encodeURIComponent(redirect)}` : ''}`}>Log in</Link>
        </p>
      </form>
    </AuthShell>
  );
}
