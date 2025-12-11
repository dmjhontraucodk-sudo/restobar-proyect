import { prisma } from '@shared/database/prisma.service';
import bcrypt from 'bcryptjs';
import { emailService } from '@core/email/email.service';

export const provisioningService = {
  async createTenant(
    subdomain: string,
    tenantName: string,
    adminEmail: string,
    adminPassword: string
  ): Promise<any> {
    try {
      const existingSubdomain = await prisma.tenants.findUnique({ where: { subdominio: subdomain } });
      if (existingSubdomain) {
        throw new Error('Este subdominio ya está en uso.');
      }

      const salt = await bcrypt.genSalt(10);
      const password_hash = await bcrypt.hash(adminPassword, salt);

      const nuevoTenant = await prisma.tenants.create({
        data: {
          nombre_empresa: tenantName,
          subdominio: subdomain.toLowerCase(),
          isActive: true, // Activate the tenant immediately
        },
      });

      const rolPropietario = await prisma.roles.findFirst({ where: { nombre: 'Propietario' } });

      await prisma.empleados.create({
        data: {
          tenant_id: nuevoTenant.id,
          email: adminEmail,
          password_hash: password_hash,
          rol_id: rolPropietario?.id || 1,
          is_active: true,
          requiere_login: true,
          es_propietario: true,
          debe_cambiar_pass: false,
        },
      });

      // Optionally, you can still send a welcome email
      await emailService.sendRegistrationEmail(adminEmail, tenantName).catch(console.error);

      return nuevoTenant;
    } catch (error: any) {
      throw new Error(error.message || 'Error registrando tenant');
    }
  },
};
