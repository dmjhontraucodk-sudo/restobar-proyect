const fs = require('fs');
const path = require('path');

// Función para arreglar un archivo específico
function fixFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`❌ Archivo no encontrado: ${filePath}`);
      return;
    }

    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;
    let cambios = 0;

    console.log(`\n📁 Procesando: ${filePath}`);

    // 1. Arreglar parámetros no usados en funciones Express
    // Para app.use, app.get, etc.
    if (filePath.includes('app.ts')) {
      content = content.replace(/\(req: Request,/g, '(_req: Request,');
      content = content.replace(/next: NextFunction\)/g, '_next: NextFunction)');
    }

    // 2. Arreglar funciones async que no retornan
    // Buscar funciones de controlador que no tienen return
    const asyncFuncRegex = /async (\w+)\((req|_req|request)[^)]*\)[^{]*\{/g;
    let match;
    const funcNames = [];
    
    while ((match = asyncFuncRegex.exec(content)) !== null) {
      funcNames.push(match[1]);
    }
    
    // Para cada función encontrada, asegurar que tiene tipo de retorno
    funcNames.forEach(funcName => {
      const funcPattern = new RegExp(`async ${funcName}\\([^)]*\\)\\s*(?::[^{]*)?\\{`, 'g');
      content = content.replace(funcPattern, (match) => {
        if (!match.includes(': Promise')) {
          cambios++;
          return match.replace('{', ': Promise<any> {');
        }
        return match;
      });
    });

    // 3. Arreglar try-catch sin return en controladores
    const tryCatchBlocks = content.match(/try\s*\{[\s\S]*?\}\s*catch\s*\([^)]*\)\s*\{[\s\S]*?\}/g);
    if (tryCatchBlocks) {
      tryCatchBlocks.forEach(block => {
        // Verificar si el catch tiene return
        if (block.includes('catch') && !block.includes('return res.')) {
          const lines = block.split('\n');
          const newLines = lines.map(line => {
            if (line.trim().startsWith('catch')) {
              return line + '\n    return res.status(500).json({ error: "Error interno" });';
            }
            return line;
          });
          const newBlock = newLines.join('\n');
          content = content.replace(block, newBlock);
          cambios++;
        }
      });
    }

    // 4. Arreglar variables específicas según archivo
    if (filePath.includes('pos-orders.controller.ts')) {
      content = content.replace(/metodo_pago/g, '_metodo_pago');
      content = content.replace(/updateEstadoSchema/g, '_updateEstadoSchema');
    }
    
    if (filePath.includes('auth.service.ts')) {
      content = content.replace(/existingEmail/g, '_existingEmail');
    }
    
    if (filePath.includes('gastos.service.ts')) {
      content = content.replace(/tenantId: number,/g, '_tenantId: number,');
    }
    
    if (filePath.includes('inventory-alerts.service.ts')) {
      content = content.replace(/productoInventarioId: number,/g, '_productoInventarioId: number,');
    }
    
    if (filePath.includes('web-orders.service.ts')) {
      content = content.replace(/address\?: string/g, '_address?: string');
    }

    // 5. Arreglar importaciones no usadas
    if (filePath.includes('empleados.controller.ts') || 
        filePath.includes('mesas.controller.ts') ||
        filePath.includes('pedidos-web-flow.controller.ts')) {
      content = content.replace(/import \{ Request, Response \}/g, 'import { Response }');
      content = content.replace(/import \{ Request, Response, NextFunction \}/g, 'import { Response, NextFunction }');
    }

    // 6. Arreglar destructuring no usado
    content = content.replace(/const \{ fechaInicio, fechaFin \} = req\.query;/g, 
      'const { fechaInicio, fechaFin } = req.query as { fechaInicio?: string; fechaFin?: string };');

    // 7. Arreglar tipos no usados
    content = content.replace(/type InvRequest = AuthRequest & RequestWithTenant;/g, 
      '// type InvRequest = AuthRequest & RequestWithTenant;');

    // Guardar si hubo cambios
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`  ✅ Guardado con ${cambios} cambios`);
    } else {
      console.log(`  ⚠️  Sin cambios necesarios`);
    }

  } catch (error) {
    console.error(`  ❌ Error procesando ${filePath}:`, error.message);
  }
}

