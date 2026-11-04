import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Alert, EmptyState, PageLoader, Pagination, StarRating } from '../../components/ui.jsx';
import { IconStar, IconTrash } from '../../components/Icons.jsx';
import { useAsync } from '../../hooks/useAsync.js';
import { useToast } from '../../context/ToastContext.jsx';
import { adminApi } from '../../api/index.js';
import { getErrorMessage } from '../../api/http.js';
import { formatTimestamp } from '../../utils/format.js';

export default function Reviews() {
  const toast = useToast();
  const [page, setPage] = useState(1);
  const list = useAsync(() => adminApi.reviews({ page }), [page]);

  const toggle = async (r) => {
    try {
      await adminApi.setReviewApproval(r._id, !r.isApproved);
      toast.success(r.isApproved ? 'Review hidden from the shop.' : 'Review published.');
      list.reload();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };
  const remove = async (r) => {
    if (!window.confirm('Delete this review permanently?')) return;
    try {
      await adminApi.deleteReview(r._id);
      toast.success('Review deleted.');
      list.reload();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-head">
        <div>
          <h1>Customer reviews</h1>
          <p className="muted">Reviews publish immediately. Hide any that break your guidelines.</p>
        </div>
      </div>
      {list.error && <Alert type="error" onRetry={list.reload}>{list.error}</Alert>}
      {list.loading && !list.data ? (
        <PageLoader />
      ) : list.data?.reviews.length ? (
        <ul className="stack" style={{ listStyle: 'none', padding: 0 }}>
          {list.data.reviews.map((r) => (
            <li key={r._id} className={`panel review-admin${r.isApproved ? '' : ' is-hidden'}`}>
              <div className="row-between">
                <div className="row" style={{ gap: 8 }}>
                  <StarRating value={r.rating} size={14} />
                  <strong>{r.title || 'Untitled review'}</strong>
                  {!r.isApproved && <span className="badge">Hidden</span>}
                  {r.verifiedPurchase && <span className="badge badge-success">Verified</span>}
                </div>
                <span className="small muted">{formatTimestamp(r.createdAt)}</span>
              </div>
              <p style={{ margin: '8px 0' }}>{r.comment}</p>
              <div className="row-between small">
                <span className="muted">
                  {r.name} on {r.product ? <Link to={`/shop/${r.product.slug}`}>{r.product.name}</Link> : 'a deleted product'}
                </span>
                <div className="row" style={{ gap: 8 }}>
                  <button type="button" className="btn btn-outline btn-sm" onClick={() => toggle(r)}>{r.isApproved ? 'Hide' : 'Publish'}</button>
                  <button type="button" className="icon-btn" onClick={() => remove(r)} aria-label="Delete review"><IconTrash size={18} /></button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        !list.loading && <EmptyState icon={IconStar} title="No reviews yet">Reviews from customers will appear here.</EmptyState>
      )}
      <Pagination page={page} pages={list.data?.pages} onChange={setPage} />
    </div>
  );
}
