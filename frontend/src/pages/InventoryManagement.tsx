// src/pages/InventoryManagement.tsx

// ¡NUEVO ARCHIVO!



import React, { useState, useEffect, useCallback } from 'react';

import { useDashboardApi, type Insumo, type CreateInsumoData } from '../hooks/useDashboardApi';

import toast from 'react-hot-toast';



// --- Iconos (puedes importarlos desde un archivo central si los tienes) ---

const PlusIcon = (props: React.SVGProps<SVGSVGElement>) => (

  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M5 12h14" /><path d="M12 5v14" /></svg>

);

const EditIcon = (props: React.SVGProps<SVGSVGElement>) => (

  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>

);

const TrashIcon = (props: React.SVGProps<SVGSVGElement>) => (

  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M3 6h18" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><line x1="10" x2="10" y1="11" y2="17" /><line x1="14" x2="14" y1="11" y2="17" /></svg>

);

const XIcon = (props: React.SVGProps<SVGSVGElement>) => (

  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>

);

const InventoryIcon = (props: React.SVGProps<SVGSVGElement>) => (

  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M4 18.2V6.3c0-1.7 1.3-3 3-3h10c1.7 0 3 1.3 3 3v11.9"/><path d="M8 3.3V1.7c0-.9.7-1.7 1.7-1.7h4.6c.9 0 1.7.7 1.7 1.7v1.6"/><path d="M16 12.6H8"/><path d="M12 21.6v-9"/><path d="M8 12.6c-1.7 0-3 1.3-3 3v3c0 1.7 1.3 3 3 3h8c1.7 0 3-1.3 3-3v-3c0-1.7-1.3-3-3-3"/></svg>

);





// --- Modal (similar al de MenuManagement) ---

interface ModalProps {

  title: string;

  onClose: () => void;

  children: React.ReactNode;

}

const Modal = ({ title, onClose, children }: ModalProps) => (

  <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">

    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg transform transition-all">

      <div className="flex justify-between items-center p-6 border-b border-gray-100">

        <h2 className="text-xl font-bold text-gray-900">{title}</h2>

        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors duration-200 p-1 hover:bg-gray-100 rounded-lg">

          <XIcon className="w-5 h-5" />

        </button>

      </div>

      <div className="p-6">{children}</div>

    </div>

  </div>

);



// --- Componente Principal de la Página de Inventario ---

