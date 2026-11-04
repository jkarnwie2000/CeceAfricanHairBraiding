import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

const STORAGE_KEY = 'cece_cart_v1';
const CartContext = createContext(null);

function loadCart() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(parsed) ? parsed.filter((i) => i && i.productId && i.quantity > 0) : [];
  } catch {
    return [];
  }
}

/**
 * Cart lives in localStorage so it survives refreshes.
 * Prices stored here are for DISPLAY only — the server re-prices everything at checkout.
 * Item shape: { productId, slug, name, image, priceCents, quantity, inventory }
 */
export function CartProvider({ children }) {
  const [items, setItems] = useState(loadCart);
  const itemsRef = useRef(items);
  itemsRef.current = items;

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* storage full or disabled — cart still works for this session */
    }
  }, [items]);

  // Keep multiple tabs in sync
  useEffect(() => {
    const onStorage = (e) => e.key === STORAGE_KEY && setItems(loadCart());
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  /** Returns { added, quantity, limited } so callers can show a precise message. */
  const addItem = useCallback((product, quantity = 1) => {
    const current = itemsRef.current;
    const id = product._id || product.productId;
    const existing = current.find((i) => i.productId === id);
    const inventory = product.inventory ?? existing?.inventory ?? 99;
    const have = existing?.quantity || 0;
    const next = Math.min(have + quantity, inventory, 99);
    const result = { added: Math.max(0, next - have), quantity: next, limited: have + quantity > next };
    if (next <= 0 || next === have) return result;
    const line = {
      productId: id,
      slug: product.slug,
      name: product.name,
      image: product.images?.[0] || product.image || '',
      priceCents: product.priceCents,
      inventory,
      quantity: next,
    };
    const updated = existing ? current.map((i) => (i.productId === id ? line : i)) : [...current, line];
    itemsRef.current = updated;
    setItems(updated);
    return result;
  }, []);

  const updateQuantity = useCallback((productId, quantity) => {
    setItems((current) =>
      current
        .map((i) => (i.productId === productId ? { ...i, quantity: Math.max(0, Math.min(quantity, i.inventory ?? 99, 99)) } : i))
        .filter((i) => i.quantity > 0)
    );
  }, []);

  const removeItem = useCallback((productId) => setItems((c) => c.filter((i) => i.productId !== productId)), []);
  const clear = useCallback(() => setItems([]), []);

  /** Apply the server's authoritative quote: refresh prices/stock, clamp quantities, drop unavailable lines. */
  const applyQuote = useCallback((quote) => {
    const byId = new Map(quote.lines.map((l) => [l.productId, l]));
    setItems((current) => {
      const next = current
        .filter((i) => byId.has(i.productId))
        .map((i) => {
          const l = byId.get(i.productId);
          return { ...i, name: l.name, slug: l.slug, image: l.image, priceCents: l.priceCents, inventory: l.inventory, quantity: Math.min(i.quantity, l.inventory) };
        })
        .filter((i) => i.quantity > 0);
      const same =
        next.length === current.length &&
        next.every((n, k) => n.productId === current[k].productId && n.quantity === current[k].quantity && n.priceCents === current[k].priceCents && n.inventory === current[k].inventory);
      return same ? current : next;
    });
  }, []);

  const value = useMemo(() => {
    const count = items.reduce((s, i) => s + i.quantity, 0);
    const subtotalCents = items.reduce((s, i) => s + i.priceCents * i.quantity, 0);
    return {
      items,
      count,
      subtotalCents,
      addItem,
      updateQuantity,
      removeItem,
      clear,
      applyQuote,
      payload: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
    };
  }, [items, addItem, updateQuantity, removeItem, clear, applyQuote]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export const useCart = () => useContext(CartContext);
