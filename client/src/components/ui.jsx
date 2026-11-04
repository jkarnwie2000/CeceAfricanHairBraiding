import { useEffect, useId, useRef } from 'react';
import { Link } from 'react-router-dom';
import { IconAlert, IconCheckCircle, IconInfo, IconClose, IconStar, IconMinus, IconPlus } from './Icons.jsx';

export function Spinner({ label = 'Loading', large = false }) {
  return <span className={`spinner${large ? ' spinner-lg' : ''}`} role="status" aria-label={label} />;
}

export function PageLoader({ label = 'Loading…' }) {
  return (
    <div className="page-loader">
      <Spinner large label={label} />
      <span>{label}</span>
    </div>
  );
}

const ALERT_ICON = { error: IconAlert, success: IconCheckCircle, warning: IconAlert, info: IconInfo };

export function Alert({ type = 'info', title, children, onRetry }) {
  const Icon = ALERT_ICON[type];
  return (
    <div className={`alert alert-${type}`} role={type === 'error' ? 'alert' : 'status'}>
      <Icon size={20} />
      <div>
        {title && <strong style={{ display: 'block' }}>{title}</strong>}
        {children}
        {onRetry && (
          <div style={{ marginTop: 8 }}>
            <button type="button" className="link-btn" onClick={onRetry}>
              Try again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export function EmptyState({ icon: Icon = IconInfo, title, children, action }) {
  return (
    <div className="empty-state">
      <div className="empty-icon">
        <Icon size={30} />
      </div>
      <h2>{title}</h2>
      {children && <p className="muted">{children}</p>}
      {action}
    </div>
  );
}

export function StarRating({ value = 0, size = 16, label }) {
  const filled = Math.round(value);
  return (
    <span className="stars" role="img" aria-label={label || `Rated ${value.toFixed(1)} out of 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <IconStar key={n} size={size} className={n <= filled ? '' : 'star-empty'} fill={n <= filled ? 'currentColor' : 'none'} />
      ))}
    </span>
  );
}

export function Rating({ average, count }) {
  if (!count) return <span className="rating-row">No reviews yet</span>;
  return (
    <span className="rating-row">
      <StarRating value={average} size={14} />
      <span>
        {average.toFixed(1)} ({count})
      </span>
    </span>
  );
}

export function QuantityStepper({ value, min = 1, max = 99, onChange, label = 'Quantity', disabled }) {
  return (
    <div className="qty" role="group" aria-label={label}>
      <button type="button" onClick={() => onChange(value - 1)} disabled={disabled || value <= min} aria-label="Decrease quantity">
        <IconMinus size={16} />
      </button>
      <output aria-live="polite" aria-label={`${label}: ${value}`}>
        {value}
      </output>
      <button type="button" onClick={() => onChange(value + 1)} disabled={disabled || value >= max} aria-label="Increase quantity">
        <IconPlus size={16} />
      </button>
    </div>
  );
}

export function Pagination({ page, pages, onChange }) {
  if (!pages || pages <= 1) return null;
  const nums = [];
  for (let i = Math.max(1, page - 2); i <= Math.min(pages, page + 2); i++) nums.push(i);
  return (
    <nav className="pagination" aria-label="Pagination">
      <button type="button" onClick={() => onChange(page - 1)} disabled={page <= 1} aria-label="Previous page">
        ‹
      </button>
      {nums.map((n) => (
        <button type="button" key={n} onClick={() => onChange(n)} aria-current={n === page ? 'page' : undefined}>
          {n}
        </button>
      ))}
      <button type="button" onClick={() => onChange(page + 1)} disabled={page >= pages} aria-label="Next page">
        ›
      </button>
    </nav>
  );
}

export function Breadcrumbs({ items }) {
  return (
    <nav className="breadcrumbs" aria-label="Breadcrumb">
      <ol>
        {items.map((it, i) => (
          <li key={i}>{it.to && i < items.length - 1 ? <Link to={it.to}>{it.label}</Link> : <span aria-current="page">{it.label}</span>}</li>
        ))}
      </ol>
    </nav>
  );
}

export function SectionHeading({ eyebrow, title, children, center = true, as: Tag = 'h2' }) {
  return (
    <div className={`section-head${center ? ' center' : ''}`}>
      <div className={`ornament ${center ? 'ornament-short' : 'ornament-left'}`} aria-hidden="true" />
      {eyebrow && <span className="eyebrow">{eyebrow}</span>}
      <Tag>{title}</Tag>
      {children && <p className="lead">{children}</p>}
    </div>
  );
}

/** Labeled form control with error + hint wiring for screen readers. */
export function Field({ label, error, hint, required, children, className = '', id: idProp }) {
  const autoId = useId();
  const id = idProp || autoId;
  const describedBy = [error && `${id}-err`, hint && `${id}-hint`].filter(Boolean).join(' ') || undefined;
  const child = typeof children === 'function' ? children({ id, 'aria-invalid': error ? 'true' : undefined, 'aria-describedby': describedBy, required }) : children;
  return (
    <div className={`field ${className}`}>
      {label && (
        <label htmlFor={id}>
          {label}
          {required && <span className="req" aria-hidden="true">*</span>}
        </label>
      )}
      {child}
      {hint && !error && (
        <span className="field-hint" id={`${id}-hint`}>
          {hint}
        </span>
      )}
      {error && (
        <span className="field-error" id={`${id}-err`}>
          {error}
        </span>
      )}
    </div>
  );
}

export function Modal({ title, onClose, children, footer, size }) {
  const ref = useRef(null);
  useEffect(() => {
    const prev = document.activeElement;
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    ref.current?.querySelector('input,select,textarea,button')?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      prev?.focus?.();
    };
  }, [onClose]);
  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`modal${size === 'lg' ? ' modal-lg' : ''}`} role="dialog" aria-modal="true" aria-label={title} ref={ref}>
        <div className="modal-head">
          <h2>{title}</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close dialog">
            <IconClose />
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>
  );
}

export function StatusBadge({ map, value }) {
  return <span className={`badge ${map[value] || ''}`}>{(value || '').replace(/_/g, ' ')}</span>;
}
