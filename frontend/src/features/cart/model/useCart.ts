// src/hooks/useCart.ts
import { useContext } from 'react';
import { CartContext } from '@app/providers/CartProvider';
import type { CartContextType } from '@app/providers/CartProvider';

export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart debe ser usado dentro de un CartProvider');
  }
  return context;
};