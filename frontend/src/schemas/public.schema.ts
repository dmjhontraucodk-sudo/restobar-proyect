import { z } from 'zod';

const telefonoPeruano = /^[9]\d{8}$/;

export const reservationSchema = z.object({
    cliente_nombre: z.string().min(3, { message: 'El nombre es requerido' }),
    cliente_telefono: z.string().regex(telefonoPeruano, { message: 'El teléfono debe empezar con 9 y tener 9 dígitos' }),
    cliente_email: z.string().email({ message: 'Email inválido' }).optional().or(z.literal('')),
    fecha_hora: z.string().min(1, { message: 'La fecha y hora son requeridas' }),
    cantidad_personas: z.number().min(1, { message: 'Debe haber al menos 1 persona' }),
    notas: z.string().optional(),
    mesa_id: z.number().nullable(),
});

export type ReservationSchema = z.infer<typeof reservationSchema>;

export const checkoutSchema = z.object({
    cliente_nombre: z.string().min(3, { message: 'El nombre es requerido' }),
    cliente_telefono: z.string().regex(telefonoPeruano, { message: 'El teléfono debe empezar con 9 y tener 9 dígitos' }),
    cliente_email: z.string().email({ message: 'Email inválido' }).optional().or(z.literal('')),
    tipo_pedido: z.enum(['RecogerEnTienda', 'EntregaDomicilio']),
    direccion_entrega: z.string().optional(),
    instrucciones_entrega: z.string().optional(),
    hora_programada: z.string().optional(),
    customTime: z.string().optional(),
    notas_especiales: z.string().optional(),
}).refine(data => {
    if (data.tipo_pedido === 'EntregaDomicilio') {
        return data.direccion_entrega && data.direccion_entrega.length > 0;
    }
    return true;
}, {
    message: 'La dirección es requerida para el delivery',
    path: ['direccion_entrega'],
});

export type CheckoutSchema = z.infer<typeof checkoutSchema>;
