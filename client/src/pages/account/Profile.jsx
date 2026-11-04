import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, Field, Spinner } from '../../components/ui.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { authApi } from '../../api/index.js';
import { getErrorMessage } from '../../api/http.js';

export default function Profile() {
  const { user, setUser, logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: user.name,
    phone: user.phone || '',
    address: { line1: '', line2: '', city: '', state: '', postalCode: '', country: 'US', ...user.address },
  });
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [pwError, setPwError] = useState('');

  const setAddr = (k) => (e) => setForm({ ...form, address: { ...form.address, [k]: e.target.value } });

  const saveProfile = async (e) => {
    e.preventDefault();
    setBusy('profile');
    setError('');
    try {
      const r = await authApi.updateProfile(form);
      setUser(r.user);
      toast.success('Profile saved.');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setBusy('');
    }
  };

  const savePassword = async (e) => {
    e.preventDefault();
    setPwError('');
    if (pw.newPassword.length < 8) return setPwError('New password must be at least 8 characters.');
    if (pw.newPassword !== pw.confirm) return setPwError('New passwords do not match.');
    setBusy('password');
    try {
      await authApi.changePassword({ currentPassword: pw.currentPassword, newPassword: pw.newPassword });
      setPw({ currentPassword: '', newPassword: '', confirm: '' });
      toast.success('Password updated.');
    } catch (err) {
      setPwError(getErrorMessage(err));
    } finally {
      setBusy('');
    }
    return undefined;
  };

  return (
    <div className="account-grid">
      <form className="panel stack" onSubmit={saveProfile}>
        <h2 className="h-sm">Profile information</h2>
        {error && <Alert type="error">{error}</Alert>}
        <div className="form-grid">
          <Field label="Full name" required>{(p) => <input {...p} className="input" autoComplete="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />}</Field>
          <Field label="Email" hint="Contact us to change your email.">{(p) => <input {...p} className="input" value={user.email} disabled />}</Field>
          <Field label="Phone">{(p) => <input {...p} type="tel" className="input" autoComplete="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />}</Field>
        </div>
        <h3 className="h-xs">Default shipping address</h3>
        <div className="form-grid">
          <Field label="Street address" className="span-2">{(p) => <input {...p} className="input" autoComplete="address-line1" value={form.address.line1} onChange={setAddr('line1')} />}</Field>
          <Field label="Apartment / suite" className="span-2">{(p) => <input {...p} className="input" autoComplete="address-line2" value={form.address.line2} onChange={setAddr('line2')} />}</Field>
          <Field label="City">{(p) => <input {...p} className="input" autoComplete="address-level2" value={form.address.city} onChange={setAddr('city')} />}</Field>
          <Field label="State">{(p) => <input {...p} className="input" autoComplete="address-level1" maxLength={40} value={form.address.state} onChange={setAddr('state')} />}</Field>
          <Field label="ZIP code">{(p) => <input {...p} className="input" autoComplete="postal-code" value={form.address.postalCode} onChange={setAddr('postalCode')} />}</Field>
        </div>
        <button type="submit" className="btn" disabled={busy === 'profile'}>
          {busy === 'profile' ? <Spinner label="Saving" /> : 'Save changes'}
        </button>
      </form>

      <div className="stack">
        <form className="panel stack" onSubmit={savePassword}>
          <h2 className="h-sm">Change password</h2>
          {pwError && <Alert type="error">{pwError}</Alert>}
          <Field label="Current password" required>{(p) => <input {...p} type="password" className="input" autoComplete="current-password" value={pw.currentPassword} onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} />}</Field>
          <Field label="New password" required>{(p) => <input {...p} type="password" className="input" autoComplete="new-password" value={pw.newPassword} onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} />}</Field>
          <Field label="Confirm new password" required>{(p) => <input {...p} type="password" className="input" autoComplete="new-password" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} />}</Field>
          <button type="submit" className="btn btn-outline" disabled={busy === 'password'}>
            {busy === 'password' ? <Spinner label="Updating" /> : 'Update password'}
          </button>
        </form>
        <div className="panel">
          <h2 className="h-sm">Sign out</h2>
          <p className="muted small">Sign out of your account on this device.</p>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={async () => {
              await logout();
              navigate('/');
            }}
          >
            Log out
          </button>
        </div>
      </div>
    </div>
  );
}
