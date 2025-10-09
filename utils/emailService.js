// utils/emailService.js

const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');

// Create reusable transporter
const createTransporter = () => {
    return nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });
};

// Get logo file path
const getLogoPath = () => {
    try {
        const logoPath = path.join(__dirname, '../client/src/logo-blanco.png');
        if (fs.existsSync(logoPath)) {
            return logoPath;
        }
        console.error('Logo file not found at:', logoPath);
        return null;
    } catch (error) {
        console.error('Error loading logo:', error);
        return null;
    }
};

// Generate HTML template for usuario_bienes invitation email
const getUsuarioBienesInvitationEmailTemplate = (nombreCompleto, correoElectronico, contraseñaTemporal, activationLink) => {
    return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invitación a Assetfy</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                    <!-- Header with Logo -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #007bff 0%, #0056b3 100%); padding: 40px; text-align: center;">
                            <img src="cid:logo" alt="Logo Assetfy" style="max-width: 150px; height: auto; margin-bottom: 20px;">
                            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">¡Bienvenido a Assetfy!</h1>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px 30px;">
                            <h2 style="color: #333; font-size: 22px; margin-bottom: 20px;">Hola ${nombreCompleto},</h2>
                            
                            <p style="color: #555; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
                                Has sido invitado a formar parte de Assetfy, tu plataforma personal para gestionar tus bienes. 
                                Tu cuenta ha sido creada exitosamente.
                            </p>
                            
                            <div style="background-color: #f8f9fa; border-left: 4px solid #007bff; padding: 20px; margin: 25px 0; border-radius: 4px;">
                                <p style="margin: 0 0 10px 0; color: #333; font-size: 15px;"><strong>Usuario:</strong> ${correoElectronico}</p>
                                <p style="margin: 0; color: #333; font-size: 15px;"><strong>Contraseña provisional:</strong> <code style="background-color: #e9ecef; padding: 4px 8px; border-radius: 4px; font-family: monospace;">${contraseñaTemporal}</code></p>
                            </div>
                            
                            <div style="margin: 30px 0; padding: 20px; background-color: #e7f3ff; border-radius: 8px; border-left: 4px solid #007bff;">
                                <h3 style="color: #333; margin-bottom: 15px; font-size: 18px;">¿Qué puedes hacer en Assetfy?</h3>
                                <ul style="list-style: none; padding: 0; margin: 0;">
                                    <li style="padding: 8px 0; color: #555;">
                                        <strong style="color: #007bff;">✓</strong> Crear y gestionar tus bienes personales
                                    </li>
                                    <li style="padding: 8px 0; color: #555;">
                                        <strong style="color: #007bff;">✓</strong> Registrar productos con ID Assetfy
                                    </li>
                                    <li style="padding: 8px 0; color: #555;">
                                        <strong style="color: #007bff;">✓</strong> Mantener un inventario organizado de tus activos
                                    </li>
                                </ul>
                            </div>
                            
                            <p style="color: #555; font-size: 16px; line-height: 1.6; margin: 25px 0;">
                                Para activar tu cuenta y comenzar a gestionar tus bienes, haz clic en el siguiente botón:
                            </p>
                            
                            <div style="text-align: center; margin: 35px 0;">
                                <a href="${activationLink}" style="display: inline-block; background: linear-gradient(135deg, #007bff 0%, #0056b3 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 6px rgba(0, 123, 255, 0.4);">
                                    Activar Cuenta
                                </a>
                            </div>
                            
                            <p style="color: #777; font-size: 14px; line-height: 1.6; margin-top: 30px;">
                                <strong>Nota de seguridad:</strong> Una vez que actives tu cuenta e inicies sesión, te recomendamos 
                                cambiar tu contraseña provisional por una de tu elección desde tu perfil de usuario.
                            </p>
                            
                            <p style="color: #999; font-size: 13px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
                                Si no solicitaste esta invitación, por favor ignora este correo.
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f8f9fa; padding: 25px; text-align: center;">
                            <p style="color: #999; font-size: 13px; margin: 0;">
                                © ${new Date().getFullYear()} Assetfy. Todos los derechos reservados.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
    `;
};

// Generate HTML template for invitation email
const getInvitationEmailTemplate = (nombreCompleto, correoElectronico, contraseñaTemporal, activationLink, fabricantes) => {
    const fabricantesHtml = fabricantes && fabricantes.length > 0
        ? `
            <div style="margin: 30px 0; padding: 20px; background-color: #f8f9fa; border-radius: 8px;">
                <h3 style="color: #333; margin-bottom: 15px; font-size: 18px;">Fabricantes Asignados:</h3>
                <ul style="list-style: none; padding: 0; margin: 0;">
                    ${fabricantes.map(fab => `
                        <li style="padding: 8px 0; border-bottom: 1px solid #e0e0e0; color: #555;">
                            <strong style="color: #007bff;">•</strong> ${fab.nombre}
                        </li>
                    `).join('')}
                </ul>
            </div>
        `
        : '';

    return `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invitación a Fabricantes</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                    <!-- Header with Logo -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #007bff 0%, #0056b3 100%); padding: 40px; text-align: center;">
                            <img src="cid:logo" alt="Logo Fabricantes" style="max-width: 150px; height: auto; margin-bottom: 20px;">
                            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">¡Bienvenido a Fabricantes!</h1>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px 30px;">
                            <h2 style="color: #333; font-size: 22px; margin-bottom: 20px;">Hola ${nombreCompleto},</h2>
                            
                            <p style="color: #555; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
                                Has sido invitado a formar parte de nuestra plataforma de gestión de fabricantes. 
                                Tu cuenta ha sido creada exitosamente.
                            </p>
                            
                            <div style="background-color: #f8f9fa; border-left: 4px solid #007bff; padding: 20px; margin: 25px 0; border-radius: 4px;">
                                <p style="margin: 0 0 10px 0; color: #333; font-size: 15px;"><strong>Usuario:</strong> ${correoElectronico}</p>
                                <p style="margin: 0; color: #333; font-size: 15px;"><strong>Contraseña provisional:</strong> <code style="background-color: #e9ecef; padding: 4px 8px; border-radius: 4px; font-family: monospace;">${contraseñaTemporal}</code></p>
                            </div>
                            
                            ${fabricantesHtml}
                            
                            <p style="color: #555; font-size: 16px; line-height: 1.6; margin: 25px 0;">
                                Para activar tu cuenta y comenzar a usar la plataforma, haz clic en el siguiente botón:
                            </p>
                            
                            <div style="text-align: center; margin: 35px 0;">
                                <a href="${activationLink}" style="display: inline-block; background: linear-gradient(135deg, #007bff 0%, #0056b3 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 6px rgba(0, 123, 255, 0.4);">
                                    Activar Cuenta
                                </a>
                            </div>
                            
                            <p style="color: #777; font-size: 14px; line-height: 1.6; margin-top: 30px;">
                                <strong>Nota de seguridad:</strong> Una vez que actives tu cuenta e inicies sesión, te recomendamos 
                                cambiar tu contraseña provisional por una de tu elección desde el perfil de usuario.
                            </p>
                            
                            <p style="color: #999; font-size: 13px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
                                Si no solicitaste esta invitación, por favor ignora este correo.
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f8f9fa; padding: 25px; text-align: center;">
                            <p style="color: #999; font-size: 13px; margin: 0;">
                                © ${new Date().getFullYear()} Fabricantes. Todos los derechos reservados.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
    `;
};

// Send invitation email
const sendInvitationEmail = async (nombreCompleto, correoElectronico, contraseñaTemporal, activationToken, fabricantes = [], userRole = 'apoderado') => {
    try {
        const transporter = createTransporter();
        const activationLink = `${process.env.APP_URL}/activate/${activationToken}`;
        const logoPath = getLogoPath();
        
        // Use different template based on user role
        const isUsuarioBienes = userRole === 'usuario_bienes';
        const emailTemplate = isUsuarioBienes 
            ? getUsuarioBienesInvitationEmailTemplate(nombreCompleto, correoElectronico, contraseñaTemporal, activationLink)
            : getInvitationEmailTemplate(nombreCompleto, correoElectronico, contraseñaTemporal, activationLink, fabricantes);
        
        const mailOptions = {
            from: `"${isUsuarioBienes ? 'Assetfy' : 'Fabricantes'}" <${process.env.EMAIL_FROM || process.env.SMTP_USER}>`,
            to: correoElectronico,
            subject: `Invitación a ${isUsuarioBienes ? 'Assetfy' : 'Fabricantes'} - Activa tu cuenta`,
            html: emailTemplate,
            attachments: []
        };

        // Add logo as embedded image if available
        if (logoPath) {
            mailOptions.attachments.push({
                filename: 'logo.png',
                path: logoPath,
                cid: 'logo' // This CID is referenced in the HTML as src="cid:logo"
            });
        }

        const info = await transporter.sendMail(mailOptions);
        console.log('✅ Email sent:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('❌ Error sending email:', error);
        return { success: false, error: error.message };
    }
};

module.exports = {
    sendInvitationEmail,
};
