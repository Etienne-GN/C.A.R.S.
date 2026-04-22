import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { getModules } from '../api/modules';
import type { ModuleInfo } from '../types/module';

const NAV = [
  { to: '/',        icon: '🏠', label: 'Garage'  },
  { to: '/modules', icon: '🧩', label: 'Modules' },
];

export default function Layout() {
  const [modules, setModules] = useState<ModuleInfo[]>([]);
  const location = useLocation();

  useEffect(() => {
    const ctrl = new AbortController();
    getModules(ctrl.signal).then(setModules).catch(() => setModules([]));
    return () => ctrl.abort();
  }, [location.pathname]);

  const activeModules = modules.filter((m) => m.is_enabled);

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

          {activeModules.length > 0 && (
            <>
              <div style={{ marginTop: '20px', padding: '8px 16px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-3, #777)' }}>
                Module
              </div>
              {activeModules.map((m) => (
                <NavLink
                  key={m.key}
                  to={m.route}
                  className={({ isActive }) => isActive ? 'active' : ''}
                >
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
    </div>
  );
}
