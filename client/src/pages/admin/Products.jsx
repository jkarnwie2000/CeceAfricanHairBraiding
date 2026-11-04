import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import ImageInput from '../../components/admin/ImageInput.jsx';
import { Alert, EmptyState, Field, Modal, PageLoader, Pagination, Spinner } from '../../components/ui.jsx';
import { IconPlus, IconEdit, IconTrash, IconBox, IconSearch } from '../../components/Icons.jsx';
import { useAsync } from '../../hooks/useAsync.js';
import { useToast } from '../../context/ToastContext.jsx';
import { categoriesApi, productsApi } from '../../api/index.js';
import { getErrorMessage } from '../../api/http.js';
import { money } from '../../utils/format.js';

const blank = { name: '', brand: '', category: '', description: '', price: '', compareAtPrice: '', inventory: 0, images: [''], tags: '', featured: false, isActive: true };

function ProductForm({ product, categories, onClose, onSaved }) {
  const [form, setForm] = useState(() =>
    product
      ? {
          name: product.name,
          brand: product.brand || '',
          category: product.category?._id || product.category,
          description: product.description,
          price: (product.priceCents / 100).toFixed(2),
          compareAtPrice: product.compareAtPriceCents ? (product.compareAtPriceCents / 100).toFixed(2) : '',
          inventory: product.inventory,
          images: product.images?.length ? product.images : [''],
          tags: (product.tags || []).join(', '),
          featured: product.featured,
          isActive: product.isActive,
        }
      : { ...blank, category: categories[0]?._id || '' }
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    const body = {
      name: form.name,
      brand: form.brand,
      category: form.category,
      description: form.description,
      price: Number(form.price),
      compareAtPrice: form.compareAtPrice === '' ? null : Number(form.compareAtPrice),
      inventory: Number(form.inventory),
      images: form.images.map((i) => i.trim()).filter(Boolean),
      tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
      featured: form.featured,
      isActive: form.isActive,
    };
    try {
      const r = product ? await productsApi.update(product._id, body) : await productsApi.create(body);
      onSaved(r.product, !product);
    } catch (err) {
      setError(getErrorMessage(err));
      setBusy(false);
    }
  };

  return (
    <Modal
      title={product ? 'Edit product' : 'Add product'}
      onClose={onClose}
      size="lg"
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button type="submit" form="product-form" className="btn" disabled={busy}>{busy ? <Spinner label="Saving" /> : 'Save product'}</button>
        </>
      }
    >
      <form id="product-form" className="stack" onSubmit={save}>
        {error && <Alert type="error">{error}</Alert>}
        <div className="form-grid">
          <Field label="Product name" required className="span-2">{(p) => <input {...p} className="input" value={form.name} onChange={set('name')} />}</Field>
          <Field label="Brand">{(p) => <input {...p} className="input" value={form.brand} onChange={set('brand')} />}</Field>
          <Field label="Category" required>
            {(p) => (
              <select {...p} className="select" value={form.category} onChange={set('category')}>
                {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            )}
          </Field>
          <Field label="Price ($)" required>{(p) => <input {...p} type="number" min="0" step="0.01" className="input" value={form.price} onChange={set('price')} />}</Field>
          <Field label="Compare-at price ($)" hint="Optional — shows a sale price">{(p) => <input {...p} type="number" min="0" step="0.01" className="input" value={form.compareAtPrice} onChange={set('compareAtPrice')} />}</Field>
          <Field label="Inventory" required>{(p) => <input {...p} type="number" min="0" step="1" className="input" value={form.inventory} onChange={set('inventory')} />}</Field>
          <Field label="Tags" hint="Comma separated">{(p) => <input {...p} className="input" value={form.tags} onChange={set('tags')} />}</Field>
          <Field label="Description" required className="span-2">{(p) => <textarea {...p} className="textarea" rows={5} value={form.description} onChange={set('description')} />}</Field>
        </div>
        <ImageInput value={form.images[0] || ''} onChange={(url) => setForm({ ...form, images: [url, ...form.images.slice(1)] })} label="Main photo" />
        <div className="row">
          <label className="checkbox"><input type="checkbox" checked={form.featured} onChange={set('featured')} /> Featured</label>
          <label className="checkbox"><input type="checkbox" checked={form.isActive} onChange={set('isActive')} /> Visible in shop</label>
        </div>
      </form>
    </Modal>
  );
}

