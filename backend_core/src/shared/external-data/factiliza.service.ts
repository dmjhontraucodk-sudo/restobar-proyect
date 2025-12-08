import axios from 'axios';
import { factilizaConfig } from '@shared/config/factiliza.config';

const API_BASE_URL = 'https://api.factiliza.com/v1';

interface ReniecClientData {
    success: boolean;
    data?: {
        nombre_completo: string;
        nombres: string;
        apellido_paterno: string;
        apellido_materno: string;
        codigo_verificacion: string;
        fecha_nacimiento: string;
        sexo: string;
        estado_civil: string;
        departamento: string;
        provincia: string;
        distrito: string;
        direccion: string;
        ubigeo_reniec: string;
        ubigeo_sunat: string;
        restriccion: string;
    };
    message?: string;
}

export class FactilizaService {
    private static instance: FactilizaService;
    private api = axios.create({
        baseURL: API_BASE_URL,
        headers: {
            'Authorization': `Bearer ${factilizaConfig.apiToken}`,
            'Content-Type': 'application/json',
        },
    });

    private constructor() {}

    public static getInstance(): FactilizaService {
        if (!FactilizaService.instance) {
            FactilizaService.instance = new FactilizaService();
        }
        return FactilizaService.instance;
    }

// ... (código existente)
    public async findClientByDni(dni: string): Promise<ReniecClientData> {
        try {
            const response = await this.api.get<ReniecClientData>(`/dni/info/${dni}`);
            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                console.error('Error fetching client data from Factiliza:', error.response?.data);
                throw new Error(error.response?.data?.message || 'Error al buscar cliente en RENIEC.');
            }
            console.error('An unexpected error occurred:', error);
            throw new Error('An unexpected error occurred while fetching client data.');
        }
    }
}
