// src/pages/public/tenant-landing/RestobarLandingPage.tsx
import { useCart } from '@app/providers/CartProvider';
import { Hero } from '@widgets/landing-sections/ui/Hero';
import { Features } from '@widgets/landing-sections/ui/Features';
import { MenuCatalog } from '@features/menu/products/ui/MenuCatalog';
import { ReviewsList } from '@features/reviews';
import { PublicHeader as Header } from '@widgets/public-header';
import { PublicFooter as Footer } from '@widgets/public-footer';

export default function RestobarLanding() {
  const { } = useCart();

  const scrollToMenu = () => {
    const menuSection = document.getElementById('menu');
    if (menuSection) {
      menuSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* NO pasar isDemo - por defecto será false, no mostrará botón de registro */}
      <Header />
      
      <div className="min-h-screen">
        <Hero onScrollToMenu={scrollToMenu} />
        <Features />
        <MenuCatalog />
        <ReviewsList />
      </div>

      <Footer />
    </div>
  );
}