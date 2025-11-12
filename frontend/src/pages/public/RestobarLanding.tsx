// src/pages/public/RestobarLanding.tsx
import { useCart } from '../../context/CartContext';
import { Hero } from './components/Hero';
import { Features } from './components/Features';
import { MenuCatalog } from './components/MenuCatalog';
import Header from './components/Header';
import Footer from './components/Footer';
import type { Producto } from '../../types';

export default function RestobarLanding() {
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
      {/* NO pasar isDemo - por defecto será false, no mostrará botón de registro */}
      <Header />
      
      <div className="min-h-screen">
        <Hero onScrollToMenu={scrollToMenu} />
        <Features />
        <MenuCatalog onAddToCart={handleAddToCart} />
      </div>

      <Footer />
    </div>
  );
}