import axios from 'axios';

// ✅ CORRECCIÓN 1: La URL base de Factiliza debe ser la raíz para usar la ruta /v1/...
const API_BASE_URL = 'https://api.factiliza.com/'; 
const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0MDAzNCIsImh0dHA6Ly9zY2hlbWFzLm1pY3Jvc29mdC5jb20vd3MvMjAwOC8wNi9pZGVudGl0eS9jbGFpbXMvcm9sZSI6ImNvbnN1bHRvciJ9.GIor40ojajEweKBE-Hxc1TuZvFq28blpfh16HI2gwW8';

type DocumentType = 'DNI' | 'RUC';

// La interfaz de datos que devolvemos internamente
interface ClientData {
    nombre?: string;
    razon_social?: string;
    direccion?: string;
}

// Interfaz para la respuesta de la API externa (Documentación DNI)
interface FactilizaDniResponse {
    status: number;
    success: boolean;
    message: string;
    data: {
        nombre_completo: string; // Para el nombre
        direccion_completa: string; // Para la dirección
        // RUC tendrá campos similares como razon_social
        [key: string]: any; 
    } | null;
}

class ExternalDataService {
    
    async fetchClientData(documentType: DocumentType, documentNumber: string): Promise<ClientData | null> {
        let endpoint: string;

        // ✅ CORRECCIÓN 2: Usar la estructura de la documentación para DNI
        if (documentType === 'DNI') {
            // Ruta completa: https://api.factiliza.com/v1/dni/info/{dni}
            endpoint = `v1/dni/info/${documentNumber}`; 
        } else if (documentType === 'RUC') {
            // Asumiendo estructura similar para RUC
            endpoint = `v1/ruc/info/${documentNumber}`;
        } else {
            return null;
        }

        const url = `${API_BASE_URL}${endpoint}`;

        try {
            // ✅ CORRECCIÓN 3: Tipar la respuesta para el mapeo
            const response = await axios.get<FactilizaDniResponse>(url, {
                headers: {
                    Authorization: `Bearer ${TOKEN}`,
                },
            });

            const apiResponse = response.data;

            if (apiResponse.success && apiResponse.data) {
                const data = apiResponse.data;
                
                // ✅ CORRECCIÓN 4: Mapear la respuesta de la API a nuestra interfaz ClientData
                if (documentType === 'DNI') {
                    return {
                        // Mapeamos nombre_completo de la API a nuestro campo 'nombre'
                        nombre: data.nombre_completo,
                        // Mapeamos direccion_completa de la API a nuestro campo 'direccion'
                        direccion: data.direccion_completa, 
                        // Usamos el nombre completo para razon_social si es DNI (para simplificar)
                        razon_social: data.nombre_completo, 
                    };
                }
                
                if (documentType === 'RUC') {
                    // Mapeo asumido para RUC (si el RUC devuelve razón social y dirección)
                    return {
                        nombre: data.razon_social, // Usar razón social como nombre para el cliente
                        razon_social: data.razon_social,
                        direccion: data.direccion_completa,
                    };
                }
            }

            // Manejo de errores de la API (ej: Documento no encontrado)
            console.warn(`Consulta externa falló para ${documentType} ${documentNumber}. Mensaje:`, apiResponse.message);
            return null;

        } catch (error: any) {
            // Error de red o token inválido
            console.error('Error al consultar API externa:', error.message);
            return null;
        }
    }
}

export const externalDataService = new ExternalDataService();