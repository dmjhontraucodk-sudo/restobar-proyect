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

  // Crear rol Gerente
  const rolGerente = await prisma.roles.upsert({
    where: { nombre: 'Gerente' },
    update: { activo: true, permissions: [] },
    create: {
      nombre: 'Gerente',
      descripcion: 'Rol con permisos de gestión y supervisión',
      activo: true,
      permissions: []
    }
  });
  console.log('✅ Rol Gerente creado/actualizado:', rolGerente);

  // Crear rol Jefe de Cocina
  const rolJefeCocina = await prisma.roles.upsert({
    where: { nombre: 'Jefe de Cocina' },
    update: { activo: true, permissions: [] },
    create: {
      nombre: 'Jefe de Cocina',
      descripcion: 'Rol para el encargado de la cocina y menú',
      activo: true,
      permissions: []
    }
  });
  console.log('✅ Rol Jefe de Cocina creado/actualizado:', rolJefeCocina);

  // Crear rol Host / Anfitrión
  const rolHost = await prisma.roles.upsert({
    where: { nombre: 'Host' },
    update: { activo: true, permissions: [] },
    create: {
      nombre: 'Host',
      descripcion: 'Rol para la gestión de mesas y bienvenida de clientes',
      activo: true,
      permissions: []
    }
  });
  console.log('✅ Rol Host creado/actualizado:', rolHost);

  // Crear rol Bartender
  const rolBartender = await prisma.roles.upsert({
    where: { nombre: 'Bartender' },
    update: { activo: true, permissions: [] },
    create: {
      nombre: 'Bartender',
      descripcion: 'Rol para la preparación y servicio de bebidas',
      activo: true,
      permissions: []
    }
  });
  console.log('✅ Rol Bartender creado/actualizado:', rolBartender);

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