import { Link } from 'react-router-dom';
import { BOOKING_POLICY } from '@shared/business.js';
import Seo from '../components/Seo.jsx';
import ServiceCard from '../components/ServiceCard.jsx';
import { Alert, EmptyState } from '../components/ui.jsx';
import { IconScissors } from '../components/Icons.jsx';
import { useAsync } from '../hooks/useAsync.js';
import { servicesApi } from '../api/index.js';

export default function Services() {
  const { data, loading, error, reload } = useAsync(() => servicesApi.list(), []);
  const services = data?.services || [];

  return (
    <>
      <Seo
        title="Hair Braiding Services & Prices"
        description="Box braids, knotless braids, Senegalese & passion twists, goddess braids, cornrows, Fulani, crochet, feed-in and kids braiding. See starting prices and book online."
      />
      <header className="page-header">
        <div className="container">
          <span className="eyebrow">Services &amp; Pricing</span>
          <h1>Hair braiding services</h1>
          <p className="lead">
            Every style is installed by experienced braiders using premium, itch-free hair (included). Prices shown are starting prices for
            medium size, mid-back length.
          </p>
        </div>
      </header>

      <section className="section-sm">
        <div className="container">
          {error && <Alert type="error" onRetry={reload}>{error}</Alert>}
          <div className="grid grid-3">
            {loading && Array.from({ length: 6 }, (_, i) => <div key={i} className="skeleton" style={{ height: 460, borderRadius: 22 }} />)}
            {!loading && services.map((s) => <ServiceCard key={s._id} service={s} headingLevel={2} />)}
          </div>
          {!loading && !error && services.length === 0 && (
            <EmptyState icon={IconScissors} title="Services coming soon">
              Our service menu is being updated. Please call us to book in the meantime.
            </EmptyState>
          )}
        </div>
      </section>

      <section className="section-sm section-alt">
        <div className="container container-narrow text-center">
          <h2>Good to know before your visit</h2>
          <div className="grid grid-3 info-tiles" style={{ textAlign: 'left', marginTop: 24 }}>
            <div className="card card-pad">
              <h3>Arrive prepared</h3>
              <p className="muted small">Please come with hair washed, detangled and blow-dried. Wash &amp; blow-dry can be added for an extra fee.</p>
            </div>
            <div className="card card-pad">
              <h3>Flexible changes</h3>
              <p className="muted small">Cancel or reschedule online up to {BOOKING_POLICY.cancellationWindowHours} hours before your appointment.</p>
            </div>
            <div className="card card-pad">
              <h3>Custom quotes</h3>
              <p className="muted small">Extra-long, small or specialty-color styles may add to the price — we always confirm before we start.</p>
            </div>
          </div>
          <Link to="/book" className="btn btn-lg" style={{ marginTop: 32 }}>
            Book your appointment
          </Link>
        </div>
      </section>
    </>
  );
}
