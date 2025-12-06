import { z } from 'zod';

export const productoInventarioSchema = z.object({
    nombre: z.string().min(3, { message: 'El nombre debe tener al menos 3 caracteres' }),
    categoria_inventario_id: z.number().min(1, { message: 'Debe seleccionar una categoría' }),
    unidad_medida_id: z.number().min(1, { message: 'Debe seleccionar una unidad de medida' }),
    codigo_barras: z.string().optional(),
    stock_actual: z.number().min(0, { message: 'El stock no puede ser negativo' }),
    costo_unitario: z.number().min(0, { message: 'El costo no puede ser negativo' }),
    stock_minimo: z.number().min(0, { message: 'El stock mínimo no puede ser negativo' }),
    stock_maximo: z.number().optional(),
});

export type ProductoInventarioSchema = z.infer<typeof productoInventarioSchema>;

export const comprasSchema = z.object({
    tipo_gasto_id: z.number().min(1, { message: 'El tipo de gasto es requerido' }),
    fecha: z.string().min(1, { message: 'La fecha es requerida' }),
    items: z.array(z.object({
        producto_inventario_id: z.number().min(1, { message: 'Seleccione un producto' }),
        cantidad: z.number().min(0.001, { message: 'La cantidad debe ser mayor a 0' }),
        costo_unitario: z.number().min(0.01, { message: 'El costo debe ser mayor a 0' }),
    })).min(1, { message: 'Debe agregar al menos un producto' }),
    numero_documento: z.string().optional(),
    observaciones: z.string().optional(),
    proveedor_id: z.number().nullable().optional(),
});

export type ComprasSchema = z.infer<typeof comprasSchema>;
