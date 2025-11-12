// src/controller/auth/auth.controller.ts
import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';
import bcrypt from 'bcryptjs';
import { emailService } from '../../services/email.service';
import jwt from 'jsonwebtoken';

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña son requeridos' });
    }

    // Consulta mejorada para incluir relaciones
    const empleado = await prisma.empleados.findFirst({
      where: {
        email: email,
      },
      include: {
        roles: true,     // Incluir datos del rol
        tenants: true,   // Incluir datos del tenant
      },
    });

    if (!empleado) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const isPasswordCorrect = await bcrypt.compare(
      password,
      empleado.password_hash
    );

    if (!isPasswordCorrect) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const payload = {
      id: empleado.id,
      email: empleado.email,
      tenant_id: empleado.tenant_id,
      rol_id: empleado.rol_id,
    };

    const token = jwt.sign(
      payload,
      process.env.JWT_SECRET as string,
      { expiresIn: '1d' }
    );

    // Respuesta completa con todos los datos del usuario
    res.status(200).json({
      message: 'Login exitoso',
      token: token,
      user: {
        id: empleado.id.toString(),
        name: empleado.nombre || empleado.email.split('@')[0], // Nombre o parte del email
        email: empleado.email,
        role: empleado.roles.nombre, // Nombre del rol (ej: "Administrador")
        restaurantId: empleado.tenant_id.toString(),
        tenantName: empleado.tenants.nombre_empresa, // Nombre del restaurante
        tenantSubdomain: empleado.tenants.subdominio,
      }
    });

  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const registerTenant = async (req: Request, res: Response) => {
  try {
    const { nombre_empresa, subdominio, email_admin, password } = req.body;

    if (!nombre_empresa || !subdominio || !email_admin || !password) {
      return res.status(400).json({ error: 'Faltan campos requeridos' });
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);
    console.log('Paso 1: Contraseña hasheada.');

    const subdominioLower = subdominio.toLowerCase();

    // 1. Crear el Tenant
    const nuevoTenant = await prisma.tenants.create({
      data: {
        nombre_empresa,
        subdominio: subdominioLower, 
        isActive: false, 
      },
    });
    console.log('Paso 2: Tenant creado en BD:', nuevoTenant.id);

    // 2. Crear el Empleado (Administrador) asociado
    await prisma.empleados.create({
      data: {
        tenant_id: nuevoTenant.id,
        email: email_admin,
        password_hash: password_hash, 
        rol_id: 1, 
        is_active: true,
      },
    });
    console.log('Paso 3: Empleado admin creado.');

    // 3. Enviar email de validación
    emailService.sendRegistrationEmail(email_admin, nombre_empresa)
      .catch(err => console.error('Fallo en envío de email (no bloqueante):', err));
    console.log('Paso 4: Email de bienvenida encolado (Resend).');

    res.status(201).json({
      message: 'Tenant registrado. Revisa tu email para validar la cuenta.',
      tenantId: nuevoTenant.id,
    });

  } catch (error: any) {
    if (error.code === 'P2002' && error.meta?.target?.includes('subdominio')) {
      return res.status(409).json({ error: 'Este subdominio ya está en uso.' });
    }
    if (error.code === 'P2002' && error.meta?.target?.includes('email')) {
      return res.status(409).json({ error: 'Este email ya está en uso.' });
    }
    console.error('Error en registerTenant:', error);
    res.status(500).json({ error: 'Error al registrar el tenant' });
  }
};