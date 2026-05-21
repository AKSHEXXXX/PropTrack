import React, { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../../api/axios';
import { 
  LayoutDashboard, 
  Building, 
  Filter, 
  Calendar, 
  Handshake, 
  Users, 
  UserSquare2 
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { token, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [leadsCount, setLeadsCount] = useState<number>(0);

  useEffect(() => {
    if (!loading && !token) {
      navigate('/login');
    }
  }, [token, loading, navigate]);

  useEffect(() => {
    const fetchSummary = async () => {
      if (token) {
        try {
          const res = await api.get('/dashboard/summary');
          if (res && res.data) {
            setLeadsCount(Number(res.data.activeLeads || 0));
          }
        } catch (e) {
          console.error('Failed to fetch sidebar leads count', e);
        }
      }
    };
    fetchSummary();
  }, [token]);

  if (loading || !token) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        width: '100vw',
        background: '#F4F6F4'
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px'
        }}>
          <div style={{
            fontSize: '1.5rem',
            fontWeight: 700,
            color: '#1A3C2E',
            animation: 'pulse 1.5s infinite ease-in-out'
          }}>
            PropTrack
          </div>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            border: '3px solid #E8F5EE',
            borderTopColor: '#1A3C2E',
            animation: 'spin 1s linear infinite'
          }}></div>
          <style>{`
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </div>
    );
  }

  const mobileTabs = [
    { name: 'Home', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Properties', path: '/properties', icon: Building },
    { name: 'Leads', path: '/leads', icon: Filter },
    { name: 'Deals', path: '/deals', icon: Handshake },
    { name: 'Clients', path: '/clients', icon: Users },
  ];

  return (
    <div className="app-container">
      <Sidebar leadsCount={leadsCount} />
      
      <div className="main-content-wrapper">
        <TopBar />
        <main className="page-content">
          {children}
        </main>
      </div>

      {/* Bottom navbar for mobile viewport (<768px) */}
      <div className="bottom-navbar">
        {mobileTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = location.pathname.startsWith(tab.path);
          return (
            <div
              key={tab.name}
              className={`bottom-nav-item ${isActive ? 'active' : ''}`}
              onClick={() => navigate(tab.path)}
              style={{ cursor: 'pointer' }}
            >
              <Icon className="bottom-nav-item-icon" />
              <span>{tab.name}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
