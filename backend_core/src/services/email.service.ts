// src/services/email.service.ts
import { Resend } from 'resend';

// 1. Inicializar Resend con la API Key del .env
const resend = new Resend(process.env.RESEND_API_KEY);

// 2. Crear la función de envío
const sendRegistrationEmail = async (userEmail: string, userName: string) => {
  try {
    const { data, error } = await resend.emails.send({
      // IMPORTANTE: 'from' debe ser un dominio verificado en tu cuenta de Resend
      // 'onboarding@resend.dev' es el email de prueba por defecto
      from: 'Tu Plataforma <onboarding@resend.dev>', 
      to: [userEmail],
      subject: '¡Bienvenido a bordo!',
      html: `
        <h1>¡Hola, ${userName}!</h1>
        <p>Tu registro como tenant ha sido exitoso.</p>
        <p>Ya puedes empezar a configurar tu espacio en nuestra plataforma.</p>
        <p>Saludos,<br>El equipo</p>
      `,
    });

    if (error) {
      console.error('Error al enviar email (Resend):', error);
      throw new Error('Error al enviar el email de registro');
    }

    console.log('Email de registro enviado exitosamente:', data?.id);
    return data;

  } catch (error) {
    console.error('Excepción en sendRegistrationEmail:', error);
    throw error;
  }
};

