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

    INDEX `tenant_id`(`tenant_id`),
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

    INDEX `categoria_id`(`categoria_id`),
    INDEX `tenant_id`(`tenant_id`),
    INDEX `es_recomendado`(`es_recomendado`),
    INDEX `es_nuevo`(`es_nuevo`),
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

    INDEX `tenant_id`(`tenant_id`),
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

    INDEX `tenant_id`(`tenant_id`),
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

    UNIQUE INDEX `tenant_id`(`tenant_id`, `email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `empleados` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `tenant_id` INTEGER NOT NULL,
    `rol_id` INTEGER NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `nombre` VARCHAR(255) NULL,
    `documento_identidad` VARCHAR(50) NULL,
    `is_active` BOOLEAN NULL DEFAULT true,

    INDEX `rol_id`(`rol_id`),
    UNIQUE INDEX `tenant_id`(`tenant_id`, `email`),
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
    INDEX `tenant_id`(`tenant_id`),
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
    INDEX `tenant_id`(`tenant_id`),
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
    INDEX `tenant_id`(`tenant_id`),
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

    UNIQUE INDEX `tenant_id`(`tenant_id`, `nombre_empresa`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `recetas` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `tenant_id` INTEGER NOT NULL,
    `producto_id` INTEGER NOT NULL,
    `insumo_id` INTEGER NOT NULL,
    `cantidad_usada` DECIMAL(10, 3) NOT NULL,

    INDEX `insumo_id`(`insumo_id`),
    INDEX `producto_id`(`producto_id`),
    UNIQUE INDEX `tenant_id`(`tenant_id`, `producto_id`, `insumo_id`),
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
    INDEX `tenant_id`(`tenant_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `roles` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(50) NOT NULL,
    `descripcion` TEXT NULL,

    UNIQUE INDEX `nombre`(`nombre`),
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
CREATE TABLE `eventos` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `tenant_id` INTEGER NOT NULL,
    `titulo` VARCHAR(255) NOT NULL,
    `descripcion` TEXT NULL,
    `fecha_evento` DATETIME(0) NULL,
    `imagen_url` VARCHAR(2048) NULL,
    `created_at` TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP(0),

    INDEX `tenant_id`(`tenant_id`),
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

    INDEX `tenant_id`(`tenant_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `insumos` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `tenant_id` INTEGER NOT NULL,
    `nombre` VARCHAR(255) NOT NULL,
    `unidad_medida` VARCHAR(50) NOT NULL,
    `stock_actual` DECIMAL(10, 3) NULL DEFAULT 0.000,
    `costo_unitario` DECIMAL(10, 2) NULL DEFAULT 0.00,

    UNIQUE INDEX `tenant_id`(`tenant_id`, `nombre`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `mesas` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `tenant_id` INTEGER NOT NULL,
    `nombre_o_numero` VARCHAR(50) NOT NULL,
    `capacidad` INTEGER NULL DEFAULT 0,
    `estado` ENUM('Libre', 'Ocupada', 'Reservada') NULL DEFAULT 'Libre',

    UNIQUE INDEX `tenant_id`(`tenant_id`, `nombre_o_numero`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `compras` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `tenant_id` INTEGER NOT NULL,
    `proveedor_id` INTEGER NULL,
    `fecha` DATETIME(0) NOT NULL,
    `total` DECIMAL(10, 2) NOT NULL,
    `numero_documento` VARCHAR(100) NULL,

    INDEX `proveedor_id`(`proveedor_id`),
    INDEX `tenant_id`(`tenant_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `categoriasmenu` ADD CONSTRAINT `categoriasmenu_ibfk_1` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `productos` ADD CONSTRAINT `productos_ibfk_1` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `productos` ADD CONSTRAINT `productos_ibfk_2` FOREIGN KEY (`categoria_id`) REFERENCES `categoriasmenu`(`id`) ON DELETE CASCADE ON UPDATE RESTRICT;

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
ALTER TABLE `proveedores` ADD CONSTRAINT `proveedores_ibfk_1` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `recetas` ADD CONSTRAINT `recetas_ibfk_1` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `recetas` ADD CONSTRAINT `recetas_ibfk_2` FOREIGN KEY (`producto_id`) REFERENCES `productos`(`id`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `recetas` ADD CONSTRAINT `recetas_ibfk_3` FOREIGN KEY (`insumo_id`) REFERENCES `insumos`(`id`) ON DELETE CASCADE ON UPDATE RESTRICT;

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
ALTER TABLE `insumos` ADD CONSTRAINT `insumos_ibfk_1` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `mesas` ADD CONSTRAINT `mesas_ibfk_1` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `compras` ADD CONSTRAINT `compras_ibfk_1` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `compras` ADD CONSTRAINT `compras_ibfk_2` FOREIGN KEY (`proveedor_id`) REFERENCES `proveedores`(`id`) ON DELETE SET NULL ON UPDATE RESTRICT;
