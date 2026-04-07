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
          <h2><span className="text-accent">Expense</span>Tracker</h2>
          <div className="nav-links flex items-center">
            <Link to="/" className={`nav-link flex items-center gap-2 ${location.pathname === '/' ? 'active' : ''}`}>
              <LayoutDashboard size={18} /> Dashboard
            </Link>
            <Link to="/expenses" className={`nav-link flex items-center gap-2 ${location.pathname === '/expenses' ? 'active' : ''}`}>
              <Receipt size={18} /> Transactions
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
