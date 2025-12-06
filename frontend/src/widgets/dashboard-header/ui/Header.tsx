// src/widgets/dashboard-header/ui/Header.tsx
import React, { useRef, useState } from 'react';
import { UserMenu } from './UserMenu';
import { 
  MenuHamburgerIcon, 
  ChevronsLeftIcon,
} from '../../dashboard-sidebar/ui/icons';
import { type Location } from 'react-router-dom';
import { type User } from '@app/providers/AuthProvider';

interface HeaderProps {
  isPinned: boolean;
  onTogglePin: () => void;
  onMobileMenuOpen: () => void;
  location: Location;
  user: User;
  logout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  isPinned,
  onTogglePin,
  onMobileMenuOpen,
  location,
  user,
  logout
}) => {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  
  const profileMenuRef = useRef<HTMLDivElement>(null);

  return (
    <header className="w-full bg-white/80 backdrop-blur-lg border-b border-gray-200/60 shadow-sm shrink-0">
      <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
        
        {/* Lado Izquierdo */}
        <div className="flex items-center space-x-4">
          <button 
            onClick={onMobileMenuOpen}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors md:hidden"
          >
            <MenuHamburgerIcon className="w-5 h-5" />
          </button>
          
          <button 
            onClick={onTogglePin}
            className="hidden md:flex items-center p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            {isPinned ? <ChevronsLeftIcon className="w-5 h-5" /> : <MenuHamburgerIcon className="w-5 h-5" />}
          </button>

          {/* Breadcrumb */}
          <div className="hidden md:flex items-center space-x-2 text-sm text-gray-600">
            <span>Dashboard</span>
            <span>/</span>
            <span className="font-medium text-gray-900 capitalize">
              {location.pathname.split('/').pop()?.replace('-', ' ') || 'Principal'}
            </span>
          </div>
        </div>

        {/* Lado Derecho */}
        <div className="flex items-center space-x-3">

          {/* Menú de Usuario */}
          <UserMenu
            user={user}
            isOpen={isProfileMenuOpen}
            onToggle={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
            onLogout={logout}
            ref={profileMenuRef}
          />
        </div>
      </div>
    </header>
  );
};
