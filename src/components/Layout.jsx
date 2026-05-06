import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Home, FileText, ArrowLeftRight, Target, BarChart2, User as UserIcon } from 'lucide-react';
import QRMenu from './QRMenu';

const Layout = ({ children }) => {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100vh', paddingBottom: '90px', background: 'var(--background)' }}>
      <main className="content-container page-transition">
        {children}
      </main>


      <nav className="bottom-nav">
        <NavLink to="/" className={({ isActive }) => `nav-btn ${isActive ? 'active' : ''}`} style={{ textDecoration: 'none' }}>
          <Home size={24} />
          <span>Home</span>
        </NavLink>

        <NavLink to="/analytics" className={({ isActive }) => `nav-btn ${isActive ? 'active' : ''}`} style={{ textDecoration: 'none' }}>
          <BarChart2 size={24} />
          <span>Insights</span>
        </NavLink>

        <QRMenu />

        <NavLink to="/transactions" className={({ isActive }) => `nav-btn ${isActive ? 'active' : ''}`} style={{ textDecoration: 'none' }}>
          <ArrowLeftRight size={24} />
          <span>Transfers</span>
        </NavLink>

        <NavLink to="/profile" className={({ isActive }) => `nav-btn ${isActive ? 'active' : ''}`} style={{ textDecoration: 'none' }}>
          <UserIcon size={24} />
          <span>Profile</span>
        </NavLink>
      </nav>
    </div>
  );
};

export default Layout;
