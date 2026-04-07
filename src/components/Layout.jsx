import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { logout } from '../services/auth.service';
import { LayoutDashboard, Receipt, LogOut } from 'lucide-react';

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
  };

  return (
    <>
      <nav className="glass-panel" style={{ borderRadius: '0 0 16px 16px', borderTop: 'none', marginBottom: '2rem' }}>
        <div className="flex justify-between items-center w-full">
          <div className="flex items-center gap-3">
            <img src="https://bicnepal.edu.np/images/logo.svg" alt="Logo" style={{height: '32px', filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.2))'}} />
            <h2 style={{margin: 0}}><span className="text-accent">Expenser</span></h2>
          </div>
          <div className="nav-links flex items-center">
            <Link to="/" className={`nav-link flex items-center gap-2 ${location.pathname === '/' ? 'active' : ''}`}>
              <LayoutDashboard size={18} /> Dashboard
            </Link>
            <Link to="/expenses" className={`nav-link flex items-center gap-2 ${location.pathname === '/expenses' ? 'active' : ''}`}>
              <Receipt size={18} /> Expenses
            </Link>
            <button onClick={handleLogout} className="glass-button secondary icon-only ml-4 text-danger" title="Logout">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </nav>
      <main>
        <Outlet />
      </main>
    </>
  );
}
