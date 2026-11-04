import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Seo from '../components/Seo.jsx';
import ProductCard, { ProductCardSkeleton } from '../components/ProductCard.jsx';
import { Alert, EmptyState, Pagination } from '../components/ui.jsx';
import { IconSearch, IconFilter, IconClose } from '../components/Icons.jsx';
import { useAsync } from '../hooks/useAsync.js';
import { categoriesApi, productsApi } from '../api/index.js';

const SORTS = [
  ['featured', 'Featured'],
  ['best-selling', 'Best selling'],
  ['newest', 'Newest'],
  ['price-asc', 'Price: low to high'],
  ['price-desc', 'Price: high to low'],
  ['rating', 'Top rated'],
  ['name', 'Name A–Z'],
];

const PRICE_PRESETS = [
  ['', '', 'Any price'],
  ['', '15', 'Under $15'],
  ['15', '30', '$15 – $30'],
  ['30', '100', '$30 – $100'],
  ['100', '', '$100 & up'],
];

export default function Shop() {
  const [params, setParams] = useSearchParams();
  const q = params.get('q') || '';
  const category = params.get('category') || '';
  const sort = params.get('sort') || 'featured';
  const minPrice = params.get('minPrice') || '';
  const maxPrice = params.get('maxPrice') || '';
  const inStock = params.get('inStock') === 'true';
  const page = Number(params.get('page')) || 1;

  const [search, setSearch] = useState(q);
  const [filtersOpen, setFiltersOpen] = useState(false);
  useEffect(() => setSearch(q), [q]);

  const update = (changes, resetPage = true) => {
    const next = new URLSearchParams(params);
    Object.entries(changes).forEach(([k, v]) => (v === '' || v === false || v == null ? next.delete(k) : next.set(k, String(v))));
    if (resetPage) next.delete('page');
    setParams(next);
  };

  // Debounced search
  useEffect(() => {
    if (search === q) return undefined;
    const t = setTimeout(() => update({ q: search.trim() }), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const cats = useAsync(() => categoriesApi.list(), []);
  const products = useAsync(
    () =>
      productsApi.list({
        q: q || undefined,
        category: category || undefined,
        sort,
        minPrice: minPrice || undefined,
        maxPrice: maxPrice || undefined,
        inStock: inStock ? 'true' : undefined,
        page,
        limit: 12,
      }),
    [q, category, sort, minPrice, maxPrice, inStock, page]
  );

  const activeCat = cats.data?.categories.find((c) => c.slug === category);
  const hasFilters = q || category || minPrice || maxPrice || inStock;
  const total = products.data?.total ?? 0;

  return (
    <>
      <Seo
        title={activeCat ? `${activeCat.name} — Shop` : 'Beauty Supply Shop'}
        description="Shop braiding hair, human hair extensions, wigs, hair oils, edge control, shampoos and accessories from Cece African Hair Braiding."
      />
      <header className="page-header shop-header">
        <div className="container">
          <span className="eyebrow">Beauty Supply</span>
          <h1>{activeCat ? activeCat.name : 'Shop beauty supplies'}</h1>
          <p className="lead">{activeCat?.description || 'Salon-approved braiding hair, extensions and hair care — the same products our braiders trust.'}</p>
        </div>
      </header>

      <section className="section-sm">
        <div className="container shop-layout">
          <aside className={`shop-filters${filtersOpen ? ' open' : ''}`} aria-label="Product filters">
            <div className="filters-head">
              <h2 className="h-sm">Filters</h2>
              <button type="button" className="icon-btn filters-close" onClick={() => setFiltersOpen(false)} aria-label="Close filters">
                <IconClose />
              </button>
            </div>

            <div className="filter-block">
              <h3 className="filter-title">Category</h3>
              <ul className="filter-list">
                <li>
                  <button type="button" className={!category ? 'active' : ''} onClick={() => update({ category: '' })} aria-pressed={!category}>
                    All products
                  </button>
                </li>
                {cats.data?.categories.map((c) => (
                  <li key={c._id}>
                    <button type="button" className={category === c.slug ? 'active' : ''} aria-pressed={category === c.slug} onClick={() => update({ category: c.slug })}>
                      <span>{c.name}</span>
                      <span className="count">{c.productCount}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div className="filter-block">
              <h3 className="filter-title">Price</h3>
              <ul className="filter-list">
                {PRICE_PRESETS.map(([min, max, label]) => {
                  const active = min === minPrice && max === maxPrice;
                  return (
                    <li key={label}>
                      <button type="button" className={active ? 'active' : ''} aria-pressed={active} onClick={() => update({ minPrice: min, maxPrice: max })}>
                        {label}
                      </button>
                    </li>
                  );
                })}
              </ul>
              <div className="price-inputs">
                <label className="sr-only" htmlFor="minPrice">Minimum price</label>
                <input id="minPrice" className="input" type="number" min="0" inputMode="decimal" placeholder="Min $" defaultValue={minPrice} key={`min${minPrice}`} onBlur={(e) => e.target.value !== minPrice && update({ minPrice: e.target.value })} />
                <span aria-hidden="true">–</span>
                <label className="sr-only" htmlFor="maxPrice">Maximum price</label>
                <input id="maxPrice" className="input" type="number" min="0" inputMode="decimal" placeholder="Max $" defaultValue={maxPrice} key={`max${maxPrice}`} onBlur={(e) => e.target.value !== maxPrice && update({ maxPrice: e.target.value })} />
              </div>
            </div>

            <div className="filter-block">
              <label className="checkbox">
                <input type="checkbox" checked={inStock} onChange={(e) => update({ inStock: e.target.checked })} /> In stock only
              </label>
            </div>

            {hasFilters && (
              <button type="button" className="btn btn-outline btn-sm btn-block" onClick={() => setParams({})}>
                Clear all filters
              </button>
            )}
          </aside>
          {filtersOpen && <div className="nav-overlay filters-overlay" onClick={() => setFiltersOpen(false)} aria-hidden="true" />}

          <div className="shop-results">
            <div className="shop-toolbar">
              <div className="search-box">
                <IconSearch size={18} />
                <label htmlFor="shop-search" className="sr-only">Search products</label>
                <input id="shop-search" type="search" className="input" placeholder="Search hair, oils, edge control…" value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
              <button type="button" className="btn btn-outline btn-sm filters-toggle" onClick={() => setFiltersOpen(true)} aria-expanded={filtersOpen}>
                <IconFilter size={16} /> Filters
              </button>
              <div className="sort-box">
                <label htmlFor="sort" className="small muted">Sort by</label>
                <select id="sort" className="select" value={sort} onChange={(e) => update({ sort: e.target.value })}>
                  {SORTS.map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
              </div>
            </div>
            <p className="small muted" aria-live="polite" style={{ margin: '0 0 16px' }}>
              {products.loading ? 'Loading products…' : `${total} product${total === 1 ? '' : 's'}${q ? ` for “${q}”` : ''}`}
            </p>

            {products.error && <Alert type="error" onRetry={products.reload}>{products.error}</Alert>}

            <div className="grid product-grid">
              {products.loading
                ? Array.from({ length: 6 }, (_, i) => <ProductCardSkeleton key={i} />)
                : products.data?.products.map((p, i) => <ProductCard key={p._id} product={p} priority={i < 3} />)}
            </div>

            {!products.loading && !products.error && total === 0 && (
              <EmptyState
                icon={IconSearch}
                title="No products found"
                action={
                  <button type="button" className="btn btn-outline" onClick={() => setParams({})}>
                    Clear filters
                  </button>
                }
              >
                Try a different search term or remove some filters.
              </EmptyState>
            )}

            <Pagination
              page={page}
              pages={products.data?.pages}
              onChange={(p) => {
                update({ page: p }, false);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          </div>
        </div>
      </section>
    </>
  );
}
