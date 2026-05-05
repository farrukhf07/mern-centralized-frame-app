import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { isadmin } from '../utils/permissions';

const Navbar = () => {
  const { user, logout } = useAuth();
  const admin = isadmin(user);

  if (!user) return null;

  return (
    <nav className="global-navbar">
      <div className="container-fluid d-flex align-items-center justify-content-between py-2">
        <div className="d-flex align-items-center gap-4">
          <div className="navbar-brand" style={{ cursor: 'pointer' }}>
            <span className="brand-dot"></span>
            <span className="brand-text">Centerlized Data</span>
          </div>

          <div className="navbar-tabs d-flex gap-2">
            <NavLink 
              to="/" 
              className={({ isActive }) => `btn-ghost ${isActive ? 'active' : ''}`}
            >
              Applications
            </NavLink>
            {admin && (
              <NavLink 
                to="/central-data" 
                className={({ isActive }) => `btn-ghost ${isActive ? 'active' : ''}`}
              >
                Central Data
              </NavLink>
            )}
            {admin && (
              <NavLink 
                to="/users" 
                className={({ isActive }) => `btn-ghost ${isActive ? 'active' : ''}`}
              >
                Manage Users
              </NavLink>
            )}
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
          <button className="btn-ghost" onClick={logout} style={{ fontSize: '0.75rem' }}>
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
