import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Building, 
  Filter, 
  Calendar, 
  Handshake, 
  Users, 
  UserSquare2, 
  Tag, 
  Settings, 
  HelpCircle, 
  LogOut,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Avatar } from '../ui/Avatar';

interface SidebarProps {
  leadsCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({ leadsCount }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user } = useAuth();

  const menuItems = [
    { name: 'Home', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Properties', path: '/properties', icon: Building },
    { name: 'Leads', path: '/leads', icon: Filter, badge: leadsCount },
    { name: 'Appointments', path: '/appointments', icon: Calendar },
    { name: 'Deals', path: '/deals', icon: Handshake },
    { name: 'Clients', path: '/clients', icon: Users },
    { name: 'Agents', path: '/agents', icon: UserSquare2 },
  ];

  const generalItems = [
    { name: 'Settings', path: '/settings', icon: Settings },
    { name: 'Help', path: '/help', icon: HelpCircle },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-logo-container" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
        <div className="sidebar-logo-circle">
          <Building size={18} />
        </div>
        <span className="sidebar-logo-text">PropTrack</span>
      </div>

      <nav className="sidebar-nav">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname.startsWith(item.path);
          return (
            <div
              key={item.name}
              className={`sidebar-item ${isActive ? 'active' : ''}`}
              onClick={() => navigate(item.path)}
            >
              <div className="sidebar-item-left">
                <Icon className="sidebar-item-icon" />
                <span className="sidebar-item-text">{item.name}</span>
              </div>
              {item.badge !== undefined && item.badge > 0 && (
                <span className="sidebar-badge">{item.badge}</span>
              )}
            </div>
          );
        })}
      </nav>

      <nav className="sidebar-nav" style={{ marginTop: '32px' }}>
        {generalItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname.startsWith(item.path);
          return (
            <div
              key={item.name}
              className={`sidebar-item ${isActive ? 'active' : ''}`}
              onClick={() => navigate(item.path)}
            >
              <div className="sidebar-item-left">
                <Icon className="sidebar-item-icon" />
                <span className="sidebar-item-text">{item.name}</span>
              </div>
            </div>
          );
        })}
      </nav>

      <nav className="sidebar-nav" style={{ marginTop: 'auto', marginBottom: '12px' }}>
        <div className="sidebar-item" onClick={handleLogout}>
          <div className="sidebar-item-left">
            <LogOut className="sidebar-item-icon" />
            <span className="sidebar-item-text">Logout</span>
          </div>
        </div>
      </nav>

      <div className="sidebar-account-section" style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', borderRadius: '12px', backgroundColor: '#F9FAFB' }}>
        <Avatar name={user?.email ? user.email.split('@')[0] : 'Totok Michael'} size="md" />
        <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <span style={{ fontWeight: 600, color: '#1A3C2E', fontSize: '0.875rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', textTransform: 'capitalize' }}>
            {user?.email ? user.email.split('@')[0].replace('.', ' ') : 'Totok Michael'}
          </span>
          <span style={{ fontSize: '0.75rem', color: '#6B7280', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
            {user?.email || 'tmichael20@mail.com'}
          </span>
        </div>
      </div>
    </aside>
  );
};
