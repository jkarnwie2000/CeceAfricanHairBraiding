import { useState } from 'react';
import { money, formatDateShort } from '../../utils/format.js';

/**
 * Daily revenue — single series bar chart (one hue, no legend; the title names it).
 * Hover/focus a bar for its tooltip. A visually hidden table carries the same data for screen readers.
 */
export default function SalesChart({ series }) {
  const [active, setActive] = useState(null);
  const W = 720;
  const H = 220;
  const pad = { t: 12, r: 8, b: 26, l: 52 };
  const innerW = W - pad.l - pad.r;
  const innerH = H - pad.t - pad.b;
  const max = Math.max(...series.map((s) => s.revenueCents), 1);
  const nice = Math.max(niceMax(max), 10000); // at least a $100 scale so axis labels never repeat
  const slot = innerW / series.length;
  const barW = Math.max(3, slot - 2); // 2px surface gap between bars
  const ticks = [0, 0.5, 1].map((f) => Math.round(nice * f));
  const y = (v) => pad.t + innerH - (v / nice) * innerH;
  const a = active != null ? series[active] : null;

  const empty = series.every((s) => s.revenueCents === 0);

  return (
    <div className="sales-chart">
      {empty && <p className="small muted" style={{ margin: '8px 0 0' }}>No paid orders in the last 30 days yet — sales will appear here automatically.</p>}
      <div className="chart-svg-wrap" onMouseLeave={() => setActive(null)}>
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Daily revenue over the last 30 days" preserveAspectRatio="none">
          {ticks.map((t) => (
            <g key={t}>
              <line x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} className="chart-grid" />
              <text x={pad.l - 8} y={y(t) + 4} textAnchor="end" className="chart-axis">
                {t === 0 ? '$0' : `$${Math.round(t / 100).toLocaleString()}`}
              </text>
            </g>
          ))}
          {series.map((s, i) => {
            const h = (s.revenueCents / nice) * innerH;
            const x = pad.l + i * slot + 1;
            const r = Math.min(4, barW / 2, h);
            return (
              <g key={s.date}>
                {h > 0 && (
                  <path
                    d={`M${x},${pad.t + innerH} V${pad.t + innerH - h + r} Q${x},${pad.t + innerH - h} ${x + r},${pad.t + innerH - h} H${x + barW - r} Q${x + barW},${pad.t + innerH - h} ${x + barW},${pad.t + innerH - h + r} V${pad.t + innerH} Z`}
                    className={`chart-bar${active === i ? ' active' : ''}`}
                  />
                )}
                {/* Hit target larger than the mark */}
                <rect
                  x={pad.l + i * slot}
                  y={pad.t}
                  width={slot}
                  height={innerH}
                  fill="transparent"
                  tabIndex={0}
                  aria-label={`${formatDateShort(s.date)}: ${money(s.revenueCents)}, ${s.orders} orders`}
                  onMouseEnter={() => setActive(i)}
                  onFocus={() => setActive(i)}
                  onBlur={() => setActive(null)}
                />
              </g>
            );
          })}
          {[0, Math.floor(series.length / 2), series.length - 1].map((i) => (
            <text key={i} x={pad.l + i * slot + slot / 2} y={H - 6} textAnchor="middle" className="chart-axis">
              {formatDateShort(series[i].date).replace(/^\w+, /, '')}
            </text>
          ))}
        </svg>
        {a && (
          <div className="chart-tooltip" style={{ left: `${Math.min(88, Math.max(12, ((pad.l + active * slot + slot / 2) / W) * 100))}%` }} role="status">
            <strong>{money(a.revenueCents)}</strong>
            <span>
              {formatDateShort(a.date)} · {a.orders} order{a.orders === 1 ? '' : 's'}
            </span>
          </div>
        )}
      </div>
      <table className="sr-only">
        <caption>Daily revenue, last 30 days</caption>
        <thead>
          <tr><th>Date</th><th>Revenue</th><th>Orders</th></tr>
        </thead>
        <tbody>
          {series.map((s) => (
            <tr key={s.date}><td>{s.date}</td><td>{money(s.revenueCents)}</td><td>{s.orders}</td></tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function niceMax(v) {
  const exp = 10 ** Math.floor(Math.log10(v));
  const n = v / exp;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * exp;
}
