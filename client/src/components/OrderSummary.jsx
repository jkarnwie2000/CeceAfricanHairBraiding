import { money } from '../utils/format.js';

/** Totals block. `totals` comes from the server quote (authoritative). */
export default function OrderSummary({ lines, totals, loading, children, compact = false }) {
  return (
    <div className="order-summary card card-pad">
      <h2 className="h-sm">Order summary</h2>
      {!compact && lines?.length > 0 && (
        <ul className="summary-lines">
          {lines.map((l) => (
            <li key={l.productId}>
              <span className="summary-thumb">
                <img src={l.image} alt="" width="56" height="56" loading="lazy" />
                <span className="summary-qty" aria-label={`Quantity ${l.quantity}`}>{l.quantity}</span>
              </span>
              <span className="summary-name">
                {l.name}
                <span className="small muted">{money(l.priceCents)} each</span>
              </span>
              <span className="summary-amt">{money(l.priceCents * l.quantity)}</span>
            </li>
          ))}
        </ul>
      )}
      <dl className={`totals${loading ? ' is-loading' : ''}`} aria-busy={loading}>
        <div>
          <dt>Subtotal</dt>
          <dd>{totals ? money(totals.subtotalCents) : '—'}</dd>
        </div>
        <div>
          <dt>Shipping</dt>
          <dd>{totals ? (totals.shippingCents ? money(totals.shippingCents) : 'Free') : '—'}</dd>
        </div>
        <div>
          <dt>Estimated tax{totals ? ` (${+(totals.taxRate * 100).toFixed(2)}%)` : ''}</dt>
          <dd>{totals ? money(totals.taxCents) : '—'}</dd>
        </div>
        <div className="grand">
          <dt>Total</dt>
          <dd>{totals ? money(totals.totalCents) : '—'}</dd>
        </div>
      </dl>
      {totals && totals.shippingCents > 0 && (
        <p className="small muted free-ship">
          Add <strong>{money(totals.freeShippingThresholdCents - totals.subtotalCents)}</strong> more for free shipping.
        </p>
      )}
      {children}
    </div>
  );
}
