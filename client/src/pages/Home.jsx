import { Link } from 'react-router-dom';
import { BUSINESS } from '@shared/business.js';
import Seo from '../components/Seo.jsx';
import ServiceCard from '../components/ServiceCard.jsx';
import ProductCard, { ProductCardSkeleton } from '../components/ProductCard.jsx';
import Testimonials from '../components/Testimonials.jsx';
import { HoursList, SocialLinks } from '../components/Footer.jsx';
import { Alert, SectionHeading } from '../components/ui.jsx';
import { IconArrowRight, IconCalendar, IconBag, IconPhone, IconMail, IconPin, IconSparkle, IconShield, IconLeaf, IconClock } from '../components/Icons.jsx';
import { useAsync } from '../hooks/useAsync.js';
import { productsApi, servicesApi } from '../api/index.js';
import { whyChooseUs } from '../data/content.js';

const WHY_ICONS = [IconSparkle, IconLeaf, IconShield, IconClock];

export default function Home() {
  const services = useAsync(() => servicesApi.list(), []);
  const best = useAsync(() => productsApi.list({ sort: 'best-selling', limit: 4 }), []);
  const featuredServices = (services.data?.services || []).filter((s) => s.featured).slice(0, 6);
  const a = BUSINESS.address;

  return (
    <>
      <Seo
        title="African Hair Braiding Salon & Beauty Supply"
        description="Cece African Hair Braiding — expert box braids, knotless braids, twists, cornrows and kids braiding. Book online and shop premium braiding hair, oils and edge control."
      />

      {/* ── Hero ───────────────────────────────────────── */}
      <section className="hero">
        <div className="container hero-grid">
          <div className="hero-copy">
            <span className="eyebrow">African-owned · Braiding Salon & Beauty Supply</span>
            <h1>
              Braids crafted with <em>heritage</em>, care &amp; artistry.
            </h1>
            <p className="lead">
              From flawless knotless braids to Fulani styles and gentle kids&apos; cornrows, our master braiders celebrate the beauty of
              African hair — and our shop keeps it healthy between visits.
            </p>
            <div className="row hero-ctas">
              <Link to="/book" className="btn btn-lg">
                <IconCalendar size={18} /> Book an Appointment
              </Link>
              <Link to="/shop" className="btn btn-outline btn-lg">
                <IconBag size={18} /> Shop Beauty Supplies
              </Link>
            </div>
            <dl className="hero-stats">
              <div>
                <dt>Braiding styles</dt>
                <dd>10+</dd>
              </div>
              <div>
                <dt>Braiding hair</dt>
                <dd>Included</dd>
              </div>
              <div>
                <dt>Online booking</dt>
                <dd>24/7</dd>
              </div>
            </dl>
          </div>
          <div className="hero-media">
            <img
              src="/images/site/hero-900.webp"
              srcSet="/images/site/hero-480.webp 480w, /images/site/hero-900.webp 900w"
              sizes="(max-width: 860px) 380px, 460px"
              alt="Woman with long, neat box braids photographed against a soft background"
              width="700"
              height="1050"
              fetchPriority="high"
              decoding="async"
            />
            <div className="hero-badge">
              <span className="hero-badge-title">Now booking</span>
              <span>Knotless &amp; Boho braids</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Featured services ──────────────────────────── */}
      <section className="section" aria-labelledby="services-heading">
        <div className="container">
          <SectionHeading eyebrow="Our Services" title={<span id="services-heading">Signature braiding styles</span>}>
            Protective styles installed with precision, patience and respect for your natural hair.
          </SectionHeading>
          {services.error && <Alert type="error" onRetry={services.reload}>{services.error}</Alert>}
          <div className="grid grid-3">
            {services.loading
              ? Array.from({ length: 3 }, (_, i) => <div key={i} className="skeleton" style={{ height: 420, borderRadius: 22 }} />)
              : featuredServices.map((s) => <ServiceCard key={s._id} service={s} />)}
          </div>
          <div className="text-center" style={{ marginTop: 36 }}>
            <Link to="/services" className="btn btn-outline">
              View all services <IconArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Best sellers ───────────────────────────────── */}
      <section className="section section-alt" aria-labelledby="best-heading">
        <div className="container">
          <div className="row-between section-head">
            <div>
              <div className="ornament ornament-left" aria-hidden="true" />
              <span className="eyebrow">Beauty Supply</span>
              <h2 id="best-heading">Best-selling essentials</h2>
            </div>
            <Link to="/shop?sort=best-selling" className="btn btn-ghost">
              Shop all products <IconArrowRight size={16} />
            </Link>
          </div>
          {best.error && <Alert type="error" onRetry={best.reload}>{best.error}</Alert>}
          <div className="grid grid-4">
            {best.loading
              ? Array.from({ length: 4 }, (_, i) => <ProductCardSkeleton key={i} />)
              : best.data?.products.map((p) => <ProductCard key={p._id} product={p} />)}
          </div>
        </div>
      </section>

      {/* ── Why choose us ──────────────────────────────── */}
      <section className="section" aria-labelledby="why-heading">
        <div className="container why-grid">
          <div className="why-media">
            <img src="/images/site/salon-station.webp" alt="Bright salon styling station with a ring-light mirror" loading="lazy" width="600" height="850" />
          </div>
          <div>
            <div className="ornament ornament-left" aria-hidden="true" />
            <span className="eyebrow">Why Cece</span>
            <h2 id="why-heading">Why choose Cece African Hair Braiding</h2>
            <p className="lead">
              We are a family of braiders who grew up learning these traditions from our mothers and aunties. Every appointment is
              rooted in that same care.
            </p>
            <ul className="why-list">
              {whyChooseUs.map((w, i) => {
                const Icon = WHY_ICONS[i];
                return (
                  <li key={w.title}>
                    <span className="why-icon">
                      <Icon size={22} />
                    </span>
                    <div>
                      <h3>{w.title}</h3>
                      <p>{w.text}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </section>

      {/* ── Testimonials ───────────────────────────────── */}
      <section className="section section-dark" aria-labelledby="love-heading">
        <div className="container">
          <SectionHeading eyebrow="Client Love" title={<span id="love-heading">Words from our clients</span>} />
          <Testimonials />
        </div>
      </section>

      {/* ── Visit / contact ────────────────────────────── */}
      <section className="section" aria-labelledby="visit-heading">
        <div className="container visit-grid">
          <div>
            <div className="ornament ornament-left" aria-hidden="true" />
            <span className="eyebrow">Visit the salon</span>
            <h2 id="visit-heading">We can&apos;t wait to see you</h2>
            <ul className="contact-list">
              <li>
                <IconPin size={20} />
                <a href={BUSINESS.mapUrl} target="_blank" rel="noopener noreferrer">
                  {a.line1}, {a.city}, {a.state} {a.postalCode}
                </a>
              </li>
              <li>
                <IconPhone size={20} />
                <a href={`tel:${BUSINESS.phoneHref}`}>{BUSINESS.phone}</a>
              </li>
              <li>
                <IconMail size={20} />
                <a href={`mailto:${BUSINESS.email}`}>{BUSINESS.email}</a>
              </li>
            </ul>
            <SocialLinks />
            <div className="row" style={{ marginTop: 28 }}>
              <Link to="/book" className="btn">
                Book an Appointment
              </Link>
              <Link to="/contact" className="btn btn-ghost">
                Send us a message
              </Link>
            </div>
          </div>
          <div className="card card-pad hours-card">
            <h3>Business hours</h3>
            <HoursList className="hours-list" />
            <p className="small muted" style={{ marginTop: 16, marginBottom: 0 }}>
              Walk-ins welcome for cornrows and touch-ups when chairs are available. Long styles are by appointment.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
