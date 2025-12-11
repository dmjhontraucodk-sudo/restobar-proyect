import { Request, Response } from 'express';
import { authService } from '../services/auth.service';

export const authController = {
    async login(req: Request, res: Response) : Promise<any> {
        try {
            const { email, password } = req.body;
            if (!email || !password) return res.status(400).json({ error: 'Email y contraseña son requeridos' });

            const result = await authService.login(email, password);
            res.status(200).json({ message: 'Login exitoso', ...result });
        } catch (error: any) {
            const status = error.message === 'Credenciales inválidas' ? 401 : 
                           error.message === 'Usuario no encontrado' ? 404 : 400;
            res.status(status).json({ error: error.message });
        }
    }
};
