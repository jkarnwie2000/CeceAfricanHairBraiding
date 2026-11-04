import { Link } from 'react-router-dom';
import Seo from '../components/Seo.jsx';
import { faqs } from '../data/content.js';

export default function Faq() {
  return (
    <>
      <Seo title="Frequently Asked Questions" description="Answers about booking, braiding prices, cancellations, shipping, returns and secure checkout at Cece African Hair Braiding." />
      <header className="page-header">
        <div className="container">
          <span className="eyebrow">Help center</span>
          <h1>Frequently asked questions</h1>
          <p className="lead">Everything you need to know about appointments and orders.</p>
        </div>
      </header>
      <section className="section-sm">
        <div className="container container-narrow">
          {faqs.map((group) => (
            <div key={group.category} className="faq-group">
              <h2>{group.category}</h2>
              {group.items.map((f) => (
                <details key={f.q} className="faq">
                  <summary>{f.q}</summary>
                  <p>{f.a}</p>
                </details>
              ))}
            </div>
          ))}
          <div className="panel text-center" style={{ marginTop: 40 }}>
            <h2 className="h-sm">Still have questions?</h2>
            <p className="muted">We&apos;re happy to help.</p>
            <Link to="/contact" className="btn">Contact us</Link>
          </div>
        </div>
      </section>
    </>
  );
}
