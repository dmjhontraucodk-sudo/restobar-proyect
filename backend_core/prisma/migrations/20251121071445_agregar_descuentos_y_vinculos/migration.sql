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

-- AddForeignKey
ALTER TABLE `descuentos_empleados` ADD CONSTRAINT `descuentos_empleados_tenant_id_fkey` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `descuentos_empleados` ADD CONSTRAINT `descuentos_empleados_empleado_id_fkey` FOREIGN KEY (`empleado_id`) REFERENCES `empleados`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `descuentos_empleados` ADD CONSTRAINT `descuentos_empleados_gasto_id_fkey` FOREIGN KEY (`gasto_id`) REFERENCES `gastos`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `kardex` ADD CONSTRAINT `kardex_usuario_id_fkey` FOREIGN KEY (`usuario_id`) REFERENCES `empleados`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
