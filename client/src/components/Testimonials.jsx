import { testimonials } from '../data/content.js';
import { StarRating } from './ui.jsx';

export default function Testimonials() {
  return (
    <div className="testimonials">
      {testimonials.map((t) => (
        <figure className="testimonial" key={t.name}>
          <StarRating value={t.rating} size={16} />
          <blockquote>“{t.quote}”</blockquote>
          <figcaption>
            <strong>{t.name}</strong>
            <span>{t.service}</span>
          </figcaption>
        </figure>
      ))}
    </div>
  );
}
