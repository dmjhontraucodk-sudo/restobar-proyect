import { z } from 'zod';

// --- Team Schemas ---
export const addIncidenciaSchema = z.object({
    monto: z.number().min(0.01, { message: 'El monto debe ser mayor a 0' }),
    motivo: z.string().min(3, { message: 'El motivo debe tener al menos 3 caracteres' }),
    es_adelanto: z.boolean(),
});

export type AddIncidenciaSchema = z.infer<typeof addIncidenciaSchema>;

// --- Empleado Schemas ---
const telefonoPeruano = /^[9]\d{8}$/;

export const createEmployeeSchema = z.object({
    nombre: z.string().min(3, { message: 'El nombre debe tener al menos 3 caracteres' }),
    email: z.string().email({ message: 'Email inválido' }),
    rol_id: z.number().min(1, { message: 'Debe seleccionar un rol' }),
    documento_identidad: z.string().length(8, { message: 'El DNI debe tener 8 dígitos' }).optional().or(z.literal('')),
    telefono: z.string().regex(telefonoPeruano, { message: 'El teléfono debe empezar con 9 y tener 9 dígitos' }).optional().or(z.literal('')),
    requiere_login: z.boolean(),
    password: z.string().optional(),
    salario: z.string().optional(),
    fecha_ingreso: z.string().optional(),
}).refine(data => {
    if (data.requiere_login) {
        return data.password && data.password.length >= 8;
    }
    return true;
}, {
    message: "La contraseña debe tener al menos 8 caracteres para usuarios con acceso",
    path: ["password"],
});

export type CreateEmployeeSchema = z.infer<typeof createEmployeeSchema>;

// --- Finanzas Schemas (Used in PagarNomina) ---
export const pagarNominaSchema = z.object({
    tipo_gasto_id: z.number().min(1, { message: 'El tipo de gasto es requerido' }),
    fecha: z.string().min(1, { message: 'La fecha es requerida' }),
    monto: z.number().min(0.01, { message: 'El monto debe ser mayor a 0' }),
    descripcion: z.string().min(3, { message: 'La descripción es requerida' }),
    metodo_pago: z.string().min(3, { message: 'El método de pago es requerido' }),
    descuentos_ids: z.array(z.number()).optional(),
});

export type PagarNominaSchema = z.infer<typeof pagarNominaSchema>;
