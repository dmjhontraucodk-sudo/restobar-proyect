// src/features/orders/pos/ui/PosOrderModal.tsx
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import toast from 'react-hot-toast';
import { 
    type ApiOrden as BaseApiOrden,
    type ApiMesa, 
    type CreateOrdenItem, 
    type CreateOrdenData,
    type MenuItem as MenuProduct,
    type ApiOrdenDetalle,
    type TipoCategoria,
    type UpdateOrderPosData
} from '@shared/types'; 

import { useOrdersApi, type AddItemsToOrderData } from '@features/orders/model/useOrdersApi'; 
import { useMenuManagement } from '@features/menu/model/useMenuManagement'; 
import { useAuth } from '@app/providers/AuthProvider';
import { useGlobalConfig } from '@shared/hooks/useGlobalConfig'; // ✅ IMPORTAR
import { 
    XIcon, 
    TableIcon, 
    DollarSignIcon, 
    PlusIcon,
    ShoppingCartIcon,
    TrashIcon,
    CheckIcon,
    UserIcon,
    SendIcon,
    PrinterIcon,
    StarIcon,
    GiftIcon
} from '@shared/ui/Icons'; 

// ====================================================================
// TIPOS LOCALES
// ====================================================================

export interface ApiOrden extends BaseApiOrden {
    descuento: string;
}

interface PosItem extends CreateOrdenItem {
    posItemId: string; // ID único para el item en el POS
    nombre: string;
    categoria?: string;
}

interface PosOrderModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialOrder: ApiOrden | null;
    isEditMode?: boolean;
}

interface CobroCompletedData {
    orden: ApiOrden;
    metodo: string;
    cliente: {
        nombre: string;
        telefono: string;
    } | null;
}

