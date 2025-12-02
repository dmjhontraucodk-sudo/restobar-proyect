import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email({ message: 'Email inválido' }),
  password: z.string().min(1, { message: 'La contraseña es requerida' }),
});

export type LoginSchema = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
    nombre_empresa: z.string().min(3, { message: 'El nombre de la empresa es requerido' }),
    subdominio: z.string().min(3, { message: 'El subdominio debe tener al menos 3 caracteres' }).regex(/^[a-z0-9-]+$/, { message: "El subdominio solo puede contener letras minúsculas, números y guiones" }),
    email_admin: z.string().email({ message: 'Email inválido' }),
    password: z.string().min(8, { message: 'La contraseña debe tener al menos 8 caracteres' }),
});

export type RegisterSchema = z.infer<typeof registerSchema>;
