import { Link } from 'react-router-dom';

export function Features() {
  const features = [
    {
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
        </svg>
      ),
      title: 'Excelencia',
      description: 'Estándares de calidad internacional en cada proceso.',
    },
    {
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
        </svg>
      ),
      title: 'Autor',
      description: 'Platos firmados con identidad y creatividad única.',
    },
    {
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      title: 'Fresco',
      description: 'Insumos del día seleccionados rigurosamente.',
    },
    {
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      title: 'Puntual',
      description: 'Servicio eficiente respetando tu tiempo y experiencia.',
    },
  ];

  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Contenedor Grid con Bordes */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 divide-y md:divide-y-0 lg:divide-x divide-slate-100">
            
            {/* Columna de Título (Integrada en el Grid para más orden) */}
            <div className="p-8 bg-slate-50 flex flex-col justify-center">
              <h2 className="text-2xl font-bold text-slate-900 leading-tight">
                Nuestra <br/>
                <span className="text-blue-600">Propuesta</span>
              </h2>
              <p className="mt-3 text-sm text-slate-500 leading-relaxed">
                Cuatro pilares fundamentales que definen nuestra calidad.
              </p>
              <div className="mt-6">
                <Link to="/reservar" className="text-sm font-semibold text-blue-600 hover:text-blue-700 flex items-center group">
                  Reservar Mesa
                  <svg className="w-4 h-4 ml-1 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
              </div>
            </div>

            {/* Items de Características */}
            {features.slice(0, 3).map((feature, index) => (
              <div key={index} className="p-8 group hover:bg-slate-50 transition-colors duration-300 flex flex-col justify-center">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 rounded-lg bg-white border border-slate-100 text-blue-600 shadow-sm group-hover:scale-110 transition-transform duration-300">
                    {feature.icon}
                  </div>
                  <h3 className="font-bold text-slate-900">{feature.title}</h3>
                </div>
                <p className="text-sm text-slate-500 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
            
          </div>
        </div>

        {/* Footer / Stats Sutiles */}
        <div className="mt-8 flex justify-center gap-8 text-center">
           <div className="px-4">
             <p className="text-2xl font-bold text-slate-900">4.9</p>
             <p className="text-xs text-slate-500 uppercase tracking-wider">Calificación</p>
           </div>
           <div className="w-px h-10 bg-slate-200"></div>
           <div className="px-4">
             <p className="text-2xl font-bold text-slate-900">15k+</p>
             <p className="text-xs text-slate-500 uppercase tracking-wider">Clientes Felices</p>
           </div>
           <div className="w-px h-10 bg-slate-200"></div>
           <div className="px-4">
             <p className="text-2xl font-bold text-slate-900">100%</p>
             <p className="text-xs text-slate-500 uppercase tracking-wider">Fresco</p>
           </div>
        </div>

      </div>
    </section>
  );
}