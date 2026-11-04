import { useState } from 'react';
import ImageInput from '../../components/admin/ImageInput.jsx';
import { Alert, Field, Modal, PageLoader, Spinner } from '../../components/ui.jsx';
import { IconPlus, IconEdit, IconTrash } from '../../components/Icons.jsx';
import { useAsync } from '../../hooks/useAsync.js';
import { useToast } from '../../context/ToastContext.jsx';
import { servicesApi } from '../../api/index.js';
import { getErrorMessage } from '../../api/http.js';
import { moneyShort, formatDuration } from '../../utils/format.js';

function ServiceForm({ service, onClose, onSaved }) {
  const [form, setForm] = useState(
    service
      ? { name: service.name, description: service.description, price: service.priceCents / 100, durationMinutes: service.durationMinutes, image: service.image, imageAlt: service.imageAlt || '', featured: service.featured, isActive: service.isActive, sortOrder: service.sortOrder }
      : { name: '', description: '', price: '', durationMinutes: 120, image: '', imageAlt: '', featured: false, isActive: true, sortOrder: 99 }
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    const body = { ...form, price: Number(form.price), durationMinutes: Number(form.durationMinutes), sortOrder: Number(form.sortOrder) || 0 };
    try {
      const r = service ? await servicesApi.update(service._id, body) : await servicesApi.create(body);
      onSaved(r.service);
    } catch (err) {
      setError(getErrorMessage(err));
      setBusy(false);
    }
  };

  return (
    <Modal
      title={service ? `Edit ${service.name}` : 'Add service'}
      onClose={onClose}
      size="lg"
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button type="submit" form="service-form" className="btn" disabled={busy}>{busy ? <Spinner label="Saving" /> : 'Save service'}</button>
        </>
      }
    >
      <form id="service-form" className="stack" onSubmit={save}>
        {error && <Alert type="error">{error}</Alert>}
        <div className="form-grid">
          <Field label="Service name" required className="span-2">{(p) => <input {...p} className="input" value={form.name} onChange={set('name')} />}</Field>
          <Field label="Starting price ($)" required>{(p) => <input {...p} type="number" min="0" step="1" className="input" value={form.price} onChange={set('price')} />}</Field>
          <Field label="Duration (minutes)" required hint="Blocks this much time on the calendar">{(p) => <input {...p} type="number" min="15" max="720" step="15" className="input" value={form.durationMinutes} onChange={set('durationMinutes')} />}</Field>
          <Field label="Description" required className="span-2">{(p) => <textarea {...p} className="textarea" rows={4} value={form.description} onChange={set('description')} />}</Field>
          <Field label="Display order">{(p) => <input {...p} type="number" className="input" value={form.sortOrder} onChange={set('sortOrder')} />}</Field>
          <Field label="Photo description (alt text)">{(p) => <input {...p} className="input" value={form.imageAlt} onChange={set('imageAlt')} />}</Field>
        </div>
        <ImageInput value={form.image} onChange={(url) => setForm({ ...form, image: url })} label="Hairstyle photo" />
        <div className="row">
          <label className="checkbox"><input type="checkbox" checked={form.featured} onChange={set('featured')} /> Feature on home page</label>
          <label className="checkbox"><input type="checkbox" checked={form.isActive} onChange={set('isActive')} /> Bookable online</label>
        </div>
      </form>
    </Modal>
  );
}

export default function Services() {
  const toast = useToast();
  const { data, loading, error, reload } = useAsync(() => servicesApi.list({ all: 'true' }), []);
  const [editing, setEditing] = useState(null);

  const remove = async (s) => {
    if (!window.confirm(`Delete "${s.name}"? Existing appointments keep their details. Tip: untick "Bookable online" to hide it instead.`)) return;
    try {
      await servicesApi.remove(s._id);
      toast.success('Service deleted.');
      reload();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  if (loading) return <PageLoader />;
  return (
    <div className="admin-page">
      <div className="admin-head">
        <div>
          <h1>Salon services</h1>
          <p className="muted">Update names, descriptions, prices, durations and photos.</p>
        </div>
        <button type="button" className="btn" onClick={() => setEditing('new')}><IconPlus size={16} /> Add service</button>
      </div>
      {error && <Alert type="error" onRetry={reload}>{error}</Alert>}
      <div className="table-wrap">
        <table className="table">
          <thead><tr><th>Service</th><th className="num">From</th><th>Duration</th><th>Status</th><th><span className="sr-only">Actions</span></th></tr></thead>
          <tbody>
            {data?.services.map((s) => (
              <tr key={s._id}>
                <td>
                  <div className="row" style={{ flexWrap: 'nowrap' }}>
                    <img src={s.image} alt="" className="thumb" width="48" height="48" />
                    <div><strong>{s.name}</strong><div className="small muted clamp-1">{s.description}</div></div>
                  </div>
                </td>
                <td className="num">{moneyShort(s.priceCents)}</td>
                <td>{formatDuration(s.durationMinutes)}</td>
                <td>
                  {s.isActive ? <span className="badge badge-success">Bookable</span> : <span className="badge">Hidden</span>}
                  {s.featured && <span className="badge badge-gold" style={{ marginLeft: 4 }}>Featured</span>}
                </td>
                <td>
                  <div className="row" style={{ flexWrap: 'nowrap', gap: 4 }}>
                    <button type="button" className="icon-btn" aria-label={`Edit ${s.name}`} onClick={() => setEditing(s)}><IconEdit size={18} /></button>
                    <button type="button" className="icon-btn" aria-label={`Delete ${s.name}`} onClick={() => remove(s)}><IconTrash size={18} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {editing && (
        <ServiceForm
          service={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            toast.success('Service saved.');
            reload();
          }}
        />
      )}
    </div>
  );
}
