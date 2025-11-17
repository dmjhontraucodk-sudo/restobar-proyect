// src/hooks/useCart.ts
import { useContext } from 'react';
import { CartContext } from '../context/CartContext';
import type { CartContextType } from '../context/CartContext';

export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart debe ser usado dentro de un CartProvider');
  }
  return context;
};