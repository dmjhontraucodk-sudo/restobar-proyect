// src/pages/Landing.tsx - VERSIÓN CON DEMO SIMPLE
import { DemoMenuCatalog } from './public/components/DemoMenuCatalog';
import { useCart } from '../context/CartContext';
import { Hero } from './public/components/Hero';
import { Features } from './public/components/Features';
import Header from './public/components/Header';
import Footer from './public/components/Footer';
import type { Producto } from '../types';

export const Landing = () => {
  const { addToCart } = useCart();

  const scrollToDemo = () => {
    const demoSection = document.getElementById('demo-section');
    if (demoSection) {
      demoSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleDemoAddToCart = (product: Producto) => {
    console.log('Demo - Añadiendo al carrito:', product.nombre);
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
      <Header isDemo={true} />
      
      <div className="min-h-screen">
        <Hero onScrollToMenu={scrollToDemo} />
        <Features />
        
        {/* 🆕 SECCIÓN DEMO */}
        <section id="demo-section" className="py-8">
          <DemoMenuCatalog onAddToCart={handleDemoAddToCart} />
        </section>
      </div>

      <Footer isDemo={true} />
    </div>
  );
};