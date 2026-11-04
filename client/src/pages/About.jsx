import { Link } from 'react-router-dom';
import Seo from '../components/Seo.jsx';
import Testimonials from '../components/Testimonials.jsx';
import { SectionHeading } from '../components/ui.jsx';
import { whyChooseUs } from '../data/content.js';

export default function About() {
  return (
    <>
      <Seo title="About Us" description="Meet Cece African Hair Braiding — an African-owned salon and beauty supply rooted in West African braiding traditions." />
      <header className="page-header">
        <div className="container">
          <span className="eyebrow">Our Story</span>
          <h1>Rooted in heritage, braided with love</h1>
          <p className="lead">An African-owned salon and beauty supply celebrating the artistry, history and beauty of African hair.</p>
        </div>
      </header>

      <section className="section">
        <div className="container split">
          <div className="split-media">
            <img src="/images/site/heritage.webp" alt="Portrait of a woman wearing a yellow head wrap and colorful African print" loading="lazy" width="1000" height="667" />
          </div>
          <div>
            <div className="ornament ornament-left" aria-hidden="true" />
            <h2>From our mothers&apos; hands to yours</h2>
            <p>
              Cece learned to braid as a little girl, sitting between her mother&apos;s knees on Saturday mornings — a tradition shared by
              generations of women across West Africa. Each part, each pattern, carried meaning: family, community, celebration.
            </p>
            <p>
              Cece African Hair Braiding was born from that tradition. Today our team of braiders brings the same patience and pride to every
              client, whether it&apos;s a first set of cornrows for a five-year-old or waist-length knotless braids for a wedding.
            </p>
            <p>
              We opened our beauty supply so clients could take home the very products we trust in the salon — gentle cleansers, nourishing
              oils and premium braiding hair — and keep their hair healthy between visits.
            </p>
          </div>
        </div>
      </section>

      <section className="section section-alt">
        <div className="container">
          <SectionHeading eyebrow="Our promise" title="What you can expect" />
          <div className="grid grid-4">
            {whyChooseUs.map((w) => (
              <div className="card card-pad" key={w.title}>
                <h3>{w.title}</h3>
                <p className="muted" style={{ margin: 0 }}>{w.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container split reverse">
          <div className="split-media">
            <img src="/images/site/salon-interior.webp" alt="Our bright, modern salon with styling chairs and shampoo stations" loading="lazy" width="1400" height="934" />
          </div>
          <div>
            <div className="ornament ornament-left" aria-hidden="true" />
            <h2>A space made for you</h2>
            <p>
              Long braiding sessions deserve comfort. Our salon is designed for relaxation, with comfortable chairs, good music, Wi-Fi, phone
              chargers and snacks for long sittings. Kids are always welcome.
            </p>
            <Link to="/book" className="btn">Book your visit</Link>
          </div>
        </div>
      </section>

      <section className="section section-dark">
        <div className="container">
          <SectionHeading eyebrow="Client love" title="Kind words from our community" />
          <Testimonials />
        </div>
      </section>
    </>
  );
}
