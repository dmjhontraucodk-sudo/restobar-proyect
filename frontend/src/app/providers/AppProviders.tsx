// frontend/src/app/providers/AppProviders.tsx
import React from 'react';
import { AuthProvider } from './AuthProvider';
import { CartProvider } from './CartProvider';

interface AppProvidersProps {
  children: React.ReactNode;
}

export const AppProviders: React.FC<AppProvidersProps> = ({ children }) => {
  return (
    <AuthProvider>
      <CartProvider>
        {/* Potentially other global providers here */}
        {children}
      </CartProvider>
    </AuthProvider>
  );
};