function InventoryCell({ product, onSaved }) {
  const [value, setValue] = useState(product.inventory);
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  useEffect(() => setValue(product.inventory), [product.inventory]);
  const save = async () => {
    if (Number(value) === product.inventory) return;
    setBusy(true);
    try {
      const r = await productsApi.setInventory(product._id, { inventory: Number(value) });
      onSaved(r.product);
      toast.success(`Inventory updated: ${product.name}`);
    } catch (err) {
      toast.error(getErrorMessage(err));
      setValue(product.inventory);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="row" style={{ flexWrap: 'nowrap', gap: 6 }}>
      <input
        type="number"
        min="0"
        className={`input inv-input${product.inventory === 0 ? ' zero' : product.inventory <= 5 ? ' low' : ''}`}
        aria-label={`Inventory for ${product.name}`}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={save}
        onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
        disabled={busy}
      />
      {busy && <Spinner label="Saving" />}
    </div>
  );
}

export default function Products() {
  const toast = useToast();
  const [q, setQ] = useState('');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState(null); // product | 'new' | null
  const cats = useAsync(() => categoriesApi.list(), []);
  const list = useAsync(() => productsApi.list({ q: query || undefined, category: category || undefined, includeInactive: 'true', sort: 'name', page, limit: 20 }), [query, category, page]);

  useEffect(() => {
    const t = setTimeout(() => {
      setQuery(q.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [q]);

  const replace = (p) => list.setData((d) => ({ ...d, products: d.products.map((x) => (x._id === p._id ? { ...x, ...p, category: p.category?.name ? p.category : x.category } : x)) }));

  const remove = async (p) => {
    if (!window.confirm(`Delete "${p.name}"? This cannot be undone. Tip: untick "Visible in shop" to hide it instead.`)) return;
    try {
      await productsApi.remove(p._id);
      toast.success('Product deleted.');
      list.reload();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  if (cats.loading) return <PageLoader />;

  return (
    <div className="admin-page">
      <div className="admin-head">
        <div>
          <h1>Products</h1>
          <p className="muted">{list.data ? `${list.data.total} products` : 'Manage your catalog and inventory.'}</p>
        </div>
        <button type="button" className="btn" onClick={() => setEditing('new')} disabled={!cats.data?.categories.length}>
          <IconPlus size={16} /> Add product
        </button>
      </div>

      <div className="admin-filters">
        <div className="search-box">
          <IconSearch size={18} />
          <label className="sr-only" htmlFor="ps">Search products</label>
          <input id="ps" type="search" className="input" placeholder="Search products" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <label className="sr-only" htmlFor="pc">Filter by category</label>
        <select id="pc" className="select" value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }}>
          <option value="">All categories</option>
          {cats.data?.categories.map((c) => <option key={c._id} value={c.slug}>{c.name}</option>)}
        </select>
      </div>

      {list.error && <Alert type="error" onRetry={list.reload}>{list.error}</Alert>}
      {list.loading && !list.data ? (
        <PageLoader />
      ) : list.data?.products.length ? (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr><th>Product</th><th>Category</th><th className="num">Price</th><th>Inventory</th><th>Status</th><th><span className="sr-only">Actions</span></th></tr>
            </thead>
            <tbody>
              {list.data.products.map((p) => (
                <tr key={p._id}>
                  <td>
                    <div className="row" style={{ flexWrap: 'nowrap' }}>
                      <img src={p.images?.[0]} alt="" className="thumb" width="48" height="48" />
                      <div>
                        <Link to={`/shop/${p.slug}`} target="_blank" rel="noopener noreferrer"><strong>{p.name}</strong></Link>
                        <div className="small muted">{p.brand} · {p.soldCount} sold · {p.ratingCount} reviews</div>
                      </div>
                    </div>
                  </td>
                  <td className="small">{p.category?.name}</td>
                  <td className="num">{money(p.priceCents)}</td>
                  <td><InventoryCell product={p} onSaved={replace} /></td>
                  <td>
                    {p.isActive ? <span className="badge badge-success">Active</span> : <span className="badge">Hidden</span>}
                    {p.featured && <span className="badge badge-gold" style={{ marginLeft: 4 }}>Featured</span>}
                  </td>
                  <td>
                    <div className="row" style={{ flexWrap: 'nowrap', gap: 4 }}>
                      <button type="button" className="icon-btn" onClick={() => setEditing(p)} aria-label={`Edit ${p.name}`}><IconEdit size={18} /></button>
                      <button type="button" className="icon-btn" onClick={() => remove(p)} aria-label={`Delete ${p.name}`}><IconTrash size={18} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        !list.loading && <EmptyState icon={IconBox} title="No products found">Try another search or add a product.</EmptyState>
      )}
      <Pagination page={page} pages={list.data?.pages} onChange={setPage} />

      {editing && (
        <ProductForm
          product={editing === 'new' ? null : editing}
          categories={cats.data.categories}
          onClose={() => setEditing(null)}
          onSaved={(p, created) => {
            setEditing(null);
            toast.success(created ? 'Product created.' : 'Product saved.');
            list.reload();
          }}
        />
      )}
    </div>
  );
}
