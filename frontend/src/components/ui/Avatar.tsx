import React from 'react';

interface AvatarProps {
  name: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({ name, size = 'md', className = '' }) => {
  const getInitials = (fullName: string) => {
    const parts = fullName.trim().split(/\s+/);
    if (parts.length === 0) return '?';
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const getBackgroundColorAndText = (fullName: string) => {
    const firstChar = fullName.trim().charAt(0).toUpperCase();
    if (!firstChar || firstChar < 'A' || firstChar > 'Z') {
      return { bg: '#2D6A4F', text: '#FFFFFF' };
    }
    
    if (firstChar >= 'A' && firstChar <= 'E') {
      return { bg: '#4CAF82', text: '#FFFFFF' };
    } else if (firstChar >= 'F' && firstChar <= 'J') {
      return { bg: '#2D6A4F', text: '#FFFFFF' };
    } else if (firstChar >= 'K' && firstChar <= 'O') {
      return { bg: '#1A3C2E', text: '#FFFFFF' };
    } else if (firstChar >= 'P' && firstChar <= 'T') {
      return { bg: '#81C784', text: '#FFFFFF' };
    } else {
      // U-Z
      return { bg: '#A5D6A7', text: '#1A3C2E' };
    }
  };

  const initials = getInitials(name);
  const colors = getBackgroundColorAndText(name);

  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-lg',
  };

  // Inline styling for precise color code matching
  const style = {
    backgroundColor: colors.bg,
    color: colors.text,
    display: 'flex',
    alignItems: 'center',
    justifycontent: 'center',
    fontWeight: 600,
    borderRadius: '50%',
    width: size === 'sm' ? '32px' : size === 'lg' ? '56px' : '40px',
    height: size === 'sm' ? '32px' : size === 'lg' ? '56px' : '40px',
    fontSize: size === 'sm' ? '12px' : size === 'lg' ? '20px' : '14px',
  };

  return (
    <div style={style} className={`avatar-initials ${className}`}>
      {initials}
    </div>
  );
};
