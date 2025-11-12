// src/pages/public/components/Features.tsx
export function Features() {
  const features = [
    { icon: '🍽️', title: 'Cocina Fusión Contemporánea', description: 'Innovación en cada plato' },
    { icon: '🥘', title: 'Ingredientes Frescos y Locales', description: 'De la granja a tu mesa' },
    { icon: '🎉', title: 'Eventos Especiales y Catering', description: 'Momentos inolvidables' },
    { icon: '💫', title: 'Experiencia Gastronómica Única', description: 'Donde el sabor es arte' },
  ];

  return (
    <div className="bg-white py-20 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="text-center p-6 rounded-2xl bg-white shadow-lg border border-gray-100 hover:border-blue-500/50 transition-all hover:-translate-y-1"
            >
              <div className="text-5xl mb-4">{feature.icon}</div>
              <h3 className="text-gray-900 font-semibold text-lg mb-2">{feature.title}</h3>
              <p className="text-gray-600 text-sm">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}