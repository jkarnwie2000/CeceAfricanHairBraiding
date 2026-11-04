import { Link } from 'react-router-dom';
import { moneyShort, formatDuration } from '../utils/format.js';
import { IconClock, IconTag, IconArrowRight } from './Icons.jsx';

export default function ServiceCard({ service, headingLevel = 3 }) {
  const H = `h${headingLevel}`;
  return (
    <article className="service-card" id={service.slug}>
      <div className="media">
        <img src={service.image || '/images/services/box-braids.webp'} alt={service.imageAlt || service.name} loading="lazy" decoding="async" width="600" height="450" />
      </div>
      <div className="body">
        <H>{service.name}</H>
        <div className="meta">
          <span>
            <IconTag size={16} /> From <strong>{moneyShort(service.priceCents)}</strong>
          </span>
          <span>
            <IconClock size={16} /> <strong>{formatDuration(service.durationMinutes)}</strong>
          </span>
        </div>
        <p>{service.description}</p>
        <Link to={`/book?service=${service.slug}`} className="btn btn-outline btn-sm" aria-label={`Book now: ${service.name}`}>
          Book now <IconArrowRight size={16} />
        </Link>
      </div>
    </article>
  );
}
