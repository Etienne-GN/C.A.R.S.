import { NavLink, Outlet } from 'react-router-dom';
import { useModules } from '../context/ModulesContext';

const NAV = [
  { to: '/',        icon: '🏠', label: 'Garage'  },
  { to: '/modules', icon: '🧩', label: 'Modules', end: true },
];

export default function Layout() {
  const { modules } = useModules();
  const activeModules = modules.filter((m) => m.is_enabled);
  const bottomNav = [
    ...NAV,
    ...activeModules.map((m) => ({ to: m.route, icon: m.icon, label: m.title, end: false })),
  ];

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-logo-title">C.A.R.S.</div>
          <div className="sidebar-logo-sub">Cars Archive of Repairs &amp; Services</div>
        </div>
        <nav className="sidebar-nav">
          {NAV.map(({ to, icon, label, end }) => (
            <NavLink key={to} to={to} end={end ?? false} className={({ isActive }) => isActive ? 'active' : ''}>
              <span className="nav-icon">{icon}</span>
              {label}
            </NavLink>
          ))}

          {activeModules.length > 0 && (
            <>
              <div style={{ marginTop: '20px', padding: '8px 16px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-3, #777)' }}>
                Module
              </div>
              {activeModules.map((m) => (
                <NavLink key={m.key} to={m.route} className={({ isActive }) => isActive ? 'active' : ''}>
                  <span className="nav-icon">{m.icon}</span>
                  {m.title}
                </NavLink>
              ))}
            </>
          )}
        </nav>
      </aside>

      <main className="main">
        <Outlet />
      </main>

      <nav className="bottom-nav">
        {bottomNav.map(({ to, icon, label, end }) => (
          <NavLink key={to} to={to} end={end ?? false} className={({ isActive }) => `bottom-nav-item${isActive ? ' active' : ''}`}>
            <span className="bottom-nav-icon">{icon}</span>
            <span className="bottom-nav-label">{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
