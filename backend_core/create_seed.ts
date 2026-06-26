import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// ─── helpers ───────────────────────────────────────────────────────────────

const slug = (nombre: string) => nombre.toLowerCase().replace(/ /g, '-');

// ─── main ──────────────────────────────────────────────────────────────────

async function main() {
  console.log('🚀 Iniciando seed de datos para pruebas...\n');

  // ── 1. TENANT ─────────────────────────────────────────────────────────────
  const tenant = await prisma.tenants.upsert({
    where: { subdominio: 'mrb' },
    update: { isActive: true },
    create: {
      nombre_empresa: 'Monster x RedBull',
      subdominio: 'mrb',
      isActive: true,
    },
  });
  console.log(`✅ Tenant: ${tenant.nombre_empresa} (${tenant.subdominio}) — id ${tenant.id}`);

  // ── 2. ROL ADMINISTRADOR ──────────────────────────────────────────────────
  const rol = await prisma.roles.upsert({
    where: { nombre: 'Administrador' },
    update: {},
    create: {
      nombre: 'Administrador',
      descripcion: 'Rol Administrador con acceso total',
      activo: true,
    },
  });
  console.log(`✅ Rol: ${rol.nombre} — id ${rol.id}`);

  // ── 3. USUARIO ADMINISTRADOR ──────────────────────────────────────────────
  const email = 'monsterxredbull@gmail.com';
  const plainPassword = '12345';
  const password_hash = await bcrypt.hash(plainPassword, 10);

  const existingUser = await prisma.empleados.findFirst({ where: { email } });
  if (existingUser) {
    await prisma.empleados.update({
      where: { id: existingUser.id },
      data: { password_hash, requiere_login: true, is_active: true, tenant_id: tenant.id, rol_id: rol.id },
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
        rol_id: rol.id,
      },
    });
    console.log(`✅ Usuario creado: ${email}`);
  }

  // ── 4. CATEGORÍAS DEL MENÚ ────────────────────────────────────────────────
  const categorias = [
    { nombre: 'Entradas',       tipo: 'COMIDA' as const, orden: 1 },
    { nombre: 'Platos de Fondo', tipo: 'COMIDA' as const, orden: 2 },
    { nombre: 'Bebidas',         tipo: 'BEBIDA' as const, orden: 3 },
  ];

  const categoriaMap: Record<string, number> = {};

  for (const cat of categorias) {
    const catSlug = slug(cat.nombre);
    const created = await prisma.categoriasmenu.upsert({
      where: { tenant_id_slug: { tenant_id: tenant.id, slug: catSlug } },
      update: { nombre: cat.nombre, tipo: cat.tipo, orden: cat.orden },
      create: {
        tenant_id: tenant.id,
        nombre: cat.nombre,
        slug: catSlug,
        tipo: cat.tipo,
        orden: cat.orden,
        visible_en_web: true,
      },
    });
    categoriaMap[cat.nombre] = created.id;
    console.log(`✅ Categoría: ${created.nombre} — id ${created.id}`);
  }

  // ── 5. PRODUCTOS ──────────────────────────────────────────────────────────
  const productos = [
    {
      nombre: 'Lomo Saltado',
      categoria: 'Platos de Fondo',
      precio: 25.00,
      descripcion: 'Clásico lomo saltado con papas fritas y arroz',
    },
    {
      nombre: 'Inca Kola 1L',
      categoria: 'Bebidas',
      precio: 8.00,
      descripcion: 'Inca Kola botella 1 litro',
    },
  ];

  for (const prod of productos) {
    const categoriaId = categoriaMap[prod.categoria];
    if (!categoriaId) {
      console.warn(`⚠️  Categoría "${prod.categoria}" no encontrada para "${prod.nombre}"`);
      continue;
    }

    const existing = await prisma.productos.findFirst({
      where: { tenant_id: tenant.id, nombre: prod.nombre },
    });

    if (existing) {
      await prisma.productos.update({
        where: { id: existing.id },
        data: { precio: prod.precio, categoria_id: categoriaId, disponible: true },
      });
      console.log(`✅ Producto actualizado: ${prod.nombre} — S/ ${prod.precio}`);
    } else {
      await prisma.productos.create({
        data: {
          tenant_id: tenant.id,
          nombre: prod.nombre,
          descripcion: prod.descripcion,
          precio: prod.precio,
          categoria_id: categoriaId,
          disponible: true,
          visible_en_web: true,
        },
      });
      console.log(`✅ Producto creado: ${prod.nombre} — S/ ${prod.precio}`);
    }
  }

  // ── 6. LIMPIEZA DE ÓRDENES ABIERTAS EN MESAS CRÍTICAS ─────────────────────
  console.log('\n🧹 Limpiando órdenes abiertas en mesas críticas (2, 3, 5)...');

  const mesasCriticas = ['Mesa 2', 'Mesa 3', 'Mesa 5'];

  for (const nombreMesa of mesasCriticas) {
    const mesa = await prisma.mesas.findFirst({
      where: { tenant_id: tenant.id, nombre_o_numero: nombreMesa },
    });
    if (!mesa) continue;

    const ordenesAbiertas = await prisma.ordenes.findMany({
      where: {
        tenant_id: tenant.id,
        mesa_id: mesa.id,
        estado: { notIn: ['Cerrada', 'Pagada', 'Cancelada'] },
      },
      select: { id: true },
    });

    if (ordenesAbiertas.length === 0) continue;

    const ids = ordenesAbiertas.map(o => o.id);

    await prisma.ordendetalles.deleteMany({ where: { orden_id: { in: ids } } });
    await prisma.ordenes.deleteMany({ where: { id: { in: ids } } });
    console.log(`   🗑️  ${ordenesAbiertas.length} orden(es) eliminadas en ${nombreMesa}`);
  }

  // ── 7. MESAS ──────────────────────────────────────────────────────────────
  const mesas = ['Mesa 1', 'Mesa 2', 'Mesa 3', 'Mesa 4', 'Mesa 5', 'Mesa 6', 'Mesa 7', 'Mesa 8'];

  console.log('\n🪑 Configurando mesas...');
  for (const nombre of mesas) {
    await prisma.mesas.upsert({
      where: { tenant_id_nombre_o_numero: { tenant_id: tenant.id, nombre_o_numero: nombre } },
      update: { estado: 'Libre' },
      create: {
        tenant_id: tenant.id,
        nombre_o_numero: nombre,
        capacidad: 4,
        estado: 'Libre',
      },
    });
    console.log(`   ✅ ${nombre} — Libre`);
  }

  // ── 8. VERIFICAR QUE "CEVICHE MIXTO" NO EXISTA ───────────────────────────
  console.log('\n🔍 Verificando que "Ceviche Mixto" no exista...');
  const ceviche = await prisma.productos.findFirst({
    where: { tenant_id: tenant.id, nombre: 'Ceviche Mixto' },
  });
  if (ceviche) {
    await prisma.productos.delete({ where: { id: ceviche.id } });
    console.log('   🗑️  "Ceviche Mixto" eliminado (se crea en CP-09)');
  } else {
    console.log('   ✅ "Ceviche Mixto" no existe — correcto');
  }

  // ── RESUMEN ───────────────────────────────────────────────────────────────
  console.log(`
╔══════════════════════════════════════════════════════╗
║           ✅ SEED COMPLETADO                         ║
╠══════════════════════════════════════════════════════╣
║  URL      → http://mrb.localhost:5174                ║
║  Email    → monsterxredbull@gmail.com                ║
║  Password → 12345                                    ║
║  Rol      → Administrador                            ║
╠══════════════════════════════════════════════════════╣
║  Categorías: Entradas, Platos de Fondo, Bebidas      ║
║  Productos : Lomo Saltado (S/25), Inca Kola (S/8)   ║
║  Mesas     : 8 mesas en estado Libre                 ║
╚══════════════════════════════════════════════════════╝
  `);
}

main()
  .catch(e => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
