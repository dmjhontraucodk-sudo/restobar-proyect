// src/pages/Landing.tsx - VERSIÓN CORREGIDA
import { useCart } from '../context/CartContext';
import { Hero } from './public/components/Hero';
import { Features } from './public/components/Features';
import Header from './public/components/Header';
import Footer from './public/components/Footer';
import type { Producto } from '../types';

export const Landing = () => {
  const { addToCart } = useCart();

  const scrollToMenu = () => {
    const menuSection = document.getElementById('menu');
    if (menuSection) {
      menuSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleAddToCart = (product: Producto) => {
    addToCart({
      id: product.id,
      nombre: product.nombre,
      precio: Number(product.precio),
      foto_url: product.foto_url,
      disponible: product.disponible
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* ⭐ CORREGIDO: Ya NO pasa tenantName - Se obtiene de useGlobalConfig */}
      <Header isDemo={true} />
      
      <div className="min-h-screen">
        <Hero onScrollToMenu={scrollToMenu} />
        <Features />
      </div>

      {/* ⭐ CORREGIDO: Ya NO pasa tenantName - Se obtiene de useGlobalConfig */}
      <Footer isDemo={true} />
    </div>
  );
};