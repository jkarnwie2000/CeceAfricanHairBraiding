import { Link } from 'react-router-dom';
import Seo from '../components/Seo.jsx';
import { EmptyState } from '../components/ui.jsx';
import { IconSearch } from '../components/Icons.jsx';

export default function NotFound() {
  return (
    <>
      <Seo title="Page Not Found" noindex />
      <section className="section">
        <EmptyState
          icon={IconSearch}
          title="We couldn't find that page"
          action={
            <div className="row" style={{ justifyContent: 'center' }}>
              <Link to="/" className="btn">Go home</Link>
              <Link to="/shop" className="btn btn-outline">Visit the shop</Link>
            </div>
          }
        >
          The page may have moved, or the link might be mistyped.
        </EmptyState>
      </section>
    </>
  );
}
