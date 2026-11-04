import { useEffect, useRef, useState } from 'react';
import { cartApi } from '../api/index.js';
import { getErrorMessage } from '../api/http.js';
import { useCart } from '../context/CartContext.jsx';

/**
 * Ask the server to price the cart (current prices, stock, tax, shipping) whenever it changes.
 * Applies corrections (price changes, stock limits, removed products) back to the cart.
 */
export function useCartQuote() {
  const { items, applyQuote } = useCart();
  const [state, setState] = useState({ quote: null, loading: true, error: null, notices: [] });
  const key = items.map((i) => `${i.productId}:${i.quantity}`).join('|');
  const run = useRef(0);

  useEffect(() => {
    if (!items.length) {
      setState({ quote: { lines: [], issues: [], totals: null }, loading: false, error: null, notices: [] });
      return undefined;
    }
    const id = ++run.current;
    setState((s) => ({ ...s, loading: true, error: null }));
    const t = setTimeout(async () => {
      try {
        const quote = await cartApi.quote(items.map((i) => ({ productId: i.productId, quantity: i.quantity })));
        if (id !== run.current) return;
        const notices = quote.issues.map((i) => i.message);
        items.forEach((i) => {
          const l = quote.lines.find((x) => x.productId === i.productId);
          if (l && l.priceCents !== i.priceCents) notices.push(`The price of ${l.name} has been updated.`);
        });
        applyQuote(quote);
        // Keep earlier notices visible: applying corrections triggers a clean re-quote right after.
        setState((s) => ({ quote, loading: false, error: null, notices: notices.length ? notices : s.notices }));
      } catch (err) {
        if (id === run.current) setState((s) => ({ ...s, loading: false, error: getErrorMessage(err) }));
      }
    }, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return state;
}
