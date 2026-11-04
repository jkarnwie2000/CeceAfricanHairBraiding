import { BUSINESS } from '@shared/business.js';

/**
 * Per-page <title> and meta tags. React 19 hoists these elements into <head> automatically.
 */
export default function Seo({ title, description, image, noindex = false }) {
  const fullTitle = title ? `${title} | ${BUSINESS.name}` : `${BUSINESS.name} | Braiding Salon & Beauty Supply`;
  const desc = description || BUSINESS.description;
  return (
    <>
      <title>{fullTitle}</title>
      <meta name="description" content={desc} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={desc} />
      {image && <meta property="og:image" content={image} />}
      {noindex && <meta name="robots" content="noindex" />}
    </>
  );
}
