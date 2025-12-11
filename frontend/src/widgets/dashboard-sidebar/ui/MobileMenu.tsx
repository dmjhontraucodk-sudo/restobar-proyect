// src/widgets/dashboard-sidebar/ui/MobileMenu.tsx
import React from 'react';
import { XIcon } from './icons';
import { NavigationContent } from './NavigationContent';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileMenu: React.FC<MobileMenuProps> = ({ isOpen, onClose }) => {
  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={onClose}
        ></div>
      )}
      
      {/* Menu Panel */}
      <div 
        className={`fixed inset-y-0 left-0 z-50 w-80 bg-white border-r border-gray-200 transform md:hidden transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <XIcon className="w-5 h-5" />
        </button>
        <div className="flex flex-col h-full">
          <NavigationContent isCollapsed={false} onLinkClick={onClose} />
        </div>
      </div>
    </>
  );
};
