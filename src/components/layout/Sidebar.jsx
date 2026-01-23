import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { signOutUser } from '../../store/slices/authSlice';
import ConfirmModal from '../ui/ConfirmModal';
import { 
  FiHome, 
  FiBook, 
  FiClock, 
  FiSettings, 
  FiLogOut, 
  FiPlusCircle, 
  FiUser,
  FiUsers,
  FiTag
} from 'react-icons/fi';
import '../../styles/components/_sidebar.scss';

const Sidebar = ({ isOpen, closeSidebar }) => {
  const { profile, user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [loginPromptOpen, setLoginPromptOpen] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);

  const handleLogoutClick = () => {
    setLogoutConfirmOpen(true);
  };

  const handleConfirmLogout = async () => {
    await dispatch(signOutUser());
    navigate('/login');
    setLogoutConfirmOpen(false);
  };

  const getInitials = (name) => {
    if (!name) return 'G';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const handleRestrictedLink = (e) => {
    if (!user) {
      e.preventDefault();
      setLoginPromptOpen(true);
    }
  };

  const handleConfirmLogin = () => {
    navigate('/login');
    setLoginPromptOpen(false);
  };

  const handleLinkClick = () => {
    if (closeSidebar) closeSidebar();
  };

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-header">
        <h2>Assesa</h2>
      </div>

      <nav className="sidebar-nav">
        <ul>
          <li>
            <NavLink 
              to="/dashboard" 
              end 
              className={({ isActive }) => isActive ? 'active' : ''}
              onClick={handleLinkClick}
            >
              <FiHome /> <span>Overview</span>
            </NavLink>
          </li>
          <li>
            <NavLink 
              to="/dashboard/profile" 
              className={({ isActive }) => isActive ? 'active' : ''}
              onClick={(e) => { handleRestrictedLink(e); handleLinkClick(); }}
            >
              <FiUser /> <span>My Profile</span>
            </NavLink>
          </li>
          
          {user && profile?.role === 'admin' ? (
            <>
              <li>
                <NavLink 
                  to="/dashboard/exams" 
                  className={({ isActive }) => isActive ? 'active' : ''}
                  onClick={handleLinkClick}
                >
                  <FiBook /> <span>Manage Exams</span>
                </NavLink>
              </li>
              <li>
                <NavLink 
                  to="/dashboard/create-exam" 
                  className={({ isActive }) => isActive ? 'active' : ''}
                  onClick={handleLinkClick}
                >
                  <FiPlusCircle /> <span>Create Exam</span>
                </NavLink>
              </li>
              <li>
                <NavLink 
                  to="/dashboard/categories" 
                  className={({ isActive }) => isActive ? 'active' : ''}
                  onClick={handleLinkClick}
                >
                  <FiTag /> <span>Categories</span>
                </NavLink>
              </li>
              <li>
                <NavLink 
                  to="/dashboard/users" 
                  className={({ isActive }) => isActive ? 'active' : ''}
                  onClick={handleLinkClick}
                >
                  <FiUsers /> <span>Manage Users</span>
                </NavLink>
              </li>
            </>
          ) : (
            <>
              <li>
                <NavLink 
                  to="/dashboard/available-exams" 
                  className={({ isActive }) => isActive ? 'active' : ''}
                  onClick={handleLinkClick}
                >
                  <FiBook /> <span>Available Exams</span>
                </NavLink>
              </li>
              <li>
                <NavLink 
                  to="/dashboard/history" 
                  className={({ isActive }) => isActive ? 'active' : ''}
                  onClick={(e) => { handleRestrictedLink(e); handleLinkClick(); }}
                >
                  <FiClock /> <span>My History</span>
                </NavLink>
              </li>
            </>
          )}
        </ul>
      </nav>

      <div className="sidebar-footer">
        {user ? (
          <div className="user-profile">
            <div className="user-avatar">
              {getInitials(profile?.full_name)}
            </div>
            <div className="user-info">
              <span className="user-name">{profile?.full_name || 'Guest User'}</span>
              <span className="user-role">{profile?.role || 'Guest'}</span>
            </div>
            <button className="logout-btn" onClick={handleLogoutClick} title="Logout">
              <FiLogOut /> <span>Logout</span>
            </button>
          </div>
        ) : (
          <div className="user-profile">
            <div className="user-info">
              <span className="user-name">Guest User</span>
            </div>
            <button className="logout-btn" onClick={() => navigate('/login')} title="Login">
              <FiLogOut className="login-icon" /> <span>Login</span>
            </button>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={loginPromptOpen}
        onClose={() => setLoginPromptOpen(false)}
        title="Login Required"
        message="You must be logged in to access this page. Do you want to go to the login page?"
        onConfirm={handleConfirmLogin}
        confirmText="Login"
      />

      <ConfirmModal
        isOpen={logoutConfirmOpen}
        onClose={() => setLogoutConfirmOpen(false)}
        title="Confirm Logout"
        message="Are you sure you want to log out?"
        onConfirm={handleConfirmLogout}
        confirmText="Logout"
        isDangerous={true}
      />
    </aside>
  );
};

export default Sidebar;
