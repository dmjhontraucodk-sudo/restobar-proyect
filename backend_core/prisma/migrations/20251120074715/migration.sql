-- AlterTable
ALTER TABLE `productos` ADD COLUMN `producto_inventario_id` INTEGER NULL;

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

-- CreateIndex
CREATE INDEX `productos_producto_inventario_id_idx` ON `productos`(`producto_inventario_id`);

-- AddForeignKey
ALTER TABLE `productos` ADD CONSTRAINT `productos_producto_inventario_id_fkey` FOREIGN KEY (`producto_inventario_id`) REFERENCES `productos_inventario`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `kardex` ADD CONSTRAINT `kardex_tenant_id_fkey` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `kardex` ADD CONSTRAINT `kardex_producto_inventario_id_fkey` FOREIGN KEY (`producto_inventario_id`) REFERENCES `productos_inventario`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

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
