// --- src\lib\email-templates.js ---
export function generateEmailTemplate(type, data) {
    const { candidateName, jobTitle, customMessage } = data;
    
    const primaryColor = "#0f172a"; // Slate 900
    const fontFamily = "'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
    
    const header = `
      <div style="background-color: ${primaryColor}; padding: 25px; text-align: center;">
          <h1 style="color: white; margin: 0; font-family: ${fontFamily}; font-size: 22px; letter-spacing: 1px;">TalentLink</h1>
          <p style="color: #94a3b8; margin: 5px 0 0; font-family: ${fontFamily}; font-size: 12px; text-transform: uppercase;">IECS - IEDIS</p>
      </div>
    `;
  
    let subject = "";
    let bodyContent = "";
  
    switch (type) {
      case 'CONFIRMATION':
        subject = "Hemos recibido tu postulación";
        bodyContent = `
          <h2 style="color: #334155;">Hola, ${candidateName}</h2>
          <p>Confirmamos la recepción de tu CV para la vacante: <strong>${jobTitle}</strong>.</p>
          <p>Nuestro equipo revisará tu perfil. Si tu experiencia encaja con las necesidades actuales, te contactaremos para una entrevista.</p>
        `;
        break;
  
      case 'INTERVIEW':
        subject = `Actualización de proceso: ${jobTitle}`;
        bodyContent = `
          <h2 style="color: #2563eb;">Siguientes Pasos</h2>
          <p>Hola <strong>${candidateName}</strong>,</p>
          <p>Tu perfil nos ha parecido muy interesante. Nos gustaría invitarte a una entrevista para conocerte mejor y platicar sobre la posición de ${jobTitle}.</p>
          <p>Pronto recibirás una llamada o mensaje para coordinar la agenda.</p>
        `;
        break;
  
      case 'HIRED':
        subject = "¡Bienvenido al equipo!";
        bodyContent = `
          <h2 style="color: #059669;">¡Felicidades!</h2>
          <p>Estimado/a <strong>${candidateName}</strong>,</p>
          <p>Es un placer informarte que has sido seleccionado para la posición de <strong>${jobTitle}</strong>.</p>
          <p>Bienvenido a la comunidad IECS-IEDIS. Recursos Humanos se pondrá en contacto contigo para los trámites de ingreso.</p>
        `;
        break;
  
      // SOFT REJECTION / TALENT POOL
      case 'TALENT_POOL':
        subject = "Estado de tu postulación";
        bodyContent = `
          <p>Hola <strong>${candidateName}</strong>,</p>
          <p>Gracias por el tiempo dedicado al proceso para la vacante de <strong>${jobTitle}</strong>.</p>
          <p>Aunque en esta ocasión hemos decidido avanzar con otro perfil para esta vacante específica, <strong>nos ha gustado mucho tu trayectoria</strong>.</p>
          <p>Hemos guardado tu CV en nuestra <strong>Cartera de Talento Preferente</strong>. Te tendremos en cuenta prioritariamente para futuras aperturas en este u otros planteles de nuestra red.</p>
          <p>¡Esperamos contactarte pronto!</p>
        `;
        break;
  
      case 'REJECTED':
        // Even strict rejection is polite
        subject = "Actualización sobre tu proceso";
        bodyContent = `
          <p>Hola <strong>${candidateName}</strong>,</p>
          <p>Agradecemos tu interés en IECS-IEDIS.</p>
          <p>Tras revisar tu perfil, hemos decidido no continuar con tu candidatura en este momento. Sin embargo, conservaremos tus datos en nuestro sistema general para futuras oportunidades que se ajusten a tu perfil.</p>
        `;
        break;
        
      default:
        subject = "Notificación TalentLink";
        bodyContent = `<p>${customMessage || ''}</p>`;
    }
  
    const html = `
      <!DOCTYPE html>
      <html>
      <body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: ${fontFamily}; color: #334155;">
        <table width="100%" border="0" cellspacing="0" cellpadding="0">
          <tr>
            <td align="center" style="padding: 40px 0;">
              <table width="600" border="0" cellspacing="0" cellpadding="0" style="background-color: white; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);">
                <tr>
                  <td>
                    ${header}
                    <div style="padding: 40px; line-height: 1.6;">
                      ${bodyContent}
                    </div>
                    <div style="background-color: #f8fafc; padding: 20px; text-align: center; font-size: 11px; color: #94a3b8;">
                        © ${new Date().getFullYear()} IECS-IEDIS. Mensaje automático.
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;
  
    return { subject, html };
}