export default function InventoryManagementPage() {

  // 1. Usar el hook de la API (incluyendo las nuevas funciones)

  const { getInsumos, createInsumo, isLoading, error } = useDashboardApi();

  

  // 2. Estados para la lista de insumos y el modal

  const [insumos, setInsumos] = useState<Insumo[]>([]);

  const [showModal, setShowModal] = useState(false);

  

  // 3. Estados para el formulario del nuevo insumo

  const [nombre, setNombre] = useState("");

  const [unidad, setUnidad] = useState("");

  const [stock, setStock] = useState(0);

  const [costo, setCosto] = useState(0);

  const [isSubmitting, setIsSubmitting] = useState(false);



  // 4. Cargar los datos de la API (GET /insumos)

  const loadInsumos = useCallback(async () => {

    try {

      const data = await getInsumos();

      setInsumos(data);

    } catch (err) {

      toast.error('No se pudieron cargar los insumos.');

      console.error(err);

    }

  }, [getInsumos]);



  // Cargar datos al montar el componente

  useEffect(() => {

    loadInsumos();

  }, [loadInsumos]);



  // 5. Lógica para abrir el modal y limpiar el formulario

  const handleOpenModal = () => {

    setNombre("");

    setUnidad("");

    setStock(0);

    setCosto(0);

    setShowModal(true);

  };



  // 6. Lógica para guardar el nuevo insumo (POST /insumos)

  const handleSubmit = async (e: React.FormEvent) => {

    e.preventDefault();

    if (isSubmitting) return;



    if (!nombre || !unidad) {

      toast.error('El Nombre y la Unidad de Medida son obligatorios.');

      return;

    }



    setIsSubmitting(true);

    

    const nuevoInsumo: CreateInsumoData = {

      nombre,

      unidad_medida: unidad,

      stock_actual: stock,

      costo_unitario: costo,

    };



    try {

      // Llamar a la API para crear

      const insumoCreado = await createInsumo(nuevoInsumo);

      

      // Actualizar la lista en el frontend (localmente)

      setInsumos([...insumos, insumoCreado].sort((a, b) => a.nombre.localeCompare(b.nombre)));

      

      toast.success(`Insumo "${insumoCreado.nombre}" creado con éxito.`);

      setShowModal(false); // Cerrar el modal



    } catch (err) {



          const error = err as Error;



          // Mostrar el error de la API (ej: "Insumo duplicado")



          toast.error(error.message || 'Error al crear el insumo.');



          console.error(error);

    } finally {

      setIsSubmitting(false);

    }

  };





  // 7. Renderizado (JSX)

  if (isLoading && insumos.length === 0) {

    return (

      <div className="flex justify-center items-center h-64">

        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>

        <p className="ml-4 text-lg text-gray-600">Cargando Inventario...</p>

      </div>

    );

  }



  if (error && insumos.length === 0) {

    return (

      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-4 rounded-xl mx-4" role="alert">

        <strong className="font-bold">¡Error!</strong>

        <span className="block sm:inline"> No se pudo cargar el inventario: {error}</span>

      </div>

    );

  }



  return (

    <div className="min-h-screen bg-gray-50">

      

      {/* Cabecera de la Página */}

      <div className="bg-white border-b border-gray-200">

        <div className="px-6 py-4 max-w-7xl mx-auto">

          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">

            <div className="flex items-center">

              <InventoryIcon className="w-8 h-8 text-blue-600 mr-3" />

              <div>

                <h1 className="text-2xl font-bold text-gray-900">Gestión de Inventario (Insumos)</h1>

                <p className="text-gray-500 text-sm mt-1">Administra los ingredientes y productos de tu inventario.</p>

              </div>

            </div>

            <button 

              onClick={handleOpenModal} 

              className="flex items-center justify-center px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl w-full sm:w-auto"

            >

              <PlusIcon className="w-4 h-4 mr-2" />

              Añadir Insumo

            </button>

          </div>

        </div>

      </div>



      {/* Contenido Principal (Tabla de Insumos) */}

      <div className="px-4 py-6 max-w-7xl mx-auto">

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">

          <div className="overflow-x-auto">

            {insumos.length === 0 ? (

              <div className="px-6 py-12 text-center">

                <InventoryIcon className="w-12 h-12 text-gray-400 mx-auto opacity-50 mb-2" />

                <p className="text-gray-500 font-medium">No hay insumos en tu inventario</p>

                <p className="text-gray-400 text-sm mt-1">Añade el primer insumo para empezar</p>

              </div>

            ) : (

              <table className="w-full">

                <thead className="bg-gray-50">

                  <tr>

                    <th className="py-3 px-4 text-left font-semibold text-gray-700 text-sm uppercase tracking-wider w-2/5">Nombre</th>

                    <th className="py-3 px-4 text-left font-semibold text-gray-700 text-sm uppercase tracking-wider">Unidad Medida</th>

                    <th className="py-3 px-4 text-left font-semibold text-gray-700 text-sm uppercase tracking-wider">Stock Actual</th>

                    <th className="py-3 px-4 text-left font-semibold text-gray-700 text-sm uppercase tracking-wider">Costo Unitario</th>

                    <th className="py-3 px-4 text-right font-semibold text-gray-700 text-sm uppercase tracking-wider">Acciones</th>

                  </tr>

                </thead>

                <tbody className="divide-y divide-gray-100">

                  {insumos.map((insumo) => (

                    <tr key={insumo.id} className="hover:bg-gray-50 transition-colors duration-150">

                      

                      {/* Nombre */}

                      <td className="py-3 px-4">

                        <div className="font-medium text-gray-900">{insumo.nombre}</div>

                      </td>

                      

                      {/* Unidad */}

                      <td className="py-3 px-4 text-gray-600 text-sm">

                        {insumo.unidad_medida}

                      </td>

                      

                      {/* Stock */}

                      <td className="py-3 px-4">

                        <span className="font-semibold text-blue-700">

                          {/* Manejar 'null' y formatear número */}

                          {Number(insumo.stock_actual).toFixed(3)}

                        </span>

                      </td>



                      {/* Costo */}

                      <td className="py-3 px-4">

                        <span className="font-semibold text-green-700">

                          S/ {Number(insumo.costo_unitario).toFixed(2)}

                        </span>

                      </td>

                      

                      {/* Acciones */}

                      <td className="py-3 px-4">

                        <div className="flex justify-end space-x-1">

                          <button onClick={() => toast.error('Función "Editar" no implementada.')} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200" title="Editar Insumo">

                            <EditIcon className="w-4 h-4" />

                          </button>

                          <button onClick={() => toast.error('Función "Borrar" no implementada.')} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200" title="Borrar Insumo">

                            <TrashIcon className="w-4 h-4" />

                          </button>

                        </div>

                      </td>

                    </tr>

                  ))}

                </tbody>

              </table>

            )}

          </div>

        </div>

      </div>



      {/* Modal para Nuevo Insumo */}

      {showModal && (

        <Modal title="Añadir Nuevo Insumo" onClose={() => setShowModal(false)}>

          <form onSubmit={handleSubmit} className="space-y-4">

            

            {/* Fila 1: Nombre y Unidad */}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              <div>

                <label htmlFor="insumoNombre" className="block text-sm font-medium text-gray-700 mb-2">

                  Nombre del Insumo <span className="text-red-500">*</span>

                </label>

                <input

                  type="text"

                  id="insumoNombre"

                  value={nombre}

                  onChange={(e) => setNombre(e.target.value)}

                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"

                  placeholder="Ej. Papas Yungay"

                  autoFocus

                  required

                />

              </div>

              <div>

                <label htmlFor="insumoUnidad" className="block text-sm font-medium text-gray-700 mb-2">

                  Unidad de Medida <span className="text-red-500">*</span>

                </label>

                <input

                  type="text"

                  id="insumoUnidad"

                  value={unidad}

                  onChange={(e) => setUnidad(e.target.value)}

                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"

                  placeholder="Ej. kg, lt, unidad"

                  required

                />

              </div>

            </div>



            {/* Fila 2: Stock y Costo */}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              <div>

                <label htmlFor="insumoStock" className="block text-sm font-medium text-gray-700 mb-2">

                  Stock Inicial

                </label>

                <input

                  type="number"

                  id="insumoStock"

                  value={stock}

                  min="0"

                  step="0.001" // Permitir decimales

                  onChange={(e) => setStock(parseFloat(e.target.value))}

                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"

                />

              </div>

              <div>

                <label htmlFor="insumoCosto" className="block text-sm font-medium text-gray-700 mb-2">

                  Costo Unitario (S/)

                </label>

                <input

                  type="number"

                  id="insumoCosto"

                  value={costo}

                  min="0"

                  step="0.01"

                  onChange={(e) => setCosto(parseFloat(e.target.value))}

                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"

                />

              </div>

            </div>

            

            {/* Botones de Acción */}

            <div className="flex justify-end space-x-3 pt-4">

              <button

                type="button"

                disabled={isSubmitting}

                onClick={() => setShowModal(false)}

                className="px-6 py-2.5 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors duration-200 font-medium disabled:opacity-50"

              >

                Cancelar

              </button>

              <button

                type="submit"

                disabled={isSubmitting}

                className="px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors duration-200 font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"

              >

                {isSubmitting ? 'Guardando...' : 'Guardar Insumo'}

              </button>

            </div>

          </form>

        </Modal>

      )}

    </div>

  );

}