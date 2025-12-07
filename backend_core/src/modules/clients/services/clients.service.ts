
import { FactilizaService } from '@shared/external-data/factiliza.service';
import { prisma } from '@shared/database/prisma.service';
import { ClientDataDto } from '../dto/client-data.dto';
import { webpedidos_estado } from '@prisma/client';

export const clientsService = {
  /**
   * Finds an existing client by telephone or creates a new one.
   * @param tenantId - The ID of the tenant.
   * @param data - The client data for finding or creating.
   * @returns The ID of the existing or newly created client.
   */
  async findOrCreateClient(tenantId: number, data: ClientDataDto): Promise<number> {
    const { documento_identidad, tipo_documento, cliente_telefono, nombre, cliente_email } = data;

    // Prioritize search by document ID if available
    if (documento_identidad) {
      const clientByDoc = await prisma.clientes.findFirst({
        where: { tenant_id: tenantId, documento_identidad: documento_identidad },
      });
      if (clientByDoc) {
        // Optional: Update client with latest phone/email if needed
        return clientByDoc.id;
      }
    }

    // Fallback to search by phone number
    if (cliente_telefono) {
      const clientByPhone = await prisma.clientes.findFirst({
        where: { tenant_id: tenantId, telefono: cliente_telefono },
      });
      if (clientByPhone) {
        // If found by phone, update it with the document ID if it doesn't have one
        if (documento_identidad && !clientByPhone.documento_identidad) {
          const updatedClient = await prisma.clientes.update({
            where: { id: clientByPhone.id },
            data: {
              documento_identidad: documento_identidad,
              tipo_documento: tipo_documento,
            },
          });
          return updatedClient.id;
        }
        return clientByPhone.id;
      }
    }

    // If no client is found, create a new one with all available data
    const newClient = await prisma.clientes.create({
      data: {
        tenant_id: tenantId,
        nombre: nombre,
        telefono: cliente_telefono,
        email: cliente_email,
        documento_identidad: documento_identidad,
        tipo_documento: tipo_documento,
      },
    });

    return newClient.id;
  },

  /**
   * Finds an existing client by telephone.
   * @param tenantId - The ID of the tenant.
   * @param telefono - The client's phone number.
   * @returns The client object or null if not found.
   */
  async findClientByPhone(tenantId: number, telefono: string) {
    return prisma.clientes.findFirst({
      where: {
        tenant_id: tenantId,
        telefono: telefono,
      },
    });
  },

  /**
   * Finds an existing client by document ID.
   * @param tenantId - The ID of the tenant.
   * @param documento_identidad - The client's document ID.
   * @returns The client object or null if not found.
   */
  async findClientByDocument(tenantId: number, documento_identidad: string) {
    const localClient = await prisma.clientes.findFirst({
      where: {
        tenant_id: tenantId,
        documento_identidad: documento_identidad,
      },
    });

    if (localClient) {
      return localClient;
    }

    try {
      const factilizaService = FactilizaService.getInstance();
      const reniecData = await factilizaService.findClientByDni(documento_identidad);

      if (reniecData.success && reniecData.data) {
        const newClient = await prisma.clientes.create({
          data: {
            tenant_id: tenantId,
            nombre: reniecData.data.nombre_completo,
            documento_identidad: documento_identidad,
            tipo_documento: 'DNI', // Assuming DNI, might need adjustment
            // telefono: '', // Optional
            // email: '', // Optional
          },
        });
        return newClient;
      }
    } catch (error) {
      console.error('Error during Factiliza lookup or client creation:', error);
      // Fallback to returning null if external service fails or returns no data
      return null;
    }

    return null;
  },

  async findClientForReview(tenantId: number, documento_identidad: string) {
    const client = await prisma.clientes.findFirst({
      where: {
        tenant_id: tenantId,
        documento_identidad: documento_identidad,
      },
    });

    if (!client) {
      return { success: false, error: 'Cliente no encontrado.' };
    }

    const deliveredOrder = await prisma.webpedidos.findFirst({
      where: {
        cliente_id: client.id,
        estado: webpedidos_estado.Entregado,
      },
    });

    if (!deliveredOrder) {
      return { success: false, error: 'No se encontraron pedidos entregados para este cliente.' };
    }

    return { success: true, client };
  },
};