// --- COMPONENTE AUXILIAR VOUCHER ---
const VoucherModal: React.FC<{ 
    data: CobroCompletedData; 
    onClose: () => void; 
}> = ({ data, onClose }) => {
    const { orden, metodo, cliente } = data;
    const { generateInvoice } = useOrdersApi();
    const { currentTenant } = useAuth();
    
    if (!orden || !orden.mesas || !orden.ordendetalles) {
        console.error('❌ Error: Datos de orden incompletos', orden);
        toast.error('Error al mostrar el comprobante. Datos incompletos.');
        onClose();
        return null;
    }

    const handleGenerateInvoice = async (type: 'boleta' | 'factura') => {
        try {
            const blob = await generateInvoice(orden.id, type, currentTenant);
            const url = URL.createObjectURL(blob);
            window.open(url, '_blank');
        } catch (error: any) {
            toast.error(error.message || 'Error al generar el comprobante.');
        }
    };
    
    const formatDateTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-PE', { 
            year: '2-digit', 
            month: '2-digit', 
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        }).replace(',', '');
    };

    const descuentoMonto = Number(orden.descuento || '0');
    
    let totalNeto = Number(orden.total);
    
    if (isNaN(totalNeto) || totalNeto === 0) {
        const subtotalOriginal = Number(orden.subtotal || '0');
        totalNeto = subtotalOriginal - descuentoMonto;
    }
    
    console.log('💰 VoucherModal - Valores:', {
        total: orden.total,
        subtotal: orden.subtotal,
        descuento: orden.descuento,
        totalCalculado: totalNeto
    });

    const handlePrint = () => {
        const printContent = document.getElementById('print-voucher');
        if (!printContent) {
            toast.error("Error al preparar la impresión.");
            return;
        }

        const printWindow = window.open('', '', 'height=600,width=400');
        
        if (!printWindow) {
            toast.error("La ventana de impresión fue bloqueada por el navegador.");
            return;
        }

        const printStyles = `
            @import url('https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@400;500;700&display=swap');
            
            body { 
                font-family: 'Roboto Mono', monospace, 'Courier New'; 
                font-size: 12px; 
                margin: 0; 
                padding: 8px; 
                color: #000; 
                background: white;
                line-height: 1.2;
            }
            .comprobante { 
                width: 80mm; 
                margin: 0 auto;
                padding: 5px;
            }
            .header { 
                text-align: center; 
                padding-bottom: 5px; 
                margin-bottom: 5px; 
                border-bottom: 1px solid #000;
            }
            .empresa { 
                font-weight: bold; 
                font-size: 14px; 
                margin-bottom: 2px;
                letter-spacing: 0.5px;
            }
            .titulo { 
                font-size: 12px; 
                margin: 3px 0;
                font-weight: bold;
            }
            .fecha {
                font-size: 10px;
                margin: 2px 0;
            }
            .mesa-info {
                margin: 5px 0;
                font-size: 10px;
            }
            .separator {
                border-bottom: 1px dashed #000;
                margin: 5px 0;
            }
            .cliente-info { 
                margin: 5px 0; 
                padding: 3px 0; 
                font-size: 10px;
            }
            .cliente-label {
                font-weight: bold;
            }
            .items-table {
                width: 100%;
                margin: 5px 0;
                border-collapse: collapse;
            }
            .items-table th {
                text-align: left;
                padding: 2px 0;
                border-bottom: 1px solid #000;
                font-weight: bold;
                font-size: 10px;
            }
            .items-table td {
                padding: 2px 0;
                font-size: 10px;
                vertical-align: top;
            }
            .producto-col {
                width: 60%;
                text-align: left;
            }
            .cant-col {
                width: 15%;
                text-align: center;
            }
            .total-col {
                width: 25%;
                text-align: right;
            }
            .totales { 
                margin-top: 8px;
                padding-top: 5px;
            }
            .total-row { 
                display: flex; 
                justify-content: space-between; 
                margin: 2px 0;
                font-size: 11px;
            }
            .total-final { 
                font-weight: bold; 
                border-top: 1px solid #000; 
                padding-top: 4px; 
                margin-top: 4px;
                font-size: 12px;
            }
            .metodo-pago {
                margin: 8px 0;
                padding: 4px 0;
                border-top: 1px dashed #000;
                font-size: 11px;
                font-weight: bold;
            }
            .footer { 
                text-align: center; 
                margin-top: 10px; 
                font-size: 10px; 
                padding-top: 5px;
                border-top: 1px dashed #000;
            }
            .venta-registrada {
                text-align: center;
                font-weight: bold;
                margin-top: 5px;
                font-size: 10px;
            }
            @media print { 
                body { 
                    padding: 0; 
                    margin: 0; 
                    background: white;
                } 
                .comprobante { 
                    width: 80mm !important; 
                    margin: 0 auto;
                    padding: 5px;
                }
                .no-print {
                    display: none !important;
                }
            }
            @page {
                margin: 0;
                size: 80mm auto;
            }
        `;
        
        const htmlContent = `
            <html>
            <head>
                <title>Comprobante de Pago</title>
                <style>${printStyles}</style>
            </head>
            <body>
                ${printContent.innerHTML}
            </body>
            </html>
        `;
        
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        
        setTimeout(() => {
            try {
                printWindow.focus();
                printWindow.print();
            } catch (error) {
                console.error('Error al imprimir:', error);
                toast.error('Error al imprimir el comprobante.');
            }
        }, 500);
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl flex flex-col overflow-hidden">
                <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-blue-600 text-white rounded-t-2xl">
                    <h3 className="text-xl font-bold">Cobro Exitoso</h3>
                    <button onClick={onClose} className="p-2 text-white/80 hover:text-white rounded-lg transition-colors">
                        <XIcon className="w-6 h-6" />
                    </button>
                </div>
                
                <div className="p-6">
                    <div className="text-center mb-6">
                        <CheckIcon className="w-12 h-12 text-green-600 mx-auto mb-3" />
                        <h4 className="text-2xl font-bold text-gray-800">Pago Recibido</h4>
                        <p className="text-gray-500">
                            Mesa {orden.mesas?.nombre_o_numero || 'N/A'} cobrada y liberada.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-6 text-sm font-medium">
                        <div className="bg-gray-100 p-3 rounded-lg">
                            <p className="text-gray-500">Total Pagado:</p>
                            <p className="text-green-600 text-xl font-bold">S/ {totalNeto.toFixed(2)}</p>
                        </div>
                        <div className="bg-gray-100 p-3 rounded-lg">
                            <p className="text-gray-500">Método:</p>
                            <p className="text-gray-800 text-lg font-bold">{metodo}</p>
                        </div>
                    </div>

                    {/* Vista previa del voucher */}
                    <div className="mb-6 p-4 border border-gray-300 rounded-lg bg-white">
                        <div className="text-center text-sm font-mono">
                            <div className="font-bold text-lg">RESTAURANTE DELICIAS</div>
                            <div className="font-semibold">COMPROBANTE DE VENTA</div>
                            <div className="text-xs">
                                {formatDateTime(orden.created_at)}
                            </div>
                            <div className="text-xs mt-1">
                                Mesa: {orden.mesas?.nombre_o_numero || 'N/A'} | Orden: #{orden.id}
                            </div>
                        </div>
                    </div>

                    {/* Botones de acción */}
                    <div className="space-y-3">
                        <button
                            onClick={handlePrint}
                            className="w-full py-3 bg-gray-700 text-white rounded-xl font-semibold hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 shadow-lg"
                        >
                            <PrinterIcon className="w-5 h-5" />
                            Imprimir Ticket
                        </button>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={() => handleGenerateInvoice('boleta')}
                                className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                            >
                                <PrinterIcon className="w-5 h-5" />
                                Imprimir Boleta
                            </button>
                            <button
                                onClick={() => handleGenerateInvoice('factura')}
                                className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                            >
                                <PrinterIcon className="w-5 h-5" />
                                Imprimir Factura
                            </button>
                        </div>
                        <button 
                            onClick={onClose} 
                            className="w-full py-3 text-gray-600 bg-gray-200 rounded-xl font-medium hover:bg-gray-300 transition-colors"
                        >
                            Cerrar y Volver a Pedidos
                        </button>
                    </div>
                </div>
                
                {/* CONTENIDO DEL VOUCHER PARA IMPRESIÓN */}
                <div id="print-voucher" style={{ display: 'none' }}>
                    <div className="comprobante">
                        <div className="header">
                            <div className="empresa">RESTAURANTE DELICIAS</div>
                            <div className="titulo">COMPROBANTE DE VENTA</div>
                            <div className="fecha">{formatDateTime(orden.created_at)}</div>
                        </div>

                        <div className="mesa-info">
                            <div>Mesa: {orden.mesas?.nombre_o_numero || 'N/A'}</div>
                            <div>Orden: #{orden.id}</div>
                        </div>

                        <div className="separator"></div>

                        {cliente && (
                            <div className="cliente-info">
                                <div><span className="cliente-label">Cliente:</span> {cliente.nombre}</div>
                                <div><span className="cliente-label">Teléfono/DNI:</span> {cliente.telefono}</div>
                            </div>
                        )}

                        <div className="separator"></div>

                        <table className="items-table">
                            <thead>
                                <tr>
                                    <th className="producto-col">Producto</th>
                                    <th className="cant-col">Cant</th>
                                    <th className="total-col">Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(orden.ordendetalles || []).map((detalle) => (
                                    <tr key={detalle.id}>
                                        <td className="producto-col">{detalle.productos?.nombre || 'Producto'}</td>
                                        <td className="cant-col">{detalle.cantidad}</td>
                                        <td className="total-col">S/ {(Number(detalle.precio_unitario) * detalle.cantidad).toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        <div className="separator"></div>

                        <div className="totales">
                            <div className="total-row">
                                <div>Subtotal:</div>
                                <div>S/ {Number(orden.subtotal || 0).toFixed(2)}</div>
                            </div>
                            {descuentoMonto > 0 && (
                                <div className="total-row">
                                    <div>Descuento:</div>
                                    <div>- S/ {descuentoMonto.toFixed(2)}</div>
                                </div>
                            )}
                            <div className="total-row total-final">
                                <div><strong>TOTAL:</strong></div>
                                <div><strong>S/ {totalNeto.toFixed(2)}</strong></div>
                            </div>
                        </div>

                        <div className="metodo-pago">
                            <strong>Método de Pago:</strong> {metodo}
                        </div>

                        <div className="footer">
                            ¡Gracias por su visita!
                        </div>
                        
                        <div className="venta-registrada">
                            *** VENTA REGISTRADA ***
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const PosOrderModal: React.FC<PosOrderModalProps> = ({ isOpen, onClose, initialOrder, isEditMode = false }) => {
    
    const { getMesasDisponibles, createOrderPos, closeOrderPos, addItemsToOrder, findClientByDocument } = useOrdersApi();
    const { formatCurrency, moneda } = useGlobalConfig(); // ✅ USAR HOOK
    
    const { 
        allProducts: foodProducts, 
        isLoading: isLoadingFood 
    } = useMenuManagement('COMIDA');
    
    const {
        allProducts: drinkProducts, 
        isLoading: isLoadingDrinks 
    } = useMenuManagement('BEBIDA');

    const [selectedMesaId, setSelectedMesaId] = useState<number | null>(null);
    const [posItems, setPosItems] = useState<PosItem[]>([]);
    const [mesasDisponibles, setMesasDisponibles] = useState<ApiMesa[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const [menuType, setMenuType] = useState<TipoCategoria>('COMIDA');
    const [activeCategory, setActiveCategory] = useState<string>('TODAS');

    const [descuentoMonto, setDescuentoMonto] = useState(0);
    const [descuentoPorcentaje, setDescuentoPorcentaje] = useState(0);
    const [metodoPago, setMetodoPago] = useState<'Efectivo' | 'Tarjeta' | 'Transferencia' | 'QR'>('Efectivo');
    const [cobroData, setCobroData] = useState<CobroCompletedData | null>(null);

    const [clienteNombre, setClienteNombre] = useState('');
    const [clienteTelefono, setClienteTelefono] = useState('');
    const [tipoDocumento, setTipoDocumento] = useState('DNI');
    const [documentoIdentidad, setDocumentoIdentidad] = useState('');
    const [isSearchingClient, setIsSearchingClient] = useState(false);
    
    // ✅ ESTADOS DE LEALTAD
    const [loyaltyData, setLoyaltyData] = useState<any>(null);
    const [usarPuntos, setUsarPuntos] = useState(false);

    const isNewOrder = !initialOrder && !isEditMode;
    const isCheckoutMode = !isNewOrder && !isEditMode;
    const isAddItemsMode = isEditMode && !!initialOrder;
    
    const handleSearchClient = async () => {
        if (!documentoIdentidad) {
            toast.error('Por favor, ingrese un documento de identidad.');
            return;
        }
        setIsSearchingClient(true);
        try {
            const result = await findClientByDocument(documentoIdentidad);
            if (result.success && result.client) {
                setClienteNombre(result.client.nombre);
                setClienteTelefono(result.client.telefono || '');
                
                if (result.client.loyalty) {
                    setLoyaltyData(result.client.loyalty);
                    setUsarPuntos(false);
                } else {
                    setLoyaltyData(null);
                }

                toast.success('Cliente encontrado.');
            } else {
                setClienteNombre('');
                setClienteTelefono('');
                setLoyaltyData(null);
                toast.error('Cliente no encontrado. Puede registrarlo manualmente.');
            }
        } catch (error) {
            console.error(error);
            toast.error('Error al buscar el cliente.');
        } finally {
            setIsSearchingClient(false);
        }
    };
    
    const existingDetails = useMemo(() => 
        isCheckoutMode || isAddItemsMode ? initialOrder?.ordendetalles || [] : [], 
        [isCheckoutMode, isAddItemsMode, initialOrder]
    );
    
    const existingItemCount = useMemo(() => 
        existingDetails.reduce((sum, item) => sum + item.cantidad, 0), 
        [existingDetails]
    );

    const subtotal = useMemo(() => {
        if (isCheckoutMode) {
            return Number(initialOrder?.total) || 0;
        }
        return posItems.reduce((sum, item) => sum + (item.precio_unitario * item.cantidad), 0);
    }, [isCheckoutMode, initialOrder, posItems]);

    // ✅ CALCULAR DESCUENTO DE PUNTOS
    const descuentoPuntosMonto = useMemo(() => {
        if (usarPuntos && loyaltyData) {
            return loyaltyData.valor_en_soles || 0;
        }
        return 0;
    }, [usarPuntos, loyaltyData]);

    const totalConDescuento = useMemo(() => 
        Math.max(0, subtotal - descuentoMonto - descuentoPuntosMonto), 
        [subtotal, descuentoMonto, descuentoPuntosMonto]
    );

    const currentProducts = menuType === 'COMIDA' ? foodProducts : drinkProducts;
    const isLoadingProducts = menuType === 'COMIDA' ? isLoadingFood : isLoadingDrinks;

    const categorias = useMemo(() => {
        const cats = ['TODAS', ...new Set(currentProducts.map(p => p.categoria))] as string[];
        return cats.filter(cat => cat && cat !== 'TODAS');
    }, [currentProducts]);

    const productosFiltrados = useMemo(() => {
        let filtered = currentProducts;
        if (activeCategory !== 'TODAS') {
            filtered = currentProducts.filter(product => product.categoria === activeCategory);
        }
        return filtered;
    }, [currentProducts, activeCategory]);

    const loadMesas = useCallback(() => {
        getMesasDisponibles()
            .then(setMesasDisponibles)
            .catch(err => {
                setMesasDisponibles([]);
                console.error("Error al cargar mesas disponibles:", err);
                toast.error("Error al cargar mesas. Reintente más tarde.");
            });
    }, [getMesasDisponibles]);

    useEffect(() => {
        if (!isOpen) {
            setCobroData(null);
            return;
        }

        setDescuentoMonto(0);
        setDescuentoPorcentaje(0);
        setMetodoPago('Efectivo');
        setClienteNombre('');
        setClienteTelefono('');
        setDocumentoIdentidad('');
        setTipoDocumento('DNI');
        setMenuType('COMIDA');
        setActiveCategory('TODAS');
        setUsarPuntos(false);
        setLoyaltyData(null);
        
        if (isNewOrder) {
            loadMesas();
            setSelectedMesaId(null);
            setPosItems([]);
        } else if (isCheckoutMode) {
            setPosItems(existingDetails.map((detalle: ApiOrdenDetalle) => ({
                producto_id: detalle.producto_id,
                cantidad: detalle.cantidad,
                precio_unitario: Number(detalle.precio_unitario),
                nombre: detalle.productos.nombre,
                notas: detalle.notas,
            } as PosItem)));
        } else if (isAddItemsMode) {
            setPosItems([]);
        }
        
    }, [isOpen, isNewOrder, isCheckoutMode, isAddItemsMode, existingDetails, loadMesas]);

    useEffect(() => {
        if (descuentoPorcentaje > 0 && subtotal > 0) {
            setDescuentoMonto((subtotal * descuentoPorcentaje) / 100);
        }
    }, [descuentoPorcentaje, subtotal]);

    const handleCloseOrder = async () => {
        if (!initialOrder) return;

        if (!clienteNombre.trim() || !documentoIdentidad.trim()) {
            toast.error("Por favor, busque o ingrese la información del cliente, incluyendo DNI/RUC.");
            return;
        }

        setIsSubmitting(true);
        try {
            const metodoPagoDB = (metodoPago === 'QR' ? 'Otro' : metodoPago);
            
            const finalData: UpdateOrderPosData = {
                estado: 'Pagada',
                monto_pago: totalConDescuento,
                metodo_pago: metodoPagoDB as 'Efectivo' | 'Tarjeta' | 'Transferencia' | 'Otro',
                descuento_monto: descuentoMonto + descuentoPuntosMonto,
                cliente_nombre: clienteNombre.trim(),
                cliente_telefono: clienteTelefono.trim(),
                tipo_documento: tipoDocumento,
                documento_identidad: documentoIdentidad.trim(),
                puntos_canjeados: usarPuntos && loyaltyData ? loyaltyData.puntos : 0
            };

            const ordenCerrada = await closeOrderPos(initialOrder.id, finalData);
            
            toast.success(`Cuenta de ${initialOrder.mesas.nombre_o_numero} cobrada exitosamente.`);
            
            const totalFinal = totalConDescuento;
            
            setCobroData({
                orden: {
                    ...ordenCerrada,
                    subtotal: initialOrder.subtotal,
                    descuento: (descuentoMonto + descuentoPuntosMonto).toString(),
                    total: totalFinal.toString(),
                    mesas: initialOrder.mesas,
                    empleados: initialOrder.empleados,
                    ordendetalles: initialOrder.ordendetalles,
                },
                metodo: metodoPago,
                cliente: { 
                    nombre: clienteNombre.trim(), 
                    telefono: documentoIdentidad.trim()
                },
            });

        } catch (error: any) {
            toast.error(error.message || 'Error al cerrar y cobrar la cuenta.');
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleAddItem = (product: MenuProduct) => {
        setPosItems(prev => {
            const numericId = parseInt(product.id);
            const existing = prev.find(item => item.producto_id === numericId);

            if (existing) {
                return prev.map(item => 
                    item.producto_id === numericId ? { ...item, cantidad: item.cantidad + 1 } : item
                );
            }
            const newItem: PosItem = {
                posItemId: `${numericId}-${Date.now()}`,
                producto_id: numericId,
                nombre: product.name,
                cantidad: 1,
                precio_unitario: Number(product.price),
                notas: null,
                categoria: product.categoria,
            };
            return [...prev, newItem];
        });
    };
    
    const handleRemoveItem = (producto_id: number) => {
        setPosItems(prev => prev.filter(item => item.producto_id !== producto_id));
    };

    const handleUpdateQuantity = (producto_id: number, nuevaCantidad: number) => {
        if (nuevaCantidad < 1) {
            handleRemoveItem(producto_id);
            return;
        }
        setPosItems(prev => 
            prev.map(item => 
                item.producto_id === producto_id 
                    ? { ...item, cantidad: nuevaCantidad }
                    : item
            )
        );
    };

    const handleUpdateOrder = async () => {
        if (!initialOrder || posItems.length === 0) {
            toast.error("Debe añadir al menos un producto nuevo.");
            return;
        }

        setIsSubmitting(true);
        try {
            const data: AddItemsToOrderData = {
                items: posItems.map(item => ({
                    producto_id: item.producto_id,
                    cantidad: item.cantidad,
                    precio_unitario: item.precio_unitario,
                    notas: item.notas,
                })),
            };
            
            await addItemsToOrder(initialOrder.id, data);
            toast.success(`Nuevos ítems añadidos a la comanda de Mesa ${initialOrder.mesas.nombre_o_numero}.`);
            onClose();

        } catch (error: any) {
            toast.error(error.message || 'Error al añadir ítems a la orden.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCreateOrder = async () => {
        if (!selectedMesaId || posItems.length === 0) {
            toast.error("Debe seleccionar una mesa y agregar al menos un producto.");
            return;
        }
        setIsSubmitting(true);
        try {
            const data: CreateOrdenData = {
                mesa_id: selectedMesaId,
                items: posItems.map(item => ({
                    producto_id: item.producto_id,
                    cantidad: item.cantidad,
                    precio_unitario: item.precio_unitario,
                    notas: item.notas,
                })),
            };
            
            await createOrderPos(data);
            toast.success('¡Pedido realizado con éxito. Mesa marcada como ocupada.');
            onClose();

        } catch (error: any) {
            toast.error(error.message || 'Error al crear la orden POS.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    if (cobroData) {
        return <VoucherModal data={cobroData} onClose={onClose} />;
    }

    const isNewOrAddMode = isNewOrder || isAddItemsMode;
    const currentOrderName = initialOrder?.mesas.nombre_o_numero || 'Nueva';

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl h-[95vh] flex flex-col overflow-hidden">
                
                <div className="flex justify-between items-center p-6 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-t-2xl">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/20 rounded-lg">
                            <DollarSignIcon className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold">
                                {isNewOrder ? 'Nueva Orden POS' : isCheckoutMode ? `Cerrar Cuenta - Mesa ${currentOrderName}` : `Añadir Items - Mesa ${currentOrderName}`}
                            </h3>
                            <p className="text-blue-100 text-sm">
                                {isNewOrder ? 'Crear nueva comanda y bloquear mesa' : isCheckoutMode ? 'Procesar pago y cerrar orden' : 'Añadir más platos a la orden activa'}
                            </p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-colors"
                    >
                        <XIcon className="w-6 h-6" />
                    </button>
                </div>
                
                <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-3">
                    
                    <div className="lg:col-span-2 p-6 border-r border-gray-200 overflow-y-auto">
                        
                        {isNewOrAddMode && (
                            <div className="flex border-b border-gray-200 mb-6">
                                <button
                                    onClick={() => { setMenuType('COMIDA'); setActiveCategory('TODAS'); }}
                                    className={`px-4 py-2 font-semibold transition-colors border-b-2 ${
                                        menuType === 'COMIDA' ? 'text-blue-600 border-blue-600' : 'text-gray-500 border-transparent hover:border-gray-300'
                                    }`}
                                >
                                    Platos Principales
                                </button>
                                <button
                                    onClick={() => { setMenuType('BEBIDA'); setActiveCategory('TODAS'); }}
                                    className={`px-4 py-2 font-semibold transition-colors border-b-2 ${
                                        menuType === 'BEBIDA' ? 'text-blue-600 border-blue-600' : 'text-gray-500 border-transparent hover:border-gray-300'
                                    }`}
                                >
                                    Bebidas & Bar
                                </button>
                            </div>
                        )}

                        {isCheckoutMode ? (
                            <div>
                                <div className="flex items-center gap-2 mb-4">
                                    <ShoppingCartIcon className="w-5 h-5 text-gray-600" />
                                    <h4 className="text-lg font-semibold text-gray-800">Ítems Consumidos</h4>
                                </div>
                                <div className="space-y-3">
                                    {existingDetails.map(detalle => (
                                        <div key={detalle.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-xl border border-gray-200 hover:bg-gray-100 transition-colors">
                                            <div className="flex-1">
                                                <span className="font-semibold text-gray-800 block">{detalle.productos.nombre}</span>
                                                {detalle.notas && (
                                                    <span className="text-xs text-gray-500 mt-1 block">Notas: {detalle.notas}</span>
                                                )}
                                            </div>
                                            <div className="text-right">
                                                <div className="font-medium text-gray-900">
                                                    {formatCurrency(Number(detalle.precio_unitario) * detalle.cantidad)}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {detalle.cantidad} x {formatCurrency(Number(detalle.precio_unitario))}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div>
                                <div className="flex flex-wrap gap-2 mb-4">
                                    <button
                                        onClick={() => setActiveCategory('TODAS')}
                                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                                            activeCategory === 'TODAS' 
                                                ? 'bg-blue-600 text-white' 
                                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                        }`}
                                    >
                                        TODAS
                                    </button>
                                    {categorias.map(categoria => (
                                        <button
                                            key={categoria}
                                            onClick={() => setActiveCategory(categoria)}
                                            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                                                activeCategory === categoria 
                                                    ? 'bg-blue-600 text-white' 
                                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                            }`}
                                        >
                                            {categoria}
                                        </button>
                                    ))}
                                </div>

                                <div className="flex items-center gap-2 mb-4">
                                    <PlusIcon className="w-5 h-5 text-gray-600" />
                                    <h4 className="text-lg font-semibold text-gray-800">
                                        Menú Disponible ({menuType === 'COMIDA' ? 'Platos' : 'Bebidas'})
                                    </h4>
                                    <span className="text-sm text-gray-500">({productosFiltrados.length} productos)</span>
                                </div>
                                
                                {isLoadingProducts ? (
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                        {[...Array(6)].map((_, i) => (
                                            <div key={i} className="p-4 bg-gray-100 rounded-xl animate-pulse">
                                                <div className="h-4 bg-gray-300 rounded mb-2"></div>
                                                <div className="h-3 bg-gray-300 rounded w-3/4"></div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                        {productosFiltrados.map((product: MenuProduct) => (
                                            <button
                                                key={product.id}
                                                onClick={() => handleAddItem(product)}
                                                className="p-4 bg-white rounded-xl border border-gray-200 text-left hover:border-blue-500 hover:shadow-md transition-all duration-200 group"
                                            >
                                                <div className="font-medium text-gray-800 group-hover:text-blue-600 mb-1">
                                                    {product.name}
                                                </div>
                                                <div className="text-xs text-blue-600 font-medium mb-1 capitalize">
                                                    {product.categoria}
                                                </div>
                                                <div className="text-sm text-gray-600 mb-2 line-clamp-2">
                                                    {product.description}
                                                </div>
                                                <div className="font-bold text-green-600">
                                                    {formatCurrency(Number(product.price))}
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                    
                    <div className="lg:col-span-1 p-6 bg-gradient-to-b from-gray-50 to-white overflow-y-auto">
                        
                        {isNewOrder && (
                            <div className="mb-6 p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
                                <div className="flex items-center gap-2 mb-3">
                                    <TableIcon className="w-5 h-5 text-blue-500" />
                                    <h5 className="font-semibold text-gray-800">Mesa</h5>
                                </div>
                                {mesasDisponibles.length > 0 ? (
                                    <select
                                        value={selectedMesaId || ''}
                                        onChange={(e) => setSelectedMesaId(parseInt(e.target.value))}
                                        className="w-full py-3 px-4 border border-gray-300 rounded-lg text-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors"
                                    >
                                        <option value="" disabled>Seleccionar Mesa</option>
                                        {mesasDisponibles.map(mesa => (
                                            <option key={mesa.id} value={mesa.id}>
                                                {mesa.nombre_o_numero} (Cap: {mesa.capacidad})
                                            </option>
                                        ))}
                                    </select>
                                ) : (
                                    <div className="text-center py-4 text-sm text-red-500 border border-red-300 bg-red-50 rounded-lg">
                                        Error al cargar mesas. Reintente más tarde.
                                    </div>
                                )}
                            </div>
                        )}

                        {isAddItemsMode && (
                            <div className="mb-6 p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
                                <div className="flex items-center gap-2 mb-3">
                                    <TableIcon className="w-5 h-5 text-blue-500" />
                                    <h5 className="font-semibold text-gray-800">Mesa Activa</h5>
                                </div>
                                <span className="text-xl font-bold text-blue-700">Mesa {currentOrderName}</span>
                                <p className="text-sm text-gray-500 mt-1">Total de ítems actuales: {existingItemCount}</p>
                            </div>
                        )}

                        <div className="mb-6">
                            <div className="flex items-center gap-2 mb-3">
                                <ShoppingCartIcon className="w-5 h-5 text-gray-600" />
                                <h5 className="font-semibold text-gray-800">
                                    {isCheckoutMode ? 'Pagando' : isAddItemsMode ? 'Nuevos Ítems' : 'Comanda Actual'}
                                </h5>
                                {posItems.length > 0 && (
                                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                                        {posItems.length} items
                                    </span>
                                )}
                            </div>
                            
                            <div className="space-y-2 max-h-60 overflow-y-auto">
                                {posItems.map(item => (
                                    <div key={item.posItemId} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                                        <div className="flex-1 min-w-0">
                                            <div className="font-medium text-gray-800 text-sm truncate">
                                                {item.nombre}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                {formatCurrency(item.precio_unitario)} c/u
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {isNewOrAddMode && (
                                                <>
                                                    <button 
                                                        onClick={() => handleUpdateQuantity(item.producto_id, item.cantidad - 1)}
                                                        className="w-6 h-6 flex items-center justify-center bg-gray-200 rounded text-gray-600 hover:bg-gray-300 transition-colors"
                                                    >
                                                        -
                                                    </button>
                                                    <span className="text-sm font-medium w-6 text-center">
                                                        {item.cantidad}
                                                    </span>
                                                    <button 
                                                        onClick={() => handleUpdateQuantity(item.producto_id, item.cantidad + 1)}
                                                        className="w-6 h-6 flex items-center justify-center bg-gray-200 rounded text-gray-600 hover:bg-gray-300 transition-colors"
                                                    >
                                                        +
                                                    </button>
                                                    <button 
                                                        onClick={() => handleRemoveItem(item.producto_id)}
                                                        className="p-1 text-red-500 hover:text-red-700 transition-colors ml-1"
                                                    >
                                                        <TrashIcon className="w-4 h-4" />
                                                    </button>
                                                </>
                                            )}
                                            {isCheckoutMode && (
                                                <span className="text-sm font-medium bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                                    {item.cantidad}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                {posItems.length === 0 && (
                                    <div className="text-center py-8 text-gray-500">
                                        <ShoppingCartIcon className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                                        <p>No hay ítems en la comanda</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {isCheckoutMode && (
                            <div className="mb-6 p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
                                <h5 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                    <DollarSignIcon className="w-5 h-5 text-green-600" />
                                    Información de Pago
                                </h5>
                                
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Descuento ({moneda.simbolo})</label>
                                        <input
                                            type="number"
                                            value={descuentoMonto}
                                            onChange={(e) => {
                                                const monto = parseFloat(e.target.value) || 0;
                                                setDescuentoMonto(monto);
                                                if (subtotal > 0) {
                                                    setDescuentoPorcentaje((monto / subtotal) * 100);
                                                }
                                            }}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors"
                                            min="0"
                                            max={subtotal}
                                            step="0.01"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Descuento (%)</label>
                                        <input
                                            type="number"
                                            value={descuentoPorcentaje}
                                            onChange={(e) => setDescuentoPorcentaje(parseFloat(e.target.value) || 0)}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors"
                                            min="0"
                                            max="100"
                                            step="0.1"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Método de Pago</label>
                                        <select
                                            value={metodoPago}
                                            onChange={(e) => setMetodoPago(e.target.value as any)}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-colors"
                                        >
                                            <option value="Efectivo">💵 Efectivo</option>
                                            <option value="Tarjeta">💳 Tarjeta</option>
                                            <option value="Transferencia">📲 Transferencia</option>
                                            <option value="QR">📱 QR</option>
                                        </select>
                                    </div>

                                    <div className="mt-6 border-t border-gray-100 pt-4">
                                        <h5 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                            <UserIcon className="w-4 h-4 text-gray-600" />
                                            Buscar Cliente
                                        </h5>
                                        
                                        <div className="grid grid-cols-3 gap-2 mb-3">
                                            <select
                                                value={tipoDocumento}
                                                onChange={(e) => setTipoDocumento(e.target.value)}
                                                className="col-span-1 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-200"
                                            >
                                                <option value="DNI">DNI</option>
                                                <option value="RUC">RUC</option>
                                                <option value="Pasaporte">Pasaporte</option>
                                            </select>
                                            <input
                                                type="text"
                                                value={documentoIdentidad}
                                                onChange={(e) => setDocumentoIdentidad(e.target.value)}
                                                className="col-span-2 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-200"
                                                placeholder={`Número de ${tipoDocumento}`}
                                            />
                                        </div>
                                        <button 
                                            onClick={handleSearchClient}
                                            disabled={isSearchingClient || !documentoIdentidad}
                                            className="w-full mb-3 py-2 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 disabled:bg-gray-400 transition-colors flex items-center justify-center"
                                        >
                                            {isSearchingClient ? 'Buscando...' : 'Buscar'}
                                        </button>

                                        <div className="space-y-3 mt-3">
                                            <div>
                                                <label className="block text-xs font-medium text-gray-700 mb-1">Nombre Completo</label>
                                                <input
                                                    type="text"
                                                    value={clienteNombre}
                                                    onChange={(e) => setClienteNombre(e.target.value)}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-200"
                                                    placeholder="Nombre o Razón Social"
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-700 mb-1">Teléfono</label>
                                                <input
                                                    type="text"
                                                    value={clienteTelefono}
                                                    onChange={(e) => setClienteTelefono(e.target.value)}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-200"
                                                    placeholder="Teléfono"
                                                    required
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* SECCIÓN DE LEALTAD */}
                                    {loyaltyData && (
                                        <div className="mt-4 bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 rounded-xl p-4">
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="flex items-center gap-2">
                                                    <div className="p-1.5 bg-white rounded-lg shadow-sm text-indigo-600">
                                                        <StarIcon className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <h6 className="text-sm font-bold text-indigo-900">Programa de Lealtad</h6>
                                                        <p className="text-xs text-indigo-600">Puntos disponibles: <span className="font-bold">{loyaltyData.puntos}</span></p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-xs text-indigo-500 uppercase font-bold tracking-wider">Valor</p>
                                                    <p className="text-lg font-bold text-indigo-700">{formatCurrency(loyaltyData.valor_en_soles)}</p>
                                                </div>
                                            </div>

                                            {loyaltyData.puede_canjear ? (
                                                <div className="mt-3 flex items-center justify-between bg-white p-3 rounded-lg border border-indigo-100 shadow-sm">
                                                    <div className="flex items-center gap-2">
                                                        <GiftIcon className={`w-5 h-5 ${usarPuntos ? 'text-green-500' : 'text-gray-400'}`} />
                                                        <span className="text-sm font-medium text-gray-700">Canjear puntos</span>
                                                    </div>
                                                    <label className="relative inline-flex items-center cursor-pointer">
                                                        <input 
                                                            type="checkbox" 
                                                            className="sr-only peer"
                                                            checked={usarPuntos}
                                                            onChange={(e) => setUsarPuntos(e.target.checked)}
                                                        />
                                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                                                    </label>
                                                </div>
                                            ) : (
                                                <div className="mt-2 text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-lg border border-amber-100 flex items-center gap-2">
                                                    <span>⚠️</span>
                                                    Mínimo para canjear: {loyaltyData.config.minimo_canje} puntos
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {(isCheckoutMode || (isAddItemsMode && posItems.length > 0) || isNewOrder) && (
                            <div className="mb-6 p-4 bg-gradient-to-r from-gray-900 to-gray-800 rounded-xl text-white">
                                <h5 className="font-semibold mb-3 text-gray-200">Resumen Total</h5>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span>Subtotal</span>
                                        <span>{formatCurrency(subtotal)}</span>
                                    </div>
                                    {descuentoMonto > 0 && (
                                        <div className="flex justify-between text-sm text-red-300">
                                            <span>Descuento Manual</span>
                                            <span>- {formatCurrency(descuentoMonto)}</span>
                                        </div>
                                    )}
                                    {/* ✅ MOSTRAR DESCUENTO POR PUNTOS */}
                                    {descuentoPuntosMonto > 0 && (
                                        <div className="flex justify-between text-sm text-indigo-300 font-medium">
                                            <span className="flex items-center gap-1"><StarIcon className="w-3 h-3" /> Descuento Puntos</span>
                                            <span>- {formatCurrency(descuentoPuntosMonto)}</span>
                                        </div>
                                    )}
                                    <div className="border-t border-gray-600 pt-2 mt-2">
                                        <div className="flex justify-between text-lg font-bold">
                                            <span>Total</span>
                                            <span className="text-green-400">{formatCurrency(totalConDescuento)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="space-y-3">
                            <button
                                onClick={isNewOrder ? handleCreateOrder : isCheckoutMode ? handleCloseOrder : handleUpdateOrder}
                                disabled={isSubmitting || posItems.length === 0 || (isNewOrder && !selectedMesaId) || (isCheckoutMode && totalConDescuento <= 0)}
                                className="w-full py-4 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl font-semibold hover:from-green-700 hover:to-green-800 disabled:from-gray-400 disabled:to-gray-500 transition-all duration-200 flex items-center justify-center gap-2 shadow-lg disabled:shadow-none"
                            >
                                {isSubmitting ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        {isCheckoutMode ? 'Procesando...' : 'Enviando...'}
                                    </>
                                ) : (
                                    <>
                                        {isNewOrder || isAddItemsMode ? <SendIcon className="w-5 h-5 mr-2" /> : <CheckIcon className="w-5 h-5 mr-2" />}
                                        {isNewOrder 
                                            ? 'REALIZAR PEDIDO'
                                            : isCheckoutMode 
                                                ? `COBRAR ${formatCurrency(totalConDescuento)}`
                                                : 'ACTUALIZAR PEDIDO'
                                        }
                                    </>
                                )}
                            </button>
                            <button 
                                onClick={onClose} 
                                className="w-full py-3 text-gray-600 bg-gray-200 rounded-xl font-medium hover:bg-gray-300 transition-colors"
                            >
                                {isCheckoutMode ? 'Cancelar' : 'Cerrar'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PosOrderModal;