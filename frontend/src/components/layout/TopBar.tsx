import React from 'react';
import { Search, Mail, Bell } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Avatar } from '../ui/Avatar';

interface TopBarProps {
  searchVal?: string;
  setSearchVal?: (val: string) => void;
}

export const TopBar: React.FC<TopBarProps> = ({ searchVal = '', setSearchVal }) => {
  const { user } = useAuth();

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (setSearchVal) {
      setSearchVal(e.target.value);
    }
  };

  return (
    <header className="topbar">
      <div className="topbar-search-container">
        <Search size={18} className="text-secondary" />
        <input 
          type="text" 
          placeholder="Search properties, clients, leads..." 
          className="topbar-search-input"
          value={searchVal}
          onChange={handleSearchChange}
        />
        <span className="topbar-search-shortcut">⌘K</span>
      </div>

      <div className="topbar-right">
        <button className="topbar-icon-button" onClick={() => alert('No new messages')}>
          <Mail size={18} />
          <span className="topbar-badge-dot"></span>
        </button>

        <button className="topbar-icon-button" onClick={() => alert('No new notifications')}>
          <Bell size={18} />
          <span className="topbar-badge-dot"></span>
        </button>

        <div className="topbar-user-section">
          {user && (
            <>
              <Avatar name={user.email.split('@')[0]} size="sm" />
              <div className="topbar-user-info">
                <span className="topbar-user-name">
                  {user.email.split('@')[0].replace(/^\w/, (c) => c.toUpperCase())}
                </span>
                <span className="topbar-user-email">{user.email}</span>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
