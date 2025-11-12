// src/components/dashboard/Header/Notifications.tsx
import React, { forwardRef } from 'react';
import { BellIcon } from '../Sidebar/icons';

interface Notification {
  id: number;
  text: string;
  time: string;
  type: string;
}

interface NotificationsProps {
  notifications: Notification[];
  isOpen: boolean;
  onToggle: () => void;
}

export const Notifications = forwardRef<HTMLDivElement, NotificationsProps>(
  ({ notifications, isOpen, onToggle }, ref) => {
    return (
      <div className="relative" ref={ref}>
        <button 
          onClick={onToggle}
          className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <BellIcon className="w-5 h-5" />
          <span className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full">
            {notifications.length}
          </span>
        </button>

        {isOpen && (
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-200 py-2 z-50">
            <div className="px-4 py-2 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">Notificaciones</h3>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {notifications.map((notification) => (
                <div key={notification.id} className="px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0">
                  <p className="text-sm text-gray-900">{notification.text}</p>
                  <p className="text-xs text-gray-500 mt-1">{notification.time}</p>
                </div>
              ))}
            </div>
            <div className="px-4 py-2 border-t border-gray-200">
              <button className="w-full text-center text-sm text-blue-600 hover:text-blue-700 font-medium py-2">
                Ver todas las notificaciones
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }
);

Notifications.displayName = 'Notifications';