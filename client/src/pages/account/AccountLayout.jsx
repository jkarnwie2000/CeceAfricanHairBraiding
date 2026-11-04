import { NavLink, Outlet, Link } from 'react-router-dom';
import Seo from '../../components/Seo.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

export default function AccountLayout() {
  const { user, isAdmin } = useAuth();
  return (
    <>
      <Seo title="My Account" noindex />
      <header className="page-header">
        <div className="container row-between">
          <div>
            <span className="eyebrow">My account</span>
            <h1>Hello, {user.name.split(' ')[0]}</h1>
          </div>
          {isAdmin && <Link to="/admin" className="btn btn-outline">Open admin dashboard</Link>}
        </div>
      </header>
      <section className="section-sm">
        <div className="container">
          <nav className="tabs" aria-label="Account sections">
            <NavLink to="/account" end>Profile</NavLink>
            <NavLink to="/account/orders">Orders</NavLink>
            <NavLink to="/account/appointments">Appointments</NavLink>
          </nav>
          <Outlet />
        </div>
      </section>
    </>
  );
}
