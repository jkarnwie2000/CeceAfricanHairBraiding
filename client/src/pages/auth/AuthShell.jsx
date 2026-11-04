import Seo from '../../components/Seo.jsx';

export default function AuthShell({ title, subtitle, children, seoTitle }) {
  return (
    <>
      <Seo title={seoTitle || title} noindex />
      <section className="auth-section">
        <div className="auth-card card">
          <div className="auth-art" aria-hidden="true">
            <img src="/images/site/portrait-wrap.webp" alt="" width="450" height="677" />
          </div>
          <div className="auth-body">
            <div className="ornament ornament-left" aria-hidden="true" />
            <h1>{title}</h1>
            {subtitle && <p className="muted">{subtitle}</p>}
            {children}
          </div>
        </div>
      </section>
    </>
  );
}
