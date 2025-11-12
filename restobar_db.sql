-- -----------------------------------------------------
-- Módulo Global y de Tenants (Datos Maestros)
-- -----------------------------------------------------

/*
* Tabla Maestra (Global) - 
* Almacena la definición de cada cliente (Restaurante) que usa la plataforma.
* Esta tabla NO lleva tenant_id[cite: 41].
*/ 
DROP DATABASE IF EXISTS restobar_db;
CREATE DATABASE restobar_db;
USE restobar_db;

CREATE TABLE Tenants (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre_empresa VARCHAR(255) NOT NULL, -- [cite: 44, 106]
    subdominio VARCHAR(100) NOT NULL UNIQUE, -- [cite: 45, 107]
    isActive BOOLEAN DEFAULT false, -- [cite: 46] Inicia en 'false' hasta validar email [cite: 113]
    configuracion JSON, -- [cite: 49] Para logos, colores, configuración de POS, etc. [cite: 152]
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

/*
* Tabla Global de Roles [cite: 153]
* Define los roles fijos del sistema (Admin, Mesero, etc.)
* Es global (sin tenant_id) porque los roles son definidos por la aplicación, no por el tenant.
*/
CREATE TABLE Roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE, -- Ej: 'Administrador', 'Mesero', 'Cajero', 'Anfitrión' [cite: 154-157]
    descripcion TEXT
);

-- -----------------------------------------------------
-- Módulo de Gestión de Entidades (Aisladas por Tenant)
-- -----------------------------------------------------

/*
* Empleados del Tenant (Usuarios del Panel) [cite: 149]
* Sigue el ejemplo 'Usuarios' de la arquitectura [cite: 53]
* Contiene a los administradores, meseros, cajeros, etc.
*/
CREATE TABLE Empleados (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tenant_id INT NOT NULL, -- El Discriminador [cite: 55, 97]
    rol_id INT NOT NULL, -- Rol del empleado [cite: 153]
    email VARCHAR(255) NOT NULL, -- [cite: 56, 108]
    password_hash VARCHAR(255) NOT NULL, -- [cite: 57, 109]
    nombre VARCHAR(255),
    documento_identidad VARCHAR(50), -- Para validación externa (RENIEC) [cite: 160]
    is_active BOOLEAN DEFAULT true,

    FOREIGN KEY (tenant_id) REFERENCES Tenants(id) ON DELETE CASCADE, -- 
    FOREIGN KEY (rol_id) REFERENCES Roles(id),
    UNIQUE(tenant_id, email) -- El email es único POR TENANT [cite: 60]
);

/*
* Clientes finales del restaurante [cite: 147]
* Se alimenta principalmente de las reservas[cite: 147].
*/
CREATE TABLE Clientes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tenant_id INT NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    telefono VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (tenant_id) REFERENCES Tenants(id) ON DELETE CASCADE,
    UNIQUE(tenant_id, email) -- Un cliente puede ser único por email en un restaurante
);

/*
* Proveedores del restaurante [cite: 148]
*/
CREATE TABLE Proveedores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tenant_id INT NOT NULL,
    nombre_empresa VARCHAR(255) NOT NULL,
    contacto_nombre VARCHAR(255),
    email VARCHAR(255),
    telefono VARCHAR(50),

    FOREIGN KEY (tenant_id) REFERENCES Tenants(id) ON DELETE CASCADE,
    UNIQUE(tenant_id, nombre_empresa)
);

-- -----------------------------------------------------
-- Módulo de Sitio Web Público (Menú, Eventos, Galería)
-- -----------------------------------------------------

/*
* Categorías del Menú Digital [cite: 119]
*/
CREATE TABLE CategoriasMenu (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tenant_id INT NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    orden INT DEFAULT 0,

    FOREIGN KEY (tenant_id) REFERENCES Tenants(id) ON DELETE CASCADE
);

/*
* Productos (Platos, Bebidas) del Menú [cite: 118, 146]
*/
CREATE TABLE Productos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tenant_id INT NOT NULL,
    categoria_id INT NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    precio DECIMAL(10, 2) NOT NULL,
    foto_url VARCHAR(2048),
    disponible BOOLEAN DEFAULT true, -- Para control de stock simple

    FOREIGN KEY (tenant_id) REFERENCES Tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (categoria_id) REFERENCES CategoriasMenu(id) ON DELETE CASCADE
);

/*
* Eventos (tipo Blog) [cite: 122, 131]
*/
CREATE TABLE Eventos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tenant_id INT NOT NULL,
    titulo VARCHAR(255) NOT NULL,
    descripcion TEXT,
    fecha_evento DATETIME,
    imagen_url VARCHAR(2048),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (tenant_id) REFERENCES Tenants(id) ON DELETE CASCADE
);

/*
* Fotos de la Galería del sitio web [cite: 121, 130]
*/
CREATE TABLE GaleriaFotos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tenant_id INT NOT NULL,
    titulo VARCHAR(255),
    descripcion TEXT,
    foto_url VARCHAR(2048) NOT NULL,
    orden INT DEFAULT 0,

    FOREIGN KEY (tenant_id) REFERENCES Tenants(id) ON DELETE CASCADE
);

-- -----------------------------------------------------
-- Módulo de Gestión de Salón (POS) y Operaciones
-- -----------------------------------------------------

/*
* Mesas del salón [cite: 133]
*/
CREATE TABLE Mesas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tenant_id INT NOT NULL,
    nombre_o_numero VARCHAR(50) NOT NULL, -- Ej: "Mesa 5", "Barra 1"
    capacidad INT DEFAULT 0,
    -- El estado 'Reservada' puede gestionarse por 'Reservas' [cite: 133]
    estado ENUM('Libre', 'Ocupada') DEFAULT 'Libre',

    FOREIGN KEY (tenant_id) REFERENCES Tenants(id) ON DELETE CASCADE,
    UNIQUE(tenant_id, nombre_o_numero)
);

/*
* Ordenes (Cuentas/Ventas) [cite: 134, 140]
* Representa la "cuenta" de una mesa.
*/
CREATE TABLE Ordenes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tenant_id INT NOT NULL,
    mesa_id INT NOT NULL,
    empleado_id INT NOT NULL, -- Mesero que abrió la orden [cite: 155]
    estado ENUM('Abierta', 'Cerrada', 'Pagada') DEFAULT 'Abierta', -- [cite: 135]
    subtotal DECIMAL(10, 2) DEFAULT 0.00,
    descuento DECIMAL(10, 2) DEFAULT 0.00,
    total DECIMAL(10, 2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    closed_at TIMESTAMP NULL,

    FOREIGN KEY (tenant_id) REFERENCES Tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (mesa_id) REFERENCES Mesas(id),
    FOREIGN KEY (empleado_id) REFERENCES Empleados(id)
);

/*
* Detalle de los productos pedidos en una Orden [cite: 134]
*/
CREATE TABLE OrdenDetalles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tenant_id INT NOT NULL,
    orden_id INT NOT NULL,
    producto_id INT NOT NULL,
    cantidad INT NOT NULL,
    precio_unitario DECIMAL(10, 2) NOT NULL, -- Precio al momento de la venta (snapshot)
    notas TEXT, -- Ej: "Sin cebolla"

    FOREIGN KEY (tenant_id) REFERENCES Tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (orden_id) REFERENCES Ordenes(id) ON DELETE CASCADE,
    FOREIGN KEY (producto_id) REFERENCES Productos(id)
);

/*
* Pagos asociados a una Orden [cite: 135]
* Una orden puede tener múltiples pagos (división de cuenta)
*/
CREATE TABLE Pagos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tenant_id INT NOT NULL,
    orden_id INT NOT NULL,
    empleado_id INT NOT NULL, -- Cajero que registró el pago [cite: 156]
    metodo_pago ENUM('Efectivo', 'Tarjeta', 'Otro') NOT NULL,
    monto DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (tenant_id) REFERENCES Tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (orden_id) REFERENCES Ordenes(id),
    FOREIGN KEY (empleado_id) REFERENCES Empleados(id)
);

-- -----------------------------------------------------
-- Módulo de Reservas
-- -----------------------------------------------------

CREATE TABLE Reservas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tenant_id INT NOT NULL,
    cliente_id INT, -- Opcional, si el cliente ya existe [cite: 147]
    mesa_id INT, -- Mesa asignada [cite: 138]
    
    -- Datos del cliente (si no está registrado)
    cliente_nombre VARCHAR(255) NOT NULL,
    cliente_email VARCHAR(255),
    cliente_telefono VARCHAR(50) NOT NULL,
    
    fecha_hora DATETIME NOT NULL,
    cantidad_personas INT NOT NULL,
    estado ENUM('Pendiente', 'Confirmada', 'Cancelada', 'Completada') DEFAULT 'Pendiente', -- [cite: 137]
    notas TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (tenant_id) REFERENCES Tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (cliente_id) REFERENCES Clientes(id) ON DELETE SET NULL,
    FOREIGN KEY (mesa_id) REFERENCES Mesas(id) ON DELETE SET NULL
);

-- -----------------------------------------------------
-- Módulo de Inventario y Costeo (Avanzado)
-- -----------------------------------------------------

/*
* Insumos (ingredientes, bebidas) [cite: 142]
*/
CREATE TABLE Insumos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tenant_id INT NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    unidad_medida VARCHAR(50) NOT NULL, -- Ej: 'kg', 'lt', 'unidad'
    stock_actual DECIMAL(10, 3) DEFAULT 0.000,
    costo_unitario DECIMAL(10, 2) DEFAULT 0.00,

    FOREIGN KEY (tenant_id) REFERENCES Tenants(id) ON DELETE CASCADE,
    UNIQUE(tenant_id, nombre)
);

/*
* Recetas (Costeo) [cite: 143]
* Tabla PIVOT que define qué insumos componen un producto.
*/
CREATE TABLE Recetas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tenant_id INT NOT NULL,
    producto_id INT NOT NULL, -- El plato del menú
    insumo_id INT NOT NULL, -- El ingrediente
    cantidad_usada DECIMAL(10, 3) NOT NULL, -- Ej: 0.150 kg de carne

    FOREIGN KEY (tenant_id) REFERENCES Tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (producto_id) REFERENCES Productos(id) ON DELETE CASCADE,
    FOREIGN KEY (insumo_id) REFERENCES Insumos(id) ON DELETE CASCADE,
    UNIQUE(tenant_id, producto_id, insumo_id) -- Un insumo solo puede estar una vez por producto
);

/*
* Compras a Proveedores [cite: 141]
* Usado para registrar facturas y (eventualmente) actualizar inventario.
*/
CREATE TABLE Compras (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tenant_id INT NOT NULL,
    proveedor_id INT,
    fecha DATETIME NOT NULL,
    total DECIMAL(10, 2) NOT NULL,
    numero_documento VARCHAR(100), -- Nro de factura/boleta
    
    FOREIGN KEY (tenant_id) REFERENCES Tenants(id) ON DELETE CASCADE,
    FOREIGN KEY (proveedor_id) REFERENCES Proveedores(id) ON DELETE SET NULL
);