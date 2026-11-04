import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import Logo from './Logo.jsx';
import { useCart } from '../context/CartContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { IconBag, IconUser, IconMenu, IconClose } from './Icons.jsx';

const LINKS = [
  { to: '/services', label: 'Services' },
  { to: '/shop', label: 'Shop' },
  { to: '/about', label: 'About' },
  { to: '/faq', label: 'FAQ' },
  { to: '/contact', label: 'Contact' },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { count } = useCart();
  const { user, isAdmin, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const menuRef = useRef(null);

  useEffect(() => {
    setOpen(false);
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    const onKey = (e) => e.key === 'Escape' && (setOpen(false), setMenuOpen(false));
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  useEffect(() => {
    if (!menuOpen) return;
    const onClick = (e) => !menuRef.current?.contains(e.target) && setMenuOpen(false);
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [menuOpen]);

  const doLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <header className={`site-header${scrolled ? ' scrolled' : ''}`}>
      <div className="container header-inner">
        <Logo />
        <nav className={`main-nav${open ? ' open' : ''}`} aria-label="Main" id="main-nav">
          <ul>
            <li className="mobile-only">
              <NavLink to="/" end>
                Home
              </NavLink>
            </li>
            {LINKS.map((l) => (
              <li key={l.to}>
                <NavLink to={l.to}>{l.label}</NavLink>
              </li>
            ))}
            <li className="mobile-only">
              <NavLink to="/book">Book an Appointment</NavLink>
            </li>
            <li className="mobile-only">
              <NavLink to={user ? '/account' : '/login'}>{user ? 'My Account' : 'Log in / Register'}</NavLink>
            </li>
            {isAdmin && (
              <li className="mobile-only">
                <NavLink to="/admin">Admin Dashboard</NavLink>
              </li>
            )}
          </ul>
        </nav>
        {open && <div className="nav-overlay" onClick={() => setOpen(false)} aria-hidden="true" />}

        <div className="header-actions">
          <div className="account-menu" ref={menuRef}>
            {user ? (
              <>
                <button
                  type="button"
                  className="icon-btn"
                  aria-haspopup="menu"
                  aria-expanded={menuOpen}
                  aria-label="Account menu"
                  onClick={() => setMenuOpen((v) => !v)}
                >
                  <IconUser />
                </button>
                {menuOpen && (
                  <div className="dropdown" role="menu">
                    <div className="who">
                      <strong>{user.name}</strong>
                      <span className="muted">{user.email}</span>
                    </div>
                    {isAdmin && (
                      <Link role="menuitem" to="/admin">
                        Admin dashboard
                      </Link>
                    )}
                    <Link role="menuitem" to="/account">
                      My profile
                    </Link>
                    <Link role="menuitem" to="/account/orders">
                      Orders
                    </Link>
                    <Link role="menuitem" to="/account/appointments">
                      Appointments
                    </Link>
                    <button role="menuitem" type="button" onClick={doLogout}>
                      Log out
                    </button>
                  </div>
                )}
              </>
            ) : (
              <Link to="/login" className="icon-btn" aria-label="Log in">
                <IconUser />
              </Link>
            )}
          </div>
          <Link to="/cart" className="icon-btn" aria-label={`Shopping cart, ${count} item${count === 1 ? '' : 's'}`}>
            <IconBag />
            {count > 0 && (
              <span className="cart-count" aria-hidden="true">
                {count > 99 ? '99+' : count}
              </span>
            )}
          </Link>
          <Link to="/book" className="btn btn-sm header-cta">
            Book Now
          </Link>
          <button
            type="button"
            className="icon-btn menu-toggle"
            aria-expanded={open}
            aria-controls="main-nav"
            aria-label={open ? 'Close menu' : 'Open menu'}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <IconClose /> : <IconMenu />}
          </button>
        </div>
      </div>
    </header>
  );
}