// NUEVAS FUNCIONES PARA PEDIDOS WEB
const sendOrderConfirmation = async (order: any, tenantConfig: any) => {
  const { cliente_email, cliente_nombre, id, tipo_pedido, total } = order;
  
  if (!cliente_email) {
    console.log('No se puede enviar email: cliente_email no proporcionado');
    return;
  }

  const subject = tenantConfig?.email_asunto_confirmado || 'Confirmación de tu pedido';
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #4F46E5; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
        .order-details { background: white; padding: 15px; border-radius: 5px; margin: 15px 0; }
        .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
        .total { font-size: 18px; font-weight: bold; color: #4F46E5; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>¡Pedido Confirmado!</h1>
      </div>
      <div class="content">
        <p>Hola <strong>${cliente_nombre}</strong>,</p>
        <p>Tu pedido <strong>#${id}</strong> ha sido confirmado y está siendo preparado.</p>
        
        <div class="order-details">
          <p><strong>Tipo de entrega:</strong> ${tipo_pedido === 'RecogerEnTienda' ? '🛍️ Recoger en tienda' : '🚚 Entrega a domicilio'}</p>
          <p><strong>Total:</strong> <span class="total">$${total}</span></p>
        </div>
        
        <p>Te notificaremos cuando tu pedido esté listo para ser recogido o en camino a tu domicilio.</p>
        <p>¡Gracias por tu compra!</p>
      </div>
      <div class="footer">
        <p>Si tienes alguna pregunta, contáctanos respondiendo a este email.</p>
      </div>
    </body>
    </html>
  `;

  try {
    const { data, error } = await resend.emails.send({
      from: 'Tu Minimarket <onboarding@resend.dev>',
      to: [cliente_email],
      subject,
      html
    });

    if (error) {
      console.error('Error al enviar email de confirmación:', error);
      return;
    }

    console.log(`✅ Email de confirmación enviado a ${cliente_email} - ID:`, data?.id);
    return data;
  } catch (error) {
    console.error('Excepción en sendOrderConfirmation:', error);
  }
};

const sendOrderCancellation = async (order: any, tenantConfig: any, reason: string = '') => {
  const { cliente_email, cliente_nombre, id } = order;
  
  if (!cliente_email) {
    console.log('No se puede enviar email de cancelación: cliente_email no proporcionado');
    return;
  }

  const subject = tenantConfig?.email_asunto_cancelado || 'Actualización sobre tu pedido';
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #DC2626; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
        .reason { background: #FEE2E2; padding: 15px; border-radius: 5px; margin: 15px 0; }
        .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Actualización de tu Pedido</h1>
      </div>
      <div class="content">
        <p>Hola <strong>${cliente_nombre}</strong>,</p>
        <p>Lamentamos informarte que tu pedido <strong>#${id}</strong> ha sido cancelado.</p>
        
        ${reason ? `
        <div class="reason">
          <p><strong>Razón:</strong> ${reason}</p>
        </div>
        ` : ''}
        
        <p>Si crees que esto es un error o tienes alguna pregunta, no dudes en contactarnos.</p>
        <p>Te agradecemos por tu comprensión.</p>
      </div>
      <div class="footer">
        <p>Atentamente,<br>El equipo de tu minimarket</p>
      </div>
    </body>
    </html>
  `;

  try {
    const { data, error } = await resend.emails.send({
      from: 'Tu Minimarket <onboarding@resend.dev>',
      to: [cliente_email],
      subject,
      html
    });

    if (error) {
      console.error('Error al enviar email de cancelación:', error);
      return;
    }

    console.log(`✅ Email de cancelación enviado a ${cliente_email} - ID:`, data?.id);
    return data;
  } catch (error) {
    console.error('Excepción en sendOrderCancellation:', error);
  }
};

const sendOrderReady = async (order: any, tenantConfig: any) => {
  const { cliente_email, cliente_nombre, id, tipo_pedido } = order;
  
  if (!cliente_email) {
    console.log('No se puede enviar email: cliente_email no proporcionado');
    return;
  }

  const subject = tenantConfig?.email_asunto_listo || '¡Tu pedido está listo!';
  
  const deliveryMessage = tipo_pedido === 'RecogerEnTienda' 
    ? 'Tu pedido está listo para ser recogido en nuestra tienda.'
    : 'Tu pedido está en camino a tu domicilio.';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #10B981; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
        .ready { background: #D1FAE5; padding: 15px; border-radius: 5px; margin: 15px 0; text-align: center; }
        .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>¡Pedido Listo!</h1>
      </div>
      <div class="content">
        <p>Hola <strong>${cliente_nombre}</strong>,</p>
        
        <div class="ready">
          <h2>🎉 ¡Excelentes noticias!</h2>
          <p><strong>Tu pedido #${id} está listo.</strong></p>
        </div>
        
        <p>${deliveryMessage}</p>
        
        ${tipo_pedido === 'RecogerEnTienda' ? `
        <p><strong>Horario de atención:</strong> Lunes a Domingo de 8:00 AM a 10:00 PM</p>
        <p>No olvides traer tu identificación al recoger tu pedido.</p>
        ` : `
        <p>Nuestro repartidor estará contigo pronto. Por favor, mantén tu teléfono disponible.</p>
        `}
        
        <p>¡Esperamos verte pronto!</p>
      </div>
      <div class="footer">
        <p>Gracias por elegirnos</p>
      </div>
    </body>
    </html>
  `;

  try {
    const { data, error } = await resend.emails.send({
      from: 'Tu Minimarket <onboarding@resend.dev>',
      to: [cliente_email],
      subject,
      html
    });

    if (error) {
      console.error('Error al enviar email de pedido listo:', error);
      return;
    }

    console.log(`✅ Email de pedido listo enviado a ${cliente_email} - ID:`, data?.id);
    return data;
  } catch (error) {
    console.error('Excepción en sendOrderReady:', error);
  }
};


// NUEVAS FUNCIONES PARA RESERVAS
const sendReservationConfirmation = async (reservation: any) => {
    const { cliente_email, cliente_nombre, fecha_hora, cantidad_personas, mesas } = reservation;
    
    if (!cliente_email) return;

    const formattedDate = new Date(fecha_hora).toLocaleDateString('es-ES', { 
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    const mesaAsignada = mesas ? mesas.nombre_o_numero : 'no asignada aún';

    const html = `
        <h1>✅ ¡Reserva Confirmada!</h1>
        <p>Hola <strong>${cliente_nombre}</strong>,</p>
        <p>Tu reserva ha sido confirmada con los siguientes detalles:</p>
        <ul>
            <li><strong>Fecha y Hora:</strong> ${formattedDate}</li>
            <li><strong>Personas:</strong> ${cantidad_personas}</li>
            <li><strong>Mesa Asignada:</strong> ${mesaAsignada}</li>
        </ul>
        <p>¡Te esperamos!</p>
    `;

    try {
        await resend.emails.send({
            from: 'Tu Restaurante <onboarding@resend.dev>',
            to: [cliente_email],
            subject: 'Confirmación de Reserva en RestoBar',
            html
        });
        console.log(`✅ Email de confirmación de reserva enviado a ${cliente_email}`);
    } catch (error) {
        console.error('Error al enviar email de confirmación de reserva:', error);
    }
};

const sendReservationCancellation = async (reservation: any) => {
    const { cliente_email, cliente_nombre, fecha_hora } = reservation;
    
    if (!cliente_email) return;

    const formattedDate = new Date(fecha_hora).toLocaleDateString('es-ES');

    const html = `
        <h1>❌ Reserva Cancelada</h1>
        <p>Hola <strong>${cliente_nombre}</strong>,</p>
        <p>Lamentamos informarte que tu reserva para el ${formattedDate} ha sido cancelada.</p>
        <p>Si tienes alguna pregunta, por favor contáctanos.</p>
    `;

    try {
        await resend.emails.send({
            from: 'Tu Restaurante <onboarding@resend.dev>',
            to: [cliente_email],
            subject: 'Actualización: Tu Reserva ha sido Cancelada',
            html
        });
        console.log(`✅ Email de cancelación de reserva enviado a ${cliente_email}`);
    } catch (error) {
        console.error('Error al enviar email de cancelación de reserva:', error);
    }
};

// 3. Exportar el servicio COMPLETO 
export const emailService = {
 sendRegistrationEmail,
 sendOrderConfirmation,
 sendOrderCancellation,
 sendOrderReady,
 sendReservationConfirmation, 
 sendReservationCancellation, 
};
