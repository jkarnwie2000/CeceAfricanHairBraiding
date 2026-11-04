import { useState } from 'react';
import { Alert, Field, PageLoader, Spinner } from '../../components/ui.jsx';
import { IconTrash, IconEdit, IconPlus } from '../../components/Icons.jsx';
import { useAsync } from '../../hooks/useAsync.js';
import { useToast } from '../../context/ToastContext.jsx';
import { categoriesApi } from '../../api/index.js';
import { getErrorMessage } from '../../api/http.js';

export default function Categories() {
  const toast = useToast();
  const { data, loading, error, reload } = useAsync(() => categoriesApi.list(), []);
  const [form, setForm] = useState({ name: '', description: '', sortOrder: 0 });
  const [editingId, setEditingId] = useState(null);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState('');

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    setFormError('');
    try {
      const body = { ...form, sortOrder: Number(form.sortOrder) || 0 };
      if (editingId) await categoriesApi.update(editingId, body);
      else await categoriesApi.create(body);
      toast.success(editingId ? 'Category updated.' : 'Category added.');
      setForm({ name: '', description: '', sortOrder: 0 });
      setEditingId(null);
      reload();
    } catch (err) {
      setFormError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const remove = async (c) => {
    if (!window.confirm(`Delete category "${c.name}"?`)) return;
    try {
      await categoriesApi.remove(c._id);
      toast.success('Category deleted.');
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
          <h1>Categories</h1>
          <p className="muted">Organize the shop. Categories with products can&apos;t be deleted until products are moved.</p>
        </div>
      </div>
      {error && <Alert type="error" onRetry={reload}>{error}</Alert>}
      <div className="admin-two-col">
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Name</th><th className="num">Products</th><th className="num">Order</th><th><span className="sr-only">Actions</span></th></tr></thead>
            <tbody>
              {data?.categories.map((c) => (
                <tr key={c._id}>
                  <td><strong>{c.name}</strong><div className="small muted">{c.description}</div></td>
                  <td className="num">{c.productCount}</td>
                  <td className="num">{c.sortOrder}</td>
                  <td>
                    <div className="row" style={{ flexWrap: 'nowrap', gap: 4 }}>
                      <button type="button" className="icon-btn" aria-label={`Edit ${c.name}`} onClick={() => { setEditingId(c._id); setForm({ name: c.name, description: c.description, sortOrder: c.sortOrder }); }}>
                        <IconEdit size={18} />
                      </button>
                      <button type="button" className="icon-btn" aria-label={`Delete ${c.name}`} onClick={() => remove(c)}>
                        <IconTrash size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <form className="panel stack" onSubmit={save}>
          <h2 className="h-sm">{editingId ? 'Edit category' : 'Add category'}</h2>
          {formError && <Alert type="error">{formError}</Alert>}
          <Field label="Name" required>{(p) => <input {...p} className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />}</Field>
          <Field label="Description">{(p) => <textarea {...p} className="textarea" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />}</Field>
          <Field label="Sort order" hint="Lower numbers appear first">{(p) => <input {...p} type="number" className="input" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: e.target.value })} />}</Field>
          <div className="row">
            <button type="submit" className="btn" disabled={busy}>{busy ? <Spinner label="Saving" /> : <><IconPlus size={16} /> {editingId ? 'Save' : 'Add category'}</>}</button>
            {editingId && <button type="button" className="btn btn-ghost" onClick={() => { setEditingId(null); setForm({ name: '', description: '', sortOrder: 0 }); }}>Cancel</button>}
          </div>
        </form>
      </div>
    </div>
  );
}
