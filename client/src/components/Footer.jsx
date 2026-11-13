import { Link } from 'react-router-dom';
import { BUSINESS, WEEKDAYS } from '@shared/business.js';
import Logo from './Logo.jsx';
import NewsletterForm from './NewsletterForm.jsx';
import { IconInstagram, IconFacebook, IconTiktok, IconYoutube, IconPhone, IconMail, IconPin, IconLock, IconArrowUp } from './Icons.jsx';
import { formatMinutes } from '../utils/format.js';

/** Smooth-scroll to the top (instant for reduced-motion users) and move keyboard focus back to the top of the page. */
function scrollToTop() {
  const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
  document.querySelector('.site-header .logo')?.focus({ preventScroll: true });
}

const toMin = (hhmm) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

export function HoursList({ className = 'footer-hours' }) {
  const order = [1, 2, 3, 4, 5, 6, 0];
  return (
    <ul className={className}>
      {order.map((d) => {
        const h = BUSINESS.hours[d];
        return (
          <li key={d}>
            <span>{WEEKDAYS[d]}</span>
            <span>{h ? `${formatMinutes(toMin(h.open))} – ${formatMinutes(toMin(h.close))}` : 'Closed'}</span>
          </li>
        );
      })}
    </ul>
  );
}

export function SocialLinks() {
  const s = BUSINESS.social;
  return (
    <div className="social">
      <a href={s.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram (opens in a new tab)">
        <IconInstagram />
      </a>
      <a href={s.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook (opens in a new tab)">
        <IconFacebook />
      </a>
      <a href={s.tiktok} target="_blank" rel="noopener noreferrer" aria-label="TikTok (opens in a new tab)">
        <IconTiktok />
      </a>
      <a href={s.youtube} target="_blank" rel="noopener noreferrer" aria-label="YouTube (opens in a new tab)">
        <IconYoutube />
      </a>
    </div>
  );
}

export default function Footer() {
  const a = BUSINESS.address;
  return (
    <footer className="site-footer">
      <section className="footer-newsletter" aria-labelledby="newsletter-heading">
        <div className="container inner">
          <div>
            <h2 id="newsletter-heading">Join the Cece Circle</h2>
            <p>Styling tips, new arrivals and members-only offers — straight to your inbox.</p>
          </div>
          <NewsletterForm />
        </div>
      </section>
      <div className="container footer-main">
        <div>
          <Logo light />
          <p style={{ marginTop: 16, maxWidth: '34ch' }}>{BUSINESS.tagline} African-owned and proudly serving our community.</p>
          <SocialLinks />
        </div>
        <nav aria-label="Footer">
          <h3>Explore</h3>
          <ul>
            <li><Link to="/services">Braiding Services</Link></li>
            <li><Link to="/book">Book an Appointment</Link></li>
            <li><Link to="/shop">Beauty Supplies</Link></li>
            <li><Link to="/about">About Us</Link></li>
            <li><Link to="/faq">FAQ</Link></li>
            <li><Link to="/contact">Contact</Link></li>
          </ul>
        </nav>
        <div>
          <h3>Visit Us</h3>
          <ul>
            <li>
              <a href={BUSINESS.mapUrl} target="_blank" rel="noopener noreferrer" className="row" style={{ alignItems: 'flex-start', gap: 8, flexWrap: 'nowrap' }}>
                <IconPin size={18} />
                <span>
                  {a.line1}
                  <br />
                  {a.city}, {a.state} {a.postalCode}
                </span>
              </a>
            </li>
            <li>
              <a href={`tel:${BUSINESS.phoneHref}`} className="row" style={{ gap: 8 }}>
                <IconPhone size={18} /> {BUSINESS.phone}
              </a>
            </li>
            <li>
              <a href={`mailto:${BUSINESS.email}`} className="row" style={{ gap: 8 }}>
                <IconMail size={18} /> {BUSINESS.email}
              </a>
            </li>
          </ul>
        </div>
        <div>
          <h3>Hours</h3>
          <HoursList />
        </div>
      </div>
      <div className="container footer-bottom">
        <span className="footer-copy">© {new Date().getFullYear()} {BUSINESS.name}. All rights reserved.</span>
        <button type="button" className="back-to-top" onClick={scrollToTop} aria-label="Back to top">
          <IconArrowUp size={20} />
        </button>
        <ul className="footer-legal">
          <li><Link to="/privacy">Privacy Policy</Link></li>
          <li><Link to="/terms">Terms &amp; Conditions</Link></li>
          <li><Link to="/shipping-returns">Shipping &amp; Returns</Link></li>
          <li>
            <Link to="/admin/login" className="footer-admin-link">
              <IconLock size={14} /> Admin log in
            </Link>
          </li>
        </ul>
      </div>
    </footer>
  );
}