// Función para encontrar todos los archivos TypeScript
function findTsFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    
    if (stat && stat.isDirectory()) {
      // No buscar en node_modules
      if (!file.includes('node_modules') && !file.includes('dist')) {
        results = results.concat(findTsFiles(file));
      }
    } else if (file.endsWith('.ts')) {
      results.push(file);
    }
  });
  
  return results;
}

// O específicamente los archivos problemáticos de tu error
const archivosEspecificos = [
  'src/app.ts',
  'src/controller/auth/reservations.controller.ts',
  'src/core/email/email.service.ts',
  'src/modules/auth/controllers/auth.controller.ts',
  'src/modules/auth/services/auth.service.ts',
  'src/modules/employees/controllers/empleados.controller.ts',
  'src/modules/finance/controllers/caja.controller.ts',
  'src/modules/finance/controllers/cierre-pos.controller.ts',
  'src/modules/finance/controllers/finanzas.controller.ts',
  'src/modules/finance/controllers/gastos.controller.ts',
  'src/modules/finance/controllers/nomina.controller.ts',
  'src/modules/finance/services/caja.service.ts',
  'src/modules/finance/services/gastos.service.ts',
  'src/modules/inventory/controllers/cierre-inventario.controller.ts',
  'src/modules/inventory/controllers/inventory.controller.ts',
  'src/modules/inventory/services/inventory-alerts.service.ts',
  'src/modules/inventory/services/inventory.service.ts',
  'src/modules/kitchen/controllers/ticket.controller.ts',
  'src/modules/orders/controllers/pedidos-web-flow.controller.ts',
  'src/modules/orders/controllers/pos-orders.controller.ts',
  'src/modules/orders/controllers/web-orders.controller.ts',
  'src/modules/orders/controllers/web-ready-orders.controller.ts',
  'src/modules/orders/services/pedidos-web-flow.service.ts',
  'src/modules/orders/services/pos-orders.service.ts',
  'src/modules/orders/services/web-orders.service.ts',
  'src/modules/orders/services/web-ready-orders.service.ts',
  'src/modules/reports/controllers/dashboard.controller.ts',
  'src/modules/reservations/controllers/reservations.controller.ts',
  'src/modules/tables/controllers/mesas.controller.ts',
  'src/modules/tenant/controllers/tenant-config.controller.ts',
  'src/modules/tenant/services/tenant-config.service.ts',
  'src/shared/middleware/auth.middleware.ts',
  'src/shared/middleware/upload.middleware.ts',
  'src/shared/middleware/verifyTenantAccess.ts'
];

console.log('🚀 Iniciando arreglo automático de TypeScript errors...');

// Opción 1: Procesar solo los archivos problemáticos
console.log(`📊 Procesando ${archivosEspecificos.length} archivos específicos...`);
archivosEspecificos.forEach(fixFile);

// Opción 2: Buscar automáticamente todos los archivos TS
console.log('\n🔍 Buscando más archivos TypeScript...');
const allTsFiles = findTsFiles('src');
console.log(`📊 Encontrados ${allTsFiles.length} archivos .ts`);

// Procesar algunos adicionales si existen
allTsFiles.forEach(file => {
  if (!archivosEspecificos.includes(file) && file.includes('controller') || file.includes('service')) {
    fixFile(file);
  }
});

console.log('\n🎉 Proceso completado!');
console.log('\n📋 Pasos siguientes:');
console.log('1. ✅ Revisa los cambios realizados');
console.log('2. 🔧 Crea tsconfig.build.json (si es necesario)');
console.log('3. 🚀 Ejecuta: npm run build');