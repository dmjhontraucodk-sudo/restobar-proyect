import { prisma } from '@shared/database/prisma.service';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { ALL_NAVIGATION_ITEMS } from '@modules/rbac/constants/navigation.constants';

export const authService = {
    async login(email: string, password: string): Promise<any> {
        try {
            const empleado = await prisma.empleados.findFirst({
                where: { email },
                include: {
                    roles: true,
                    tenants: true,
                },
            });

            if (!empleado) throw new Error('Usuario no encontrado');
            if (!empleado.requiere_login) throw new Error('Este usuario no tiene acceso al sistema.');
            if (!empleado.password_hash) throw new Error('Error de configuración del usuario.');
            if (!empleado.is_active) throw new Error('Tu cuenta ha sido desactivada.');

            const isPasswordCorrect = await bcrypt.compare(password, empleado.password_hash);
            if (!isPasswordCorrect) throw new Error('Credenciales inválidas');

            let permissions: string[] = [];
            if (empleado.roles.nombre === 'Administrador') {
              // Administrador tiene todos los permisos disponibles
              permissions = ALL_NAVIGATION_ITEMS.map(item => item.id);
            } else if (empleado.roles && empleado.roles.permissions) {
                permissions = empleado.roles.permissions as string[];
            }

            const payload = {
                id: empleado.id,
                email: empleado.email,
                tenant_id: empleado.tenant_id,
                rol_id: empleado.rol_id,
            };

            const token = jwt.sign(
                payload,
                process.env.JWT_SECRET as string,
                { expiresIn: '1d' }
            );

            return {
                token,
                user: {
                    id: empleado.id.toString(),
                    name: empleado.nombre || empleado.email.split('@')[0],
                    email: empleado.email,
                    role: empleado.roles.nombre,
                    permissions, // <--- PERMISOS AÑADIDOS
                    restaurantId: empleado.tenant_id.toString(),
                    tenantName: empleado.tenants.nombre_empresa,
                    tenantSubdomain: empleado.tenants.subdominio,
                    debe_cambiar_pass: empleado.debe_cambiar_pass || false,
                }
            };
        } catch (error: any) {
            throw new Error(error.message || 'Error en el login');
        }
    }
};