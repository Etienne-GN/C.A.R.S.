import { NavLink, Outlet } from 'react-router-dom';

const NAV = [
  { to: '/',            icon: '🏠', label: 'Dashboard'  },
  { to: '/cars/new',    icon: '➕', label: 'Add Car'     },
];

export default function Layout() {
  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-logo-title">C.A.R.S.</div>
          <div className="sidebar-logo-sub">Cars Archive of Repairs &amp; Services</div>
        </div>
        <nav className="sidebar-nav">
          {NAV.map(({ to, icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) => isActive ? 'active' : ''}
            >
              <span className="nav-icon">{icon}</span>
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}
