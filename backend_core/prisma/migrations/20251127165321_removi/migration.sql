/*
  Warnings:

  - You are about to drop the column `activar_propina` on the `tenant_config` table. All the data in the column will be lost.
  - You are about to drop the column `activar_servicio` on the `tenant_config` table. All the data in the column will be lost.
  - You are about to drop the column `auto_liberar_mesa` on the `tenant_config` table. All the data in the column will be lost.
  - You are about to drop the column `banner_url` on the `tenant_config` table. All the data in the column will be lost.
  - You are about to drop the column `cambiar_pass_obligatorio` on the `tenant_config` table. All the data in the column will be lost.
  - You are about to drop the column `color_primario` on the `tenant_config` table. All the data in the column will be lost.
  - You are about to drop the column `color_secundario` on the `tenant_config` table. All the data in the column will be lost.
  - You are about to drop the column `email_asunto_cancelado` on the `tenant_config` table. All the data in the column will be lost.
  - You are about to drop the column `email_asunto_confirmado` on the `tenant_config` table. All the data in the column will be lost.
  - You are about to drop the column `email_asunto_listo` on the `tenant_config` table. All the data in the column will be lost.
  - You are about to drop the column `frecuencia_cierre_inv` on the `tenant_config` table. All the data in the column will be lost.
  - You are about to drop the column `metodo_costeo` on the `tenant_config` table. All the data in the column will be lost.
  - You are about to drop the column `mostrar_badge_nuevo` on the `tenant_config` table. All the data in the column will be lost.
  - You are about to drop the column `mostrar_recomendados` on the `tenant_config` table. All the data in the column will be lost.
  - You are about to drop the column `notif_pedido_cancelado` on the `tenant_config` table. All the data in the column will be lost.
  - You are about to drop the column `notif_pedido_confirmado` on the `tenant_config` table. All the data in the column will be lost.
  - You are about to drop the column `notif_pedido_listo` on the `tenant_config` table. All the data in the column will be lost.
  - You are about to drop the column `permitir_dividir` on the `tenant_config` table. All the data in the column will be lost.
  - You are about to drop the column `permitir_multi_sesion` on the `tenant_config` table. All the data in the column will be lost.
  - You are about to drop the column `permitir_multiples_cajas` on the `tenant_config` table. All the data in the column will be lost.
  - You are about to drop the column `propina_porcentaje` on the `tenant_config` table. All the data in the column will be lost.
  - You are about to drop the column `propina_suma_total` on the `tenant_config` table. All the data in the column will be lost.
  - You are about to drop the column `requiere_login_todos` on the `tenant_config` table. All the data in the column will be lost.
  - You are about to drop the column `servicio_porcentaje` on the `tenant_config` table. All the data in the column will be lost.
  - You are about to drop the column `timeout_sesion` on the `tenant_config` table. All the data in the column will be lost.
  - You are about to drop the column `costo_envio_estandar` on the `tenant_config_pedidos` table. All the data in the column will be lost.
  - You are about to drop the column `horario_apertura` on the `tenant_config_pedidos` table. All the data in the column will be lost.
  - You are about to drop the column `horario_cierre` on the `tenant_config_pedidos` table. All the data in the column will be lost.
  - You are about to drop the column `monto_minimo_pedido` on the `tenant_config_pedidos` table. All the data in the column will be lost.
  - You are about to drop the column `tiempo_preparacion_promedio` on the `tenant_config_pedidos` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `tenant_config` DROP COLUMN `activar_propina`,
    DROP COLUMN `activar_servicio`,
    DROP COLUMN `auto_liberar_mesa`,
    DROP COLUMN `banner_url`,
    DROP COLUMN `cambiar_pass_obligatorio`,
    DROP COLUMN `color_primario`,
    DROP COLUMN `color_secundario`,
    DROP COLUMN `email_asunto_cancelado`,
    DROP COLUMN `email_asunto_confirmado`,
    DROP COLUMN `email_asunto_listo`,
    DROP COLUMN `frecuencia_cierre_inv`,
    DROP COLUMN `metodo_costeo`,
    DROP COLUMN `mostrar_badge_nuevo`,
    DROP COLUMN `mostrar_recomendados`,
    DROP COLUMN `notif_pedido_cancelado`,
    DROP COLUMN `notif_pedido_confirmado`,
    DROP COLUMN `notif_pedido_listo`,
    DROP COLUMN `permitir_dividir`,
    DROP COLUMN `permitir_multi_sesion`,
    DROP COLUMN `permitir_multiples_cajas`,
    DROP COLUMN `propina_porcentaje`,
    DROP COLUMN `propina_suma_total`,
    DROP COLUMN `requiere_login_todos`,
    DROP COLUMN `servicio_porcentaje`,
    DROP COLUMN `timeout_sesion`,
    MODIFY `alertar_agotados` BOOLEAN NOT NULL DEFAULT false,
    MODIFY `alertas_stock_bajo` BOOLEAN NOT NULL DEFAULT false,
    MODIFY `requiere_obs_cierre` BOOLEAN NOT NULL DEFAULT false,
    MODIFY `notif_stock_critico` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `tenant_config_pedidos` DROP COLUMN `costo_envio_estandar`,
    DROP COLUMN `horario_apertura`,
    DROP COLUMN `horario_cierre`,
    DROP COLUMN `monto_minimo_pedido`,
    DROP COLUMN `tiempo_preparacion_promedio`;
