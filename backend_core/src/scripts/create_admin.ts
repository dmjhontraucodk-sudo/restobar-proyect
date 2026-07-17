import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = 'monsterxredbull@gmail.com';
  const plainPassword = '12345';
  const password_hash = await bcrypt.hash(plainPassword, 10);

  console.log('🚀 Iniciando creación de administrador...');

  // 1. Asegurarnos de que existe el tenant (negocio)
  // Eliminamos 'plan' porque no existe en el schema.prisma
  const tenant = await prisma.tenants.upsert({
    where: { subdominio: 'mrb' },
    update: {},
    create: {
      nombre_empresa: 'Monster x RedBull',
      subdominio: 'mrb',
      isActive: true
    }
  });

  console.log(`✅ Tenant configurado: ${tenant.nombre_empresa} (${tenant.subdominio})`);

  // 2. Asegurarnos de que existe el rol Administrador
  const rol = await prisma.roles.upsert({
    where: { nombre: 'Administrador' },
    update: {},
    create: {
      nombre: 'Administrador',
      descripcion: 'Rol Administrador con acceso total',
      activo: true
    }
  });

  // 3. Crear o actualizar el empleado administrador
  const user = await prisma.empleados.findFirst({ where: { email } });
  
  if (user) {
    await prisma.empleados.update({
      where: { id: user.id },
      data: {
        password_hash,
        requiere_login: true,
        is_active: true,
        tenant_id: tenant.id,
        rol_id: rol.id
      }
    });
    console.log(`✅ Usuario actualizado: ${email}`);
  } else {
    await prisma.empleados.create({
      data: {
        email,
        password_hash,
        nombre: 'MONSTERxREDBULL',
        requiere_login: true,
        is_active: true,
        es_propietario: true,
        tenant_id: tenant.id,
        rol_id: rol.id
      }
    });
    console.log(`✅ Usuario creado: ${email}`);
  }

  console.log(`\n🎉 ¡Configuración lista!`);
  console.log(`Email: ${email}`);
  console.log(`Contraseña: ${plainPassword}`);
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
