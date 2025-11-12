// src/components/dashboard/Sidebar/SidebarLink.tsx
import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import type { JSX } from 'react';

interface SidebarLinkProps {
  to: string;
  icon: JSX.Element;
  label: string;
  isCollapsed: boolean;
  onClick?: () => void;
}

export const SidebarLink: React.FC<SidebarLinkProps> = ({ 
  to, 
  icon, 
  label, 
  isCollapsed, 
  onClick 
}) => {
  const location = useLocation();
  const isActive = location.pathname === to || (to !== "/dashboard" && location.pathname.startsWith(to));
  
  const activeClass = "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg";
  const inactiveClass = "text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition-all duration-200";

  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={`group relative flex items-center font-medium transition-all duration-300 ${
        isActive ? activeClass : inactiveClass
      } ${
        isCollapsed 
          ? 'justify-center p-2 mx-1 rounded-lg min-h-[40px] h-[40px]' // ✅ ALTURA FIJA
          : 'px-3 py-2 mx-2 rounded-xl'
      }`}
    >
      <div className="relative flex items-center justify-center w-5 h-5 flex-shrink-0">
        {React.cloneElement(icon, { 
          className: `shrink-0 transition-transform duration-200 ${
            isActive ? 'text-white' : 'text-current'
          }`
        })}
      </div>
      
      <span 
        className={`transition-all duration-300 font-medium ${
          isCollapsed ? 'opacity-0 w-0 ml-0' : 'opacity-100 w-auto ml-3'
        }`}
      >
        {label}
      </span>

      {/* Tooltip */}
      <div 
        className={`absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs font-medium rounded-lg shadow-xl opacity-0 transition-all duration-300 pointer-events-none z-50 whitespace-nowrap ${
          isCollapsed ? 'group-hover:opacity-100 group-hover:translate-x-0 -translate-x-2' : 'opacity-0'
        }`}
      >
        {label}
        <div className="absolute top-1/2 -left-1 w-2 h-2 bg-gray-900 transform -translate-y-1/2 rotate-45"></div>
      </div>
    </NavLink>
  );
};