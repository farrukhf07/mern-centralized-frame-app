import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { isadmin } from '../utils/permissions';

const Navbar = () => {
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const admin = isadmin(user);

  if (!user) return null;

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const closeMenu = () => setIsMenuOpen(false);

  return (
    <nav className="global-navbar">
      <div className="container-fluid d-flex align-items-center justify-content-between py-2">
        <div className="d-flex align-items-center gap-4">
          <div className="navbar-brand" style={{ cursor: 'pointer' }}>
            <span className="brand-dot"></span>
            <span className="brand-text">Centerlized Data</span>
          </div>

          <div className={`navbar-tabs d-flex gap-2 ${isMenuOpen ? 'mobile-show' : ''}`}>
            <NavLink 
              to="/" 
              onClick={closeMenu}
              className={({ isActive }) => `btn-ghost ${isActive ? 'active' : ''}`}
            >
              Applications
            </NavLink>
            {admin && (
              <NavLink 
                to="/central-data" 
                onClick={closeMenu}
                className={({ isActive }) => `btn-ghost ${isActive ? 'active' : ''}`}
              >
                Central Data
              </NavLink>
            )}
            {admin && (
              <NavLink 
                to="/users" 
                onClick={closeMenu}
                className={({ isActive }) => `btn-ghost ${isActive ? 'active' : ''}`}
              >
                Manage Users
              </NavLink>
            )}
            <NavLink 
              to="/contactUs" 
              onClick={closeMenu}
              className={({ isActive }) => `btn-ghost ${isActive ? 'active' : ''}`}
            >
              Contact Us
            </NavLink>
          </div>
        </div>

        <div className="navbar-actions d-flex align-items-center gap-3">
          <div className="user-profile d-flex align-items-center gap-2">
            <div className="user-avatar">
              {user.name?.charAt(0).toUpperCase()}
            </div>
            <div className="user-info d-none d-sm-block">
              <div className="user-name">{user.name}</div>
              <div className="user-role">{user.role}</div>
            </div>
          </div>
          
          <div className="d-flex align-items-center gap-2">
            <button className="btn-ghost d-none d-md-flex" onClick={logout} style={{ fontSize: '0.75rem' }}>
              Logout
            </button>
            
            <button 
              className={`mobile-toggle d-md-none ${isMenuOpen ? 'open' : ''}`} 
              onClick={toggleMenu}
              aria-label="Toggle menu"
            >
              <span></span>
              <span></span>
              <span></span>
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile menu logout (visible only when menu is open on mobile) */}
      {isMenuOpen && (
        <div className="mobile-menu-footer d-md-none p-3 border-top border-glass">
          <button className="btn-accent w-100" onClick={() => { logout(); closeMenu(); }}>
            Logout
          </button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;

