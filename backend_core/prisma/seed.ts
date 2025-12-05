/// <reference types="node" />

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de la base de datos...');

  // Crear rol Administrador si no existe
  const rolAdministrador = await prisma.roles.upsert({
    where: { nombre: 'Administrador' },
    update: {
      activo: true,
      descripcion: 'Rol con todos los permisos del sistema'
    },
    create: {
      nombre: 'Administrador',
      descripcion: 'Rol con todos los permisos del sistema',
      activo: true
    }
  });

  console.log('✅ Rol Administrador creado/actualizado:', rolAdministrador);

  // Crear otros roles básicos si lo deseas
  const rolMesero = await prisma.roles.upsert({
    where: { nombre: 'Mesero' },
    update: { activo: true },
    create: {
      nombre: 'Mesero',
      descripcion: 'Rol para empleados que atienden mesas',
      activo: true
    }
  });

  console.log('✅ Rol Mesero creado/actualizado:', rolMesero);

  const rolCajero = await prisma.roles.upsert({
    where: { nombre: 'Cajero' },
    update: { activo: true },
    create: {
      nombre: 'Cajero',
      descripcion: 'Rol para empleados que manejan la caja',
      activo: true
    }
  });

  console.log('✅ Rol Cajero creado/actualizado:', rolCajero);

  const rolCocinero = await prisma.roles.upsert({
    where: { nombre: 'Cocinero' },
    update: { activo: true },
    create: {
      nombre: 'Cocinero',
      descripcion: 'Rol para empleados de cocina',
      activo: true
    }
  });

  console.log('✅ Rol Cocinero creado/actualizado:', rolCocinero);

  console.log('🎉 Seed completado exitosamente');
}

main()
  .catch((e) => {
    console.error('❌ Error durante el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });