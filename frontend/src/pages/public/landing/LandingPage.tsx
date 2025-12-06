// src/pages/public/landing/LandingPage.tsx - VERSIÓN CON DEMO SIMPLE

// Actually CartDemo is exported as default from ui/CartDemo.
// And MenuCatalog is used in Landing? The code says DemoMenuCatalog.
// DemoMenuCatalog is in features/menu/products/ui/DemoMenuCatalog.
// I need to export DemoMenuCatalog from features/menu/index.ts
import { DemoMenuCatalog } from '@features/menu/products/ui/DemoMenuCatalog';
import { useCart } from '@app/providers/CartProvider';
import { Hero } from '@widgets/landing-sections/ui/Hero';
import { Features } from '@widgets/landing-sections/ui/Features';
import { PublicHeader as Header } from '@widgets/public-header';
import { PublicFooter as Footer } from '@widgets/public-footer';
import type { Producto } from '@shared/types';

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