import { Suspense, useEffect, useRef } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { SHOP_POLICY } from '@shared/business.js';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';
import { PageLoader } from '../components/ui.jsx';

/** Scroll to top and move focus to <main> on navigation (keyboard & screen-reader friendly). */
function useRouteFocus(mainRef) {
  const { pathname } = useLocation();
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    window.scrollTo({ top: 0, behavior: 'instant' });
    mainRef.current?.focus({ preventScroll: true });
  }, [pathname, mainRef]);
}

export default function MainLayout() {
  const mainRef = useRef(null);
  useRouteFocus(mainRef);
  return (
    <>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <div className="announcement">
        Free shipping on beauty supply orders over ${SHOP_POLICY.freeShippingThreshold} · <Link to="/book">Book your next braids online</Link>
      </div>
      <Navbar />
      <main id="main" ref={mainRef} tabIndex={-1}>
        <Suspense fallback={<PageLoader />}>
          <Outlet />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
