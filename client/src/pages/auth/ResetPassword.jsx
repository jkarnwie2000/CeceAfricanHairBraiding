import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import AuthShell from './AuthShell.jsx';
import { Alert, Field, Spinner } from '../../components/ui.jsx';
import { authApi } from '../../api/index.js';
import { getErrorMessage } from '../../api/http.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';

export default function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const { setUser } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ password: '', confirm: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    if (form.password.length < 8) return setError('Use at least 8 characters.');
    if (form.password !== form.confirm) return setError('Passwords do not match.');
    setBusy(true);
    setError('');
    try {
      const r = await authApi.resetPassword({ token, password: form.password });
      setUser(r.user);
      toast.success('Your password has been updated.');
      navigate(r.user.role === 'admin' ? '/admin' : '/account', { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
      setBusy(false);
    }
    return undefined;
  };

  if (token.length !== 64)
    return (
      <AuthShell title="Invalid reset link">
        <Alert type="error">This password reset link is invalid or incomplete.</Alert>
        <Link to="/forgot-password" className="btn" style={{ marginTop: 16 }}>Request a new link</Link>
      </AuthShell>
    );

  return (
    <AuthShell title="Choose a new password">
      <form onSubmit={submit} className="stack">
        {error && <Alert type="error">{error}</Alert>}
        <Field label="New password" required hint="At least 8 characters.">
          {(p) => <input {...p} type="password" className="input" autoComplete="new-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />}
        </Field>
        <Field label="Confirm new password" required>
          {(p) => <input {...p} type="password" className="input" autoComplete="new-password" value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} />}
        </Field>
        <button type="submit" className="btn btn-lg btn-block" disabled={busy}>
          {busy ? <Spinner label="Saving" /> : 'Update password'}
        </button>
      </form>
    </AuthShell>
  );
}
