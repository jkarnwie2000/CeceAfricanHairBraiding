import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import AuthShell from './AuthShell.jsx';
import { Alert, Field, Spinner } from '../../components/ui.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { authApi } from '../../api/index.js';
import { getErrorMessage } from '../../api/http.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Create a new administrator account. The server only allows this with the secret
 * admin invite code (ADMIN_SIGNUP_CODE), so the public can't make themselves admins.
 */
export default function AdminRegister() {
  const { user, ready, setUser } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirm: '', inviteCode: '' });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  if (ready && user?.role === 'admin') return <Navigate to="/admin" replace />;

  const set = (k) => (e) => {
    setForm({ ...form, [k]: e.target.value });
    if (errors[k]) setErrors({ ...errors, [k]: undefined });
  };

  const submit = async (e) => {
    e.preventDefault();
    const v = {};
    if (form.name.trim().length < 2) v.name = 'Please enter your full name.';
    if (!EMAIL_RE.test(form.email.trim())) v.email = 'Enter a valid email address.';
    if (form.phone && !/^[0-9+().\-\s]{7,25}$/.test(form.phone)) v.phone = 'Enter a valid phone number.';
    if (form.password.length < 8) v.password = 'Use at least 8 characters.';
    if (form.password !== form.confirm) v.confirm = 'Passwords do not match.';
    if (!form.inviteCode.trim()) v.inviteCode = 'Enter the admin invite code from the business owner.';
    setErrors(v);
    if (Object.keys(v).length) {
      document.getElementById(`ar-${Object.keys(v)[0]}`)?.focus();
      return;
    }
    setBusy(true);
    setError('');
    try {
      const r = await authApi.registerAdmin({
        name: form.name,
        email: form.email,
        phone: form.phone,
        password: form.password,
        inviteCode: form.inviteCode,
      });
      setUser(r.user);
      toast.success(`Welcome to the team, ${r.user.name.split(' ')[0]}!`);
      navigate('/admin', { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
      setBusy(false);
    }
  };

  const f = (k, label, extra = {}) => ({ id: `ar-${k}`, label, error: errors[k], required: !extra.optional, hint: extra.hint });

  return (
    <AuthShell
      eyebrow="Admin portal"
      title="Create an admin account"
      seoTitle="Create Admin Account"
      subtitle="For salon staff only. You'll need the admin invite code from the business owner."
    >
      <form onSubmit={submit} className="stack" noValidate>
        {error && <Alert type="error">{error}</Alert>}
        <Field {...f('name', 'Full name')}>
          {(p) => <input {...p} className="input" autoComplete="name" value={form.name} onChange={set('name')} />}
        </Field>
        <Field {...f('email', 'Email address')}>
          {(p) => <input {...p} type="email" className="input" autoComplete="email" value={form.email} onChange={set('email')} />}
        </Field>
        <Field {...f('phone', 'Phone (optional)', { optional: true })}>
          {(p) => <input {...p} type="tel" className="input" autoComplete="tel" value={form.phone} onChange={set('phone')} />}
        </Field>
        <Field {...f('password', 'Password', { hint: 'At least 8 characters.' })}>
          {(p) => <input {...p} type="password" className="input" autoComplete="new-password" value={form.password} onChange={set('password')} />}
        </Field>
        <Field {...f('confirm', 'Confirm password')}>
          {(p) => <input {...p} type="password" className="input" autoComplete="new-password" value={form.confirm} onChange={set('confirm')} />}
        </Field>
        <Field {...f('inviteCode', 'Admin invite code', { hint: 'Provided privately by the business owner.' })}>
          {(p) => <input {...p} className="input" autoComplete="off" spellCheck={false} value={form.inviteCode} onChange={set('inviteCode')} />}
        </Field>
        <button type="submit" className="btn btn-lg btn-block" disabled={busy}>
          {busy ? <Spinner label="Creating account" /> : 'Create admin account'}
        </button>
        <p className="text-center muted">
          Already have an admin account? <Link to="/admin/login">Log in</Link>
        </p>
      </form>
    </AuthShell>
  );
}
