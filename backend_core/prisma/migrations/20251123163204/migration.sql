-- CreateTable
CREATE TABLE `categorias_inventario` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `tenant_id` INTEGER NOT NULL,
    `nombre` VARCHAR(100) NOT NULL,
    `descripcion` TEXT NULL,
    `color` VARCHAR(7) NULL,
    `icono` VARCHAR(50) NULL,
    `orden` INTEGER NULL DEFAULT 0,
    `activa` BOOLEAN NOT NULL DEFAULT true,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `categorias_inventario_tenant_id_idx`(`tenant_id`),
    INDEX `activa_idx`(`activa`),
    UNIQUE INDEX `tenant_categoria_inventario`(`tenant_id`, `nombre`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tipos_gasto` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `tenant_id` INTEGER NOT NULL,
    `nombre` VARCHAR(100) NOT NULL,
    `descripcion` TEXT NULL,
    `afecta_inventario` BOOLEAN NOT NULL DEFAULT false,
    `color` VARCHAR(7) NULL,
    `icono` VARCHAR(50) NULL,
    `orden` INTEGER NULL DEFAULT 0,
    `activo` BOOLEAN NOT NULL DEFAULT true,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `tipos_gasto_tenant_id_idx`(`tenant_id`),
    INDEX `tipos_gasto_activo_idx`(`activo`),
    UNIQUE INDEX `tipos_gasto_tenant_id_nombre_key`(`tenant_id`, `nombre`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `unidades_medida` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `tenant_id` INTEGER NOT NULL,
    `nombre` VARCHAR(50) NOT NULL,
    `abreviatura` VARCHAR(10) NOT NULL,
    `tipo` VARCHAR(50) NULL,
    `activa` BOOLEAN NOT NULL DEFAULT true,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `unidades_medida_tenant_id_idx`(`tenant_id`),
    UNIQUE INDEX `tenant_unidad_medida`(`tenant_id`, `nombre`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `productos_inventario` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `tenant_id` INTEGER NOT NULL,
    `categoria_inventario_id` INTEGER NULL,
    `unidad_medida_id` INTEGER NULL,
    `nombre` VARCHAR(255) NOT NULL,
    `codigo_barras` VARCHAR(50) NULL,
    `stock_actual` DECIMAL(10, 3) NULL DEFAULT 0.000,
    `costo_unitario` DECIMAL(10, 2) NULL DEFAULT 0.00,
    `stock_minimo` DECIMAL(10, 3) NULL DEFAULT 0.000,
    `stock_maximo` DECIMAL(10, 3) NULL,
    `ultimo_conteo` TIMESTAMP(0) NULL,
    `stock_anterior` DECIMAL(10, 3) NULL DEFAULT 0.000,
    `activo` BOOLEAN NOT NULL DEFAULT true,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `productos_inventario_tenant_id_idx`(`tenant_id`),
    INDEX `categoria_inventario_id`(`categoria_inventario_id`),
    INDEX `unidad_medida_id`(`unidad_medida_id`),
    INDEX `activo_idx`(`activo`),
    UNIQUE INDEX `tenant_producto_inventario`(`tenant_id`, `nombre`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `compras` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `tenant_id` INTEGER NOT NULL,
    `tipo_gasto_id` INTEGER NOT NULL,
    `proveedor_id` INTEGER NULL,
    `fecha` DATETIME(0) NOT NULL,
    `total` DECIMAL(10, 2) NOT NULL,
    `numero_documento` VARCHAR(100) NULL,
    `observaciones` TEXT NULL,
    `estado_compra` VARCHAR(50) NOT NULL DEFAULT 'Pendiente',
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `compras_tenant_id_idx`(`tenant_id`),
    INDEX `compras_tipo_gasto_id_idx`(`tipo_gasto_id`),
    INDEX `compras_proveedor_id_idx`(`proveedor_id`),
    INDEX `compras_estado_compra_idx`(`estado_compra`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `compras_detalles` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `tenant_id` INTEGER NOT NULL,
    `compra_id` INTEGER NOT NULL,
    `producto_inventario_id` INTEGER NOT NULL,
    `cantidad` DECIMAL(10, 3) NOT NULL,
    `costo_unitario` DECIMAL(10, 2) NOT NULL,

    INDEX `compras_detalles_tenant_id_idx`(`tenant_id`),
    INDEX `compras_detalles_compra_id_idx`(`compra_id`),
    INDEX `compras_detalles_producto_inventario_id_idx`(`producto_inventario_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `gastos` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `tenant_id` INTEGER NOT NULL,
    `tipo_gasto_id` INTEGER NOT NULL,
    `proveedor_id` INTEGER NULL,
    `fecha` DATETIME(0) NOT NULL,
    `monto` DECIMAL(10, 2) NOT NULL,
    `numero_documento` VARCHAR(100) NULL,
    `descripcion` TEXT NULL,
    `metodo_pago` VARCHAR(50) NULL,
    `aprobado_por_id` INTEGER NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `gastos_tenant_id_idx`(`tenant_id`),
    INDEX `gastos_tipo_gasto_id_idx`(`tipo_gasto_id`),
    INDEX `gastos_fecha_idx`(`fecha`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `conteos_fisicos` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `tenant_id` INTEGER NOT NULL,
    `fecha_conteo` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `realizado_por` VARCHAR(255) NULL,
    `notas` TEXT NULL,
    `total_productos` INTEGER NULL,
    `valor_total` DECIMAL(10, 2) NULL,
    `diferencia_total` DECIMAL(10, 2) NULL,

    INDEX `conteos_fisicos_tenant_id_idx`(`tenant_id`),
    INDEX `fecha_conteo_idx`(`fecha_conteo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `conteos_detalles` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `tenant_id` INTEGER NOT NULL,
    `conteo_id` INTEGER NOT NULL,
    `producto_inventario_id` INTEGER NOT NULL,
    `stock_sistema` DECIMAL(10, 3) NOT NULL,
    `stock_fisico` DECIMAL(10, 3) NOT NULL,
    `diferencia` DECIMAL(10, 3) NOT NULL,
    `costo_unitario` DECIMAL(10, 2) NOT NULL,
    `valor_diferencia` DECIMAL(10, 2) NOT NULL,
    `observaciones` TEXT NULL,

    INDEX `conteos_detalles_tenant_id_idx`(`tenant_id`),
    INDEX `conteo_id`(`conteo_id`),
    INDEX `producto_inventario_id`(`producto_inventario_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `proveedores` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `tenant_id` INTEGER NOT NULL,
    `nombre_empresa` VARCHAR(255) NOT NULL,
    `contacto_nombre` VARCHAR(255) NULL,
    `email` VARCHAR(255) NULL,
    `telefono` VARCHAR(50) NULL,
    `direccion` TEXT NULL,
    `ruc` VARCHAR(20) NULL,
    `activo` BOOLEAN NOT NULL DEFAULT true,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `proveedores_tenant_id_idx`(`tenant_id`),
    UNIQUE INDEX `tenant_proveedor`(`tenant_id`, `nombre_empresa`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `categoriasmenu` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `tenant_id` INTEGER NOT NULL,
    `nombre` VARCHAR(100) NOT NULL,
    `tipo` ENUM('COMIDA', 'BEBIDA') NOT NULL DEFAULT 'COMIDA',
    `slug` VARCHAR(100) NULL,
    `descripcion` TEXT NULL,
    `orden` INTEGER NULL DEFAULT 0,
    `visible_en_web` BOOLEAN NULL DEFAULT false,

    INDEX `categoriasmenu_tenant_id_idx`(`tenant_id`),
    UNIQUE INDEX `tenant_slug`(`tenant_id`, `slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `productos` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `tenant_id` INTEGER NOT NULL,
    `categoria_id` INTEGER NOT NULL,
    `nombre` VARCHAR(255) NOT NULL,
    `descripcion` TEXT NULL,
    `precio` DECIMAL(10, 2) NOT NULL,
    `foto_url` VARCHAR(2048) NULL,
    `disponible` BOOLEAN NULL DEFAULT true,
    `visible_en_web` BOOLEAN NULL DEFAULT false,
    `es_vegetariano` BOOLEAN NULL DEFAULT false,
    `es_vegano` BOOLEAN NULL DEFAULT false,
    `sin_gluten` BOOLEAN NULL DEFAULT false,
    `es_picante` BOOLEAN NULL DEFAULT false,
    `es_recomendado` BOOLEAN NULL DEFAULT false,
    `es_nuevo` BOOLEAN NULL DEFAULT false,
    `producto_inventario_id` INTEGER NULL,

    INDEX `categoria_id`(`categoria_id`),
    INDEX `productos_tenant_id_idx`(`tenant_id`),
    INDEX `es_recomendado`(`es_recomendado`),
    INDEX `es_nuevo`(`es_nuevo`),
    INDEX `productos_producto_inventario_id_idx`(`producto_inventario_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `webpedidos` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `tenant_id` INTEGER NOT NULL,
    `cliente_id` INTEGER NULL,
    `cliente_nombre` VARCHAR(255) NOT NULL,
    `cliente_email` VARCHAR(255) NULL,
    `cliente_telefono` VARCHAR(50) NOT NULL,
    `tipo_pedido` ENUM('RecogerEnTienda', 'EntregaDomicilio') NOT NULL,
    `estado` ENUM('Pendiente', 'Confirmado', 'EnPreparacion', 'ListoParaRecoger', 'EnCamino', 'Entregado', 'Cancelado') NOT NULL DEFAULT 'Pendiente',
    `numero_pedido` VARCHAR(50) NOT NULL,
    `subtotal` DECIMAL(10, 2) NOT NULL,
    `total` DECIMAL(10, 2) NOT NULL,
    `costo_envio` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `direccion_entrega` TEXT NULL,
    `instrucciones_entrega` TEXT NULL,
    `hora_programada` TIMESTAMP(0) NULL,
    `notas_especiales` TEXT NULL,
    `notas` TEXT NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `updated_at` TIMESTAMP(0) NULL,

    INDEX `webpedidos_tenant_id_idx`(`tenant_id`),
    INDEX `cliente_id`(`cliente_id`),
    INDEX `estado`(`estado`),
    INDEX `created_at`(`created_at`),
    INDEX `hora_programada`(`hora_programada`),
    UNIQUE INDEX `tenant_numero_pedido`(`tenant_id`, `numero_pedido`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `webpedidos_detalles` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `tenant_id` INTEGER NOT NULL,
    `webpedido_id` INTEGER NOT NULL,
    `producto_id` INTEGER NOT NULL,
    `cantidad` INTEGER NOT NULL,
    `precio_unitario` DECIMAL(10, 2) NOT NULL,
    `subtotal` DECIMAL(10, 2) NOT NULL,

    INDEX `webpedidos_detalles_tenant_id_idx`(`tenant_id`),
    INDEX `webpedido_id`(`webpedido_id`),
    INDEX `producto_id`(`producto_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tenant_config_pedidos` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `tenant_id` INTEGER NOT NULL,
    `dias_limite_reserva` INTEGER NOT NULL DEFAULT 2,
    `notif_pedido_confirmado` BOOLEAN NOT NULL DEFAULT true,
    `notif_pedido_cancelado` BOOLEAN NOT NULL DEFAULT true,
    `notif_pedido_listo` BOOLEAN NOT NULL DEFAULT true,
    `email_asunto_confirmado` VARCHAR(255) NULL,
    `email_asunto_cancelado` VARCHAR(255) NULL,
    `email_asunto_listo` VARCHAR(255) NULL,
    `costo_envio_estandar` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `monto_minimo_pedido` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `tiempo_preparacion_promedio` INTEGER NOT NULL DEFAULT 30,
    `horario_apertura` VARCHAR(50) NOT NULL DEFAULT '08:00',
    `horario_cierre` VARCHAR(50) NOT NULL DEFAULT '22:00',

    UNIQUE INDEX `tenant_config_pedidos_tenant_id_key`(`tenant_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `clientes` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `tenant_id` INTEGER NOT NULL,
    `nombre` VARCHAR(255) NOT NULL,
    `email` VARCHAR(255) NULL,
    `telefono` VARCHAR(50) NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `clientes_tenant_id_email_key`(`tenant_id`, `email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `empleados` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `tenant_id` INTEGER NOT NULL,
    `rol_id` INTEGER NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `password_hash` VARCHAR(255) NULL,
    `nombre` VARCHAR(255) NULL,
    `documento_identidad` VARCHAR(50) NULL,
    `telefono` VARCHAR(50) NULL,
    `requiere_login` BOOLEAN NOT NULL DEFAULT false,
    `es_propietario` BOOLEAN NOT NULL DEFAULT false,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `debe_cambiar_pass` BOOLEAN NOT NULL DEFAULT true,
    `salario` DECIMAL(10, 2) NULL,
    `fecha_ingreso` DATE NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `rol_id`(`rol_id`),
    INDEX `empleados_tenant_id_requiere_login_idx`(`tenant_id`, `requiere_login`),
    INDEX `empleados_tenant_id_es_propietario_idx`(`tenant_id`, `es_propietario`),
    UNIQUE INDEX `empleados_tenant_id_email_key`(`tenant_id`, `email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `descuentos_empleados` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `tenant_id` INTEGER NOT NULL,
    `empleado_id` INTEGER NOT NULL,
    `monto` DECIMAL(10, 2) NOT NULL,
    `motivo` VARCHAR(255) NOT NULL,
    `fecha` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `estado` VARCHAR(50) NOT NULL DEFAULT 'Pendiente',
    `gasto_id` INTEGER NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `descuentos_empleados_tenant_id_idx`(`tenant_id`),
    INDEX `descuentos_empleados_empleado_id_idx`(`empleado_id`),
    INDEX `descuentos_empleados_gasto_id_idx`(`gasto_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ordenes` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `tenant_id` INTEGER NOT NULL,
    `mesa_id` INTEGER NOT NULL,
    `empleado_id` INTEGER NOT NULL,
    `estado` ENUM('Abierta', 'Cerrada', 'Pagada', 'Cancelada') NULL DEFAULT 'Abierta',
    `subtotal` DECIMAL(10, 2) NULL DEFAULT 0.00,
    `descuento` DECIMAL(10, 2) NULL DEFAULT 0.00,
    `total` DECIMAL(10, 2) NULL DEFAULT 0.00,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `closed_at` TIMESTAMP(0) NULL,
    `webpedido_id` INTEGER NULL,

    INDEX `empleado_id`(`empleado_id`),
    INDEX `mesa_id`(`mesa_id`),
    INDEX `ordenes_tenant_id_idx`(`tenant_id`),
    INDEX `webpedido_id`(`webpedido_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ordendetalles` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `tenant_id` INTEGER NOT NULL,
    `orden_id` INTEGER NOT NULL,
    `producto_id` INTEGER NOT NULL,
    `cantidad` INTEGER NOT NULL,
    `precio_unitario` DECIMAL(10, 2) NOT NULL,
    `notas` TEXT NULL,

    INDEX `orden_id`(`orden_id`),
    INDEX `producto_id`(`producto_id`),
    INDEX `ordendetalles_tenant_id_idx`(`tenant_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pagos` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `tenant_id` INTEGER NOT NULL,
    `orden_id` INTEGER NOT NULL,
    `empleado_id` INTEGER NOT NULL,
    `metodo_pago` ENUM('Efectivo', 'Tarjeta', 'Transferencia', 'Otro') NOT NULL,
    `monto` DECIMAL(10, 2) NOT NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `empleado_id`(`empleado_id`),
    INDEX `orden_id`(`orden_id`),
    INDEX `pagos_tenant_id_idx`(`tenant_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `reservas` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `tenant_id` INTEGER NOT NULL,
    `cliente_id` INTEGER NULL,
    `mesa_id` INTEGER NULL,
    `cliente_nombre` VARCHAR(255) NOT NULL,
    `cliente_email` VARCHAR(255) NULL,
    `cliente_telefono` VARCHAR(50) NOT NULL,
    `fecha_hora` DATETIME(0) NOT NULL,
    `cantidad_personas` INTEGER NOT NULL,
    `estado` ENUM('Pendiente', 'Confirmada', 'Cancelada', 'Completada') NULL DEFAULT 'Pendiente',
    `notas` TEXT NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `cliente_id`(`cliente_id`),
    INDEX `mesa_id`(`mesa_id`),
    INDEX `reservas_tenant_id_idx`(`tenant_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `roles` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(50) NOT NULL,
    `descripcion` TEXT NULL,
    `activo` BOOLEAN NOT NULL DEFAULT true,

    UNIQUE INDEX `nombre`(`nombre`),
    INDEX `activo_idx`(`activo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `eventos` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `tenant_id` INTEGER NOT NULL,
    `titulo` VARCHAR(255) NOT NULL,
    `descripcion` TEXT NULL,
    `fecha_evento` DATETIME(0) NULL,
    `imagen_url` VARCHAR(2048) NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `eventos_tenant_id_idx`(`tenant_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `galeriafotos` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `tenant_id` INTEGER NOT NULL,
    `titulo` VARCHAR(255) NULL,
    `descripcion` TEXT NULL,
    `foto_url` VARCHAR(2048) NOT NULL,
    `orden` INTEGER NULL DEFAULT 0,

    INDEX `galeriafotos_tenant_id_idx`(`tenant_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `mesas` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `tenant_id` INTEGER NOT NULL,
    `nombre_o_numero` VARCHAR(50) NOT NULL,
    `capacidad` INTEGER NULL DEFAULT 0,
    `estado` ENUM('Libre', 'Ocupada', 'Reservada') NULL DEFAULT 'Libre',

    UNIQUE INDEX `mesas_tenant_id_nombre_o_numero_key`(`tenant_id`, `nombre_o_numero`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tenants` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre_empresa` VARCHAR(255) NOT NULL,
    `subdominio` VARCHAR(100) NOT NULL,
    `isActive` BOOLEAN NULL DEFAULT false,
    `configuracion` LONGTEXT NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    UNIQUE INDEX `subdominio`(`subdominio`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cierres_inventario` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `tenant_id` INTEGER NOT NULL,
    `fecha_inicio` DATETIME(3) NOT NULL,
    `fecha_fin` DATETIME(3) NOT NULL,
    `tipo_cierre` VARCHAR(191) NOT NULL,
    `estado` VARCHAR(191) NOT NULL DEFAULT 'Borrador',
    `total_diferencias` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `observaciones` TEXT NULL,
    `realizado_por_id` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `cierres_inventario_tenant_id_idx`(`tenant_id`),
    INDEX `cierres_inventario_fecha_inicio_idx`(`fecha_inicio`),
    INDEX `cierres_inventario_estado_idx`(`estado`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cierres_inventario_detalles` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `cierre_id` INTEGER NOT NULL,
    `producto_inventario_id` INTEGER NOT NULL,
    `stock_sistema` DECIMAL(10, 3) NOT NULL,
    `stock_fisico` DECIMAL(10, 3) NOT NULL,
    `diferencia` DECIMAL(10, 3) NOT NULL,
    `tipo_diferencia` VARCHAR(191) NULL,
    `valor_diferencia` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `notas` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `cierres_inventario_detalles_cierre_id_idx`(`cierre_id`),
    INDEX `cierres_inventario_detalles_producto_inventario_id_idx`(`producto_inventario_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `kardex` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `tenant_id` INTEGER NOT NULL,
    `fecha` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `tipo_movimiento` VARCHAR(20) NOT NULL,
    `motivo` VARCHAR(100) NOT NULL,
    `producto_inventario_id` INTEGER NOT NULL,
    `cantidad` DECIMAL(10, 3) NOT NULL,
    `costo_unitario` DECIMAL(10, 2) NOT NULL,
    `valor_total` DECIMAL(10, 2) NOT NULL,
    `saldo_cantidad` DECIMAL(10, 3) NOT NULL,
    `saldo_valor` DECIMAL(10, 2) NOT NULL,
    `documento_tipo` VARCHAR(50) NULL,
    `documento_id` INTEGER NULL,
    `usuario_id` INTEGER NULL,
    `observaciones` TEXT NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `kardex_tenant_id_idx`(`tenant_id`),
    INDEX `kardex_producto_inventario_id_idx`(`producto_inventario_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cajas` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `tenant_id` INTEGER NOT NULL,
    `fecha_apertura` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `fecha_cierre` TIMESTAMP(0) NULL,
    `usuario_responsable_id` INTEGER NOT NULL,
    `monto_inicial` DECIMAL(10, 2) NOT NULL,
    `monto_esperado` DECIMAL(10, 2) NULL DEFAULT 0.00,
    `monto_real` DECIMAL(10, 2) NULL,
    `diferencia` DECIMAL(10, 2) NULL,
    `estado` ENUM('Abierta', 'Cerrada') NOT NULL DEFAULT 'Abierta',
    `observaciones` TEXT NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `cajas_tenant_id_idx`(`tenant_id`),
    INDEX `cajas_usuario_responsable_id_idx`(`usuario_responsable_id`),
    INDEX `cajas_estado_idx`(`estado`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cajas_movimientos` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `caja_id` INTEGER NOT NULL,
    `tenant_id` INTEGER NOT NULL,
    `tipo` ENUM('INGRESO', 'EGRESO') NOT NULL,
    `concepto` VARCHAR(255) NOT NULL,
    `monto` DECIMAL(10, 2) NOT NULL,
    `metodo_pago` ENUM('Efectivo', 'Tarjeta', 'Transferencia', 'Otro') NOT NULL,
    `documento_tipo` VARCHAR(50) NULL,
    `documento_id` INTEGER NULL,
    `usuario_id` INTEGER NOT NULL,
    `fecha_hora` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),
    `notas` TEXT NULL,

    INDEX `cajas_movimientos_caja_id_idx`(`caja_id`),
    INDEX `cajas_movimientos_tenant_id_idx`(`tenant_id`),
    INDEX `cajas_movimientos_usuario_id_idx`(`usuario_id`),
    INDEX `cajas_movimientos_tipo_idx`(`tipo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `categorias_inventario` ADD CONSTRAINT `categorias_inventario_tenant_id_fkey` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tipos_gasto` ADD CONSTRAINT `tipos_gasto_tenant_id_fkey` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `unidades_medida` ADD CONSTRAINT `unidades_medida_tenant_id_fkey` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `productos_inventario` ADD CONSTRAINT `productos_inventario_tenant_id_fkey` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `productos_inventario` ADD CONSTRAINT `productos_inventario_categoria_inventario_id_fkey` FOREIGN KEY (`categoria_inventario_id`) REFERENCES `categorias_inventario`(`id`) ON DELETE SET NULL ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `productos_inventario` ADD CONSTRAINT `productos_inventario_unidad_medida_id_fkey` FOREIGN KEY (`unidad_medida_id`) REFERENCES `unidades_medida`(`id`) ON DELETE SET NULL ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `compras` ADD CONSTRAINT `compras_tenant_id_fkey` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `compras` ADD CONSTRAINT `compras_tipo_gasto_id_fkey` FOREIGN KEY (`tipo_gasto_id`) REFERENCES `tipos_gasto`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `compras` ADD CONSTRAINT `compras_proveedor_id_fkey` FOREIGN KEY (`proveedor_id`) REFERENCES `proveedores`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `compras_detalles` ADD CONSTRAINT `compras_detalles_tenant_id_fkey` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `compras_detalles` ADD CONSTRAINT `compras_detalles_compra_id_fkey` FOREIGN KEY (`compra_id`) REFERENCES `compras`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `compras_detalles` ADD CONSTRAINT `compras_detalles_producto_inventario_id_fkey` FOREIGN KEY (`producto_inventario_id`) REFERENCES `productos_inventario`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `gastos` ADD CONSTRAINT `gastos_tenant_id_fkey` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `gastos` ADD CONSTRAINT `gastos_tipo_gasto_id_fkey` FOREIGN KEY (`tipo_gasto_id`) REFERENCES `tipos_gasto`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `gastos` ADD CONSTRAINT `gastos_proveedor_id_fkey` FOREIGN KEY (`proveedor_id`) REFERENCES `proveedores`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `gastos` ADD CONSTRAINT `gastos_aprobado_por_id_fkey` FOREIGN KEY (`aprobado_por_id`) REFERENCES `empleados`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `conteos_fisicos` ADD CONSTRAINT `conteos_fisicos_tenant_id_fkey` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `conteos_detalles` ADD CONSTRAINT `conteos_detalles_tenant_id_fkey` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `conteos_detalles` ADD CONSTRAINT `conteos_detalles_conteo_id_fkey` FOREIGN KEY (`conteo_id`) REFERENCES `conteos_fisicos`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `conteos_detalles` ADD CONSTRAINT `conteos_detalles_producto_inventario_id_fkey` FOREIGN KEY (`producto_inventario_id`) REFERENCES `productos_inventario`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `proveedores` ADD CONSTRAINT `proveedores_tenant_id_fkey` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `categoriasmenu` ADD CONSTRAINT `categoriasmenu_ibfk_1` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `productos` ADD CONSTRAINT `productos_ibfk_1` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `productos` ADD CONSTRAINT `productos_ibfk_2` FOREIGN KEY (`categoria_id`) REFERENCES `categoriasmenu`(`id`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `productos` ADD CONSTRAINT `productos_producto_inventario_id_fkey` FOREIGN KEY (`producto_inventario_id`) REFERENCES `productos_inventario`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `webpedidos` ADD CONSTRAINT `webpedidos_tenant_id_fkey` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `webpedidos` ADD CONSTRAINT `webpedidos_cliente_id_fkey` FOREIGN KEY (`cliente_id`) REFERENCES `clientes`(`id`) ON DELETE SET NULL ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `webpedidos_detalles` ADD CONSTRAINT `webpedidos_detalles_tenant_id_fkey` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `webpedidos_detalles` ADD CONSTRAINT `webpedidos_detalles_webpedido_id_fkey` FOREIGN KEY (`webpedido_id`) REFERENCES `webpedidos`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `webpedidos_detalles` ADD CONSTRAINT `webpedidos_detalles_producto_id_fkey` FOREIGN KEY (`producto_id`) REFERENCES `productos`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `tenant_config_pedidos` ADD CONSTRAINT `tenant_config_pedidos_tenant_id_fkey` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `clientes` ADD CONSTRAINT `clientes_ibfk_1` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `empleados` ADD CONSTRAINT `empleados_ibfk_1` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `empleados` ADD CONSTRAINT `empleados_ibfk_2` FOREIGN KEY (`rol_id`) REFERENCES `roles`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `descuentos_empleados` ADD CONSTRAINT `descuentos_empleados_tenant_id_fkey` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `descuentos_empleados` ADD CONSTRAINT `descuentos_empleados_empleado_id_fkey` FOREIGN KEY (`empleado_id`) REFERENCES `empleados`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `descuentos_empleados` ADD CONSTRAINT `descuentos_empleados_gasto_id_fkey` FOREIGN KEY (`gasto_id`) REFERENCES `gastos`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ordenes` ADD CONSTRAINT `ordenes_ibfk_1` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `ordenes` ADD CONSTRAINT `ordenes_ibfk_2` FOREIGN KEY (`mesa_id`) REFERENCES `mesas`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `ordenes` ADD CONSTRAINT `ordenes_ibfk_3` FOREIGN KEY (`empleado_id`) REFERENCES `empleados`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `ordenes` ADD CONSTRAINT `ordenes_ibfk_4` FOREIGN KEY (`webpedido_id`) REFERENCES `webpedidos`(`id`) ON DELETE SET NULL ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `ordendetalles` ADD CONSTRAINT `ordendetalles_tenant_id_fkey` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `ordendetalles` ADD CONSTRAINT `ordendetalles_orden_id_fkey` FOREIGN KEY (`orden_id`) REFERENCES `ordenes`(`id`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `ordendetalles` ADD CONSTRAINT `ordendetalles_producto_id_fkey` FOREIGN KEY (`producto_id`) REFERENCES `productos`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `pagos` ADD CONSTRAINT `pagos_ibfk_1` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `pagos` ADD CONSTRAINT `pagos_ibfk_2` FOREIGN KEY (`orden_id`) REFERENCES `ordenes`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `pagos` ADD CONSTRAINT `pagos_ibfk_3` FOREIGN KEY (`empleado_id`) REFERENCES `empleados`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `reservas` ADD CONSTRAINT `reservas_ibfk_1` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `reservas` ADD CONSTRAINT `reservas_ibfk_2` FOREIGN KEY (`cliente_id`) REFERENCES `clientes`(`id`) ON DELETE SET NULL ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `reservas` ADD CONSTRAINT `reservas_ibfk_3` FOREIGN KEY (`mesa_id`) REFERENCES `mesas`(`id`) ON DELETE SET NULL ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `eventos` ADD CONSTRAINT `eventos_ibfk_1` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `galeriafotos` ADD CONSTRAINT `galeriafotos_ibfk_1` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `mesas` ADD CONSTRAINT `mesas_ibfk_1` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `cierres_inventario` ADD CONSTRAINT `cierres_inventario_tenant_id_fkey` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cierres_inventario` ADD CONSTRAINT `cierres_inventario_realizado_por_id_fkey` FOREIGN KEY (`realizado_por_id`) REFERENCES `empleados`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cierres_inventario_detalles` ADD CONSTRAINT `cierres_inventario_detalles_cierre_id_fkey` FOREIGN KEY (`cierre_id`) REFERENCES `cierres_inventario`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cierres_inventario_detalles` ADD CONSTRAINT `cierres_inventario_detalles_producto_inventario_id_fkey` FOREIGN KEY (`producto_inventario_id`) REFERENCES `productos_inventario`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `kardex` ADD CONSTRAINT `kardex_tenant_id_fkey` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `kardex` ADD CONSTRAINT `kardex_producto_inventario_id_fkey` FOREIGN KEY (`producto_inventario_id`) REFERENCES `productos_inventario`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `kardex` ADD CONSTRAINT `kardex_usuario_id_fkey` FOREIGN KEY (`usuario_id`) REFERENCES `empleados`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cajas` ADD CONSTRAINT `cajas_tenant_id_fkey` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cajas` ADD CONSTRAINT `cajas_usuario_responsable_id_fkey` FOREIGN KEY (`usuario_responsable_id`) REFERENCES `empleados`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `cajas_movimientos` ADD CONSTRAINT `cajas_movimientos_caja_id_fkey` FOREIGN KEY (`caja_id`) REFERENCES `cajas`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cajas_movimientos` ADD CONSTRAINT `cajas_movimientos_tenant_id_fkey` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `cajas_movimientos` ADD CONSTRAINT `cajas_movimientos_usuario_id_fkey` FOREIGN KEY (`usuario_id`) REFERENCES `empleados`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;
