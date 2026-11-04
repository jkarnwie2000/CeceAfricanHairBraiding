import Seo from '../components/Seo.jsx';
import { legal } from '../data/content.js';

export default function LegalPage({ page }) {
  const doc = legal[page];
  return (
    <>
      <Seo title={doc.title} description={doc.description} />
      <header className="page-header">
        <div className="container">
          <h1>{doc.title}</h1>
          <p className="muted" style={{ margin: 0 }}>Last updated {doc.updated}</p>
        </div>
      </header>
      <section className="section-sm">
        <article className="container container-narrow prose">
          {doc.sections.map(([heading, text]) => (
            <section key={heading}>
              <h2>{heading}</h2>
              <p>{text}</p>
            </section>
          ))}
        </article>
      </section>
    </>
  );
}
