export function generateEmailTemplate(type, data = {}) {
  const {
    candidateName,
    jobTitle,
    customMessage,
    jobDepartment,
    jobType,
    plantelName,
    plantelAddress,
    appliedAt,
    candidateEmail,
    candidatePhone,
    cvUrl,
    detailUrl,
  } = data;

  const primaryColor = "#0f172a"; // Slate 900
  const fontFamily = "'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
  
  // Construct absolute URL for the logo
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://casitaiedis.edu.mx";
  const logoUrl = `${baseUrl}/TalentLink.png`;

  const header = `
      <div style="background-color: ${primaryColor}; padding: 25px; text-align: center;">
          <img src="${logoUrl}" alt="TalentLink" style="height: 40px; width: auto; display: block; margin: 0 auto;" />
      </div>
    `;

  let subject = "";
  let bodyContent = "";

  switch (type) {
    case "CONFIRMATION":
      subject = "Hemos recibido tu postulación";
      bodyContent = `
          <h2 style="color: #334155;">Hola, ${candidateName}</h2>
          <p>Confirmamos la recepción de tu CV para la vacante: <strong>${jobTitle}</strong>.</p>
          <p>Nos tomamos muy en serio cada perfil. Nuestro equipo de Recursos Humanos revisará tu información y, si tu experiencia se alinea con lo que necesitamos, nos pondremos en contacto contigo por correo o teléfono en los próximos días.</p>
        `;
      break;

    case "INTERVIEW":
      subject = `Actualización de proceso: ${jobTitle}`;
      bodyContent = `
          <h2 style="color: #2563eb;">Siguientes pasos</h2>
          <p>Hola <strong>${candidateName}</strong>,</p>
          <p>Tu perfil nos ha parecido muy interesante. Nos gustaría invitarte a una entrevista para conocerte mejor y platicar sobre la posición de <strong>${jobTitle}</strong>.</p>
          <p>Pronto recibirás una llamada o mensaje para coordinar la agenda.</p>
        `;
      break;

    case "HIRED":
      subject = "¡Bienvenido al equipo!";
      bodyContent = `
          <h2 style="color: #059669;">¡Felicidades!</h2>
          <p>Estimado/a <strong>${candidateName}</strong>,</p>
          <p>Es un placer informarte que has sido seleccionado para la posición de <strong>${jobTitle}</strong>.</p>
          <p>Bienvenido a la comunidad IECS-IEDIS. Recursos Humanos se pondrá en contacto contigo para los trámites de ingreso.</p>
        `;
      break;

    case "TALENT_POOL":
      subject = "Estado de tu postulación";
      bodyContent = `
          <p>Hola <strong>${candidateName}</strong>,</p>
          <p>Gracias por el tiempo dedicado al proceso para la vacante de <strong>${jobTitle}</strong>.</p>
          <p>Aunque en esta ocasión hemos decidido avanzar con otro perfil para esta vacante específica, <strong>nos ha gustado mucho tu trayectoria</strong>.</p>
          <p>Hemos guardado tu CV en nuestra <strong>Cartera de Talento Preferente</strong>. Te tendremos en cuenta prioritariamente para futuras aperturas en este u otros planteles de nuestra red.</p>
          <p>¡Esperamos contactarte pronto!</p>
        `;
      break;

    case "REJECTED":
      subject = "Actualización sobre tu proceso";
      bodyContent = `
          <p>Hola <strong>${candidateName}</strong>,</p>
          <p>Agradecemos tu interés en IECS-IEDIS.</p>
          <p>Tras revisar tu perfil, hemos decidido no continuar con tu candidatura en este momento. Sin embargo, conservaremos tus datos en nuestro sistema general para futuras oportunidades que se ajusten a tu perfil.</p>
        `;
      break;

    // Notificación interna a staff para nuevas aplicaciones / cambios
    case "NEW_APPLICATION_STAFF":
      subject = `Nuevo candidato: ${candidateName || "Nuevo registro"} (${jobTitle || "Vacante"})`;
      bodyContent = `
          <h2 style="color: #0f172a; margin-bottom: 8px;">Nuevo movimiento en TalentLink</h2>
          <p style="margin-bottom: 10px;">Se ha registrado una actividad relevante en el sistema:</p>

          <div style="border-radius: 8px; border: 1px solid #e2e8f0; padding: 16px; margin-bottom: 16px; background: #f8fafc;">
            <p style="margin: 0 0 6px;"><strong>Candidato:</strong> ${candidateName || "Sin nombre"}</p>
            ${
              candidateEmail
                ? `<p style="margin: 0 0 6px;"><strong>Email:</strong> <a href="mailto:${candidateEmail}" style="color:#2563eb;">${candidateEmail}</a></p>`
                : ""
            }
            ${
              candidatePhone
                ? `<p style="margin: 0 0 6px;"><strong>Teléfono:</strong> ${candidatePhone}</p>`
                : ""
            }
          </div>

          <div style="border-radius: 8px; border: 1px solid #e2e8f0; padding: 16px; margin-bottom: 16px; background: #f9fafb;">
            <p style="margin: 0 0 6px;"><strong>Vacante:</strong> ${jobTitle || "Sin título"}</p>
            ${
              jobDepartment
                ? `<p style="margin: 0 0 6px;"><strong>Departamento:</strong> ${jobDepartment}</p>`
                : ""
            }
            ${
              jobType
                ? `<p style="margin: 0 0 6px;"><strong>Tipo de Contrato:</strong> ${jobType}</p>`
                : ""
            }
            ${
              plantelName
                ? `<p style="margin: 0 0 6px;"><strong>Plantel:</strong> ${plantelName}</p>`
                : ""
            }
            ${
              plantelAddress
                ? `<p style="margin: 0 0 6px;"><strong>Dirección:</strong> ${plantelAddress}</p>`
                : ""
            }
            ${
              appliedAt
                ? `<p style="margin: 0;"><strong>Fecha de registro:</strong> ${appliedAt}</p>`
                : ""
            }
          </div>

          <div style="margin-bottom: 18px;">
            ${
              detailUrl
                ? `<a href="${detailUrl}" style="display:inline-block; padding:10px 16px; border-radius:8px; background:#0f172a; color:#ffffff; font-weight:600; font-size:13px; text-decoration:none; margin-right:8px;">Ver candidato en TalentLink</a>`
                : ""
            }
            ${
              cvUrl
                ? `<a href="${cvUrl}" style="display:inline-block; padding:10px 16px; border-radius:8px; background:#e5e7eb; color:#111827; font-weight:600; font-size:13px; text-decoration:none;">Ver CV adjunto</a>`
                : ""
            }
          </div>
        `;
      break;

    default:
      subject = "Notificación TalentLink";
      bodyContent = `<p>${customMessage || ""}</p>`;
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
                        © ${new Date().getFullYear()} IECS-IEDIS. Mensaje automático generado por TalentLink.
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