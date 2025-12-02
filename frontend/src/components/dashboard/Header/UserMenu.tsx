// src/components/dashboard/Header/UserMenu.tsx
import { forwardRef } from 'react';
import { Link } from 'react-router-dom';
import { UserCircleIcon, SettingsIcon, LogOutIcon } from '../Sidebar/icons';
import { type User } from '../../../context/AuthContext';

interface UserMenuProps {
  user: User;
  isOpen: boolean;
  onToggle: () => void;
  onLogout: () => void;
}

export const UserMenu = forwardRef<HTMLDivElement, UserMenuProps>(
  ({ user, isOpen, onToggle, onLogout }, ref) => {
    return (
      <div className="relative" ref={ref}>
        <button 
          onClick={onToggle}
          className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-sm">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </span>
          </div>
          <div className="hidden md:block text-left">
            <p className="text-sm font-medium text-gray-900">{user?.name || 'Usuario'}</p>
            <p className="text-xs text-gray-500">{user?.role || 'Rol'}</p>
          </div>
        </button>

        {isOpen && (
          <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-2xl border border-gray-200 py-2 z-50">
            <div className="px-4 py-3 border-b border-gray-200">
              <p className="text-sm font-medium text-gray-900">{user?.name || 'Usuario'}</p>
              <p className="text-sm text-gray-500">{user?.email || 'Email no disponible'}</p>
            </div>

            <Link
              to="/dashboard/profile"
              onClick={onToggle}
              className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <UserCircleIcon className="w-4 h-4 mr-3" />
              Mi Perfil
            </Link>

            {/* ✅ CAMBIAR A /dashboard/configuration */}
            <Link
              to="/dashboard/configuration"
              onClick={onToggle}
              className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <SettingsIcon className="w-4 h-4 mr-3" />
              Configuración
            </Link>

            <div className="border-t border-gray-200 mt-2"></div>

            <button
              onClick={() => {
                onToggle();
                onLogout();
              }}
              className="w-full flex items-center px-4 py-3 text-sm text-red-600 hover:bg-gray-50 transition-colors"
            >
              <LogOutIcon className="w-4 h-4 mr-3" />
              Cerrar Sesión
            </button>
          </div>
        )}
      </div>
    );
  }
);

UserMenu.displayName = 'UserMenu';