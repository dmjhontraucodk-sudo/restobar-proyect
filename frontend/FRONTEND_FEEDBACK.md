# Feedback de Arquitectura y Mejora Continua - Frontend

Este documento resume las falencias identificadas y las recomendaciones estratégicas para fortalecer la escalabilidad, seguridad y mantenibilidad del frontend de **Restobar Proyect**.

---

## 🛡️ 1. Seguridad y Multi-tenancy (Tenant Isolation)

### Falencia Actual
La validación de acceso al tenant depende en gran medida del lado del cliente (`TenantGuard` y `localStorage`). El host (`localhost`) está "quemado" en el código de redirección.

### Recomendaciones
- **Eliminar Hardcoding:** Sustituir `window.location.href = 'http://localhost:5174'` por una configuración basada en variables de entorno (`import.meta.env.VITE_AUTH_REDIRECT`).
- **Validación de Token:** El backend debe emitir un JWT que incluya explícitamente el `tenant_id` o `subdomain`. El frontend debe verificar que el token almacenado coincida con el subdominio actual antes de renderizar cualquier componente de dashboard.
- **Limpieza Estricta:** Si el `TenantGuard` detecta una discrepancia, se debe ejecutar un `localStorage.clear()` completo para evitar persistencia de datos de sesiones anteriores.

---

## 🏗️ 2. Arquitectura de Servicios (API Layer)

### Falencia Actual
El archivo `useDashboardApi.ts` es un **Antipatrón de Navaja Suiza** (+700 líneas). Mezcla lógica de inventario, finanzas, pedidos y empleados.

### Recomendaciones
- **Modularización:** Dividir en micro-hooks especializados:
  - `useInventoryApi.ts`
  - `useFinanceApi.ts`
  - `useOrdersApi.ts`
  - `useAuthApi.ts`
- **Fuente Única de Tipos:** Eliminar las re-definiciones de interfaces dentro de los hooks. Utilizar exclusivamente `@shared/types` para evitar discrepancias cuando el esquema de Prisma cambie.

---

## 🔄 3. Gestión de Estado y Datos (Data Fetching)

### Falencia Actual
Uso extensivo de `useEffect` y estados locales (`useState`) para manejar datos del servidor. Falta de caché y sincronización entre componentes.

### Recomendaciones
- **Implementar TanStack Query (React Query):** 
  - Proporciona caché automático (evita peticiones duplicadas).
  - Maneja estados de carga (`isLoading`), error y "refetching" de forma nativa.
  - Sincroniza componentes: si una mesa cambia a "Ocupada" en un modal, la lista de mesas se actualiza automáticamente en toda la app.
- **Zustand para Estado Global:** Para estados que no vienen del servidor (ej. si el sidebar está colapsado, preferencias de filtros temporales), usar una librería ligera como Zustand en lugar de múltiples Contextos.

---

## 🛠️ 4. Experiencia de Usuario (UX) y Robustez

### Falencia Actual
Manejo de errores genérico y componentes de carga básicos (`<div>Cargando...</div>`).

### Recomendaciones
- **Manejo de Errores por Capas:** 
  - Errores 400 (Validación): Mostrar en el formulario.
  - Errores 401/403 (Sesión): Redirigir a Login con mensaje claro.
  - Errores 500 (Servidor): Mostrar una pantalla de "Ups, algo salió mal".
- **Skeletons UI:** Reemplazar los textos de "Cargando" por Skeletons (contenedores grises animados que imitan la forma del contenido) para reducir el "layout shift" y mejorar la percepción de velocidad.

---

## 📝 5. Mantenibilidad del Código

### Falencia Actual
Funciones como `makeRequest` manejan demasiada lógica de transformación de datos y errores al mismo tiempo.

### Recomendaciones
- **Interceptores de Axios:** Considerar migrar de `fetch` a `axios` para usar interceptores. Esto permite inyectar el token de forma automática en cada petición y manejar los errores 401 de forma centralizada sin repetirlo en cada hook.
- **Validación con Zod:** Utilizar la librería `zod` (que ya está en el proyecto) para validar las respuestas de la API en tiempo de desarrollo, asegurando que el backend envíe exactamente lo que el frontend espera.

---
**Fecha de Revisión:** 23 de mayo de 2026
**Estatus:** Propuesta de Mejora Estructural
