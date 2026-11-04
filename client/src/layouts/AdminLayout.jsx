import { Suspense, useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import Logo from '../components/Logo.jsx';
import Seo from '../components/Seo.jsx';
import { PageLoader } from '../components/ui.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import {
  IconChart,
  IconBox,
  IconGrid,
  IconBag,
  IconCalendar,
  IconScissors,
  IconUsers,
  IconStar,
  IconChat,
  IconMenu,
  IconClose,
  IconExternal,
  IconLogout,
} from '../components/Icons.jsx';

const NAV = [
  { to: '/admin', label: 'Dashboard', icon: IconChart, end: true },
  { to: '/admin/orders', label: 'Orders', icon: IconBag },
  { to: '/admin/appointments', label: 'Appointments', icon: IconCalendar },
  { to: '/admin/products', label: 'Products', icon: IconBox },
  { to: '/admin/categories', label: 'Categories', icon: IconGrid },
  { to: '/admin/services', label: 'Services', icon: IconScissors },
  { to: '/admin/customers', label: 'Customers', icon: IconUsers },
  { to: '/admin/reviews', label: 'Reviews', icon: IconStar },
  { to: '/admin/messages', label: 'Messages', icon: IconChat },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const navigate = useNavigate();
  useEffect(() => setOpen(false), [pathname]);

  return (
    <div className="admin-shell">
      <Seo title="Admin" noindex />
      <a href="#admin-main" className="skip-link">
        Skip to content
      </a>
      <aside className={`admin-sidebar${open ? ' open' : ''}`} aria-label="Admin navigation">
        <div className="admin-brand">
          <Logo light />
        </div>
        <nav>
          <ul>
            {NAV.map(({ to, label, icon: Icon, end }) => (
              <li key={to}>
                <NavLink to={to} end={end}>
                  <Icon size={18} /> {label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        <div className="admin-sidebar-foot">
          <Link to="/">
            <IconExternal size={16} /> View website
          </Link>
          <button
            type="button"
            onClick={async () => {
              await logout();
              navigate('/');
            }}
          >
            <IconLogout size={16} /> Log out
          </button>
        </div>
      </aside>
      {open && <div className="nav-overlay admin-overlay" onClick={() => setOpen(false)} aria-hidden="true" />}
      <div className="admin-content">
        <header className="admin-topbar">
          <button type="button" className="icon-btn admin-menu-btn" onClick={() => setOpen((v) => !v)} aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open}>
            {open ? <IconClose /> : <IconMenu />}
          </button>
          <span className="muted small">
            Signed in as <strong>{user?.name}</strong>
          </span>
        </header>
        <main id="admin-main" className="admin-main" tabIndex={-1}>
          <Suspense fallback={<PageLoader />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  );
}
