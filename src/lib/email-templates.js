
export function generateEmailTemplate(type, data) {
  const { candidateName, jobTitle, customMessage } = data || {};

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
    case "CONFIRMATION":
      subject = "Hemos recibido tu postulación";
      bodyContent = `
          <h2 style="color: #334155; font-family: ${fontFamily};">Hola, ${candidateName || "candidato/a"}</h2>
          <p style="color: #475569; font-family: ${fontFamily}; font-size: 14px;">
            Gracias por postularte a la vacante <strong>${jobTitle || ""}</strong> en IECS-IEDIS.
          </p>
          <p style="color: #475569; font-family: ${fontFamily}; font-size: 14px;">
            <strong>Tu solicitud ha sido recibida correctamente</strong> y será revisada por nuestro equipo dentro de las próximas 
            <strong>72 horas hábiles</strong>.
          </p>
          <p style="color: #475569; font-family: ${fontFamily}; font-size: 14px;">
            En caso de que tu perfil avance a la siguiente etapa, nos pondremos en contacto contigo por correo electrónico para coordinar los siguientes pasos.
          </p>
          <p style="color: #94a3b8; font-family: ${fontFamily}; font-size: 12px; margin-top: 24px;">
            No es necesario responder a este correo. Conserva este mensaje como comprobante de tu postulación.
          </p>
        `;
      break;

    case "INTERVIEW":
      subject = `Actualización de proceso: ${jobTitle || ""}`;
      bodyContent = `
          <h2 style="color: #2563eb; font-family: ${fontFamily};">Siguientes Pasos</h2>
          <p style="color: #475569; font-family: ${fontFamily}; font-size: 14px;">Hola <strong>${candidateName || "candidato/a"}</strong>,</p>
          <p style="color: #475569; font-family: ${fontFamily}; font-size: 14px;">
            Tu perfil nos ha parecido muy interesante. Nos gustaría invitarte a una entrevista para conocerte mejor y platicar sobre la posición de ${jobTitle || ""}.
          </p>
          <p style="color: #475569; font-family: ${fontFamily}; font-size: 14px;">
            Pronto recibirás una llamada o mensaje para coordinar la agenda.
          </p>
        `;
      break;

    case "HIRED":
      subject = "¡Bienvenido al equipo!";
      bodyContent = `
          <h2 style="color: #059669; font-family: ${fontFamily};">¡Felicidades!</h2>
          <p style="color: #475569; font-family: ${fontFamily}; font-size: 14px;">
            Estimado/a <strong>${candidateName || "candidato/a"}</strong>,
          </p>
          <p style="color: #475569; font-family: ${fontFamily}; font-size: 14px;">
            Es un placer informarte que has sido seleccionado para la posición de <strong>${jobTitle || ""}</strong>.
          </p>
          <p style="color: #475569; font-family: ${fontFamily}; font-size: 14px;">
            Bienvenido a la comunidad IECS-IEDIS. Recursos Humanos se pondrá en contacto contigo para los trámites de ingreso.
          </p>
        `;
      break;

    // SOFT REJECTION / TALENT POOL
    case "TALENT_POOL":
      subject = "Estado de tu postulación";
      bodyContent = `
          <p style="color: #475569; font-family: ${fontFamily}; font-size: 14px;">
            Hola <strong>${candidateName || "candidato/a"}</strong>,
          </p>
          <p style="color: #475569; font-family: ${fontFamily}; font-size: 14px;">
            Gracias por el tiempo dedicado al proceso para la vacante de <strong>${jobTitle || ""}</strong>.
          </p>
          <p style="color: #475569; font-family: ${fontFamily}; font-size: 14px;">
            Aunque en esta ocasión hemos decidido avanzar con otro perfil para esta vacante específica,
            <strong>nos ha gustado mucho tu trayectoria</strong>.
          </p>
          <p style="color: #475569; font-family: ${fontFamily}; font-size: 14px;">
            Hemos guardado tu CV en nuestra <strong>Cartera de Talento Preferente</strong>. Te tendremos en cuenta prioritariamente para futuras aperturas en este u otros planteles de nuestra red.
          </p>
          <p style="color: #475569; font-family: ${fontFamily}; font-size: 14px;">
            ¡Esperamos contactarte pronto!
          </p>
        `;
      break;

    case "REJECTED":
      // Even strict rejection is polite
      subject = "Actualización sobre tu proceso";
      bodyContent = `
          <p style="color: #475569; font-family: ${fontFamily}; font-size: 14px;">
            Hola <strong>${candidateName || "candidato/a"}</strong>,
          </p>
          <p style="color: #475569; font-family: ${fontFamily}; font-size: 14px;">
            Agradecemos tu interés en IECS-IEDIS.
          </p>
          <p style="color: #475569; font-family: ${fontFamily}; font-size: 14px;">
            Tras revisar tu perfil, hemos decidido no continuar con tu candidatura en este momento. Sin embargo, conservaremos tus datos en nuestro sistema general para futuras oportunidades que se ajusten a tu perfil.
          </p>
        `;
      break;

    // INTERNAL STAFF NOTIFICATION FOR NEW APPLICATIONS
    case "NEW_APPLICATION_STAFF": {
      const plantelName = data?.plantelName || "";
      const plantelAddress = data?.plantelAddress || "";
      const candidateEmail = data?.candidateEmail || "";
      const candidatePhone = data?.candidatePhone || "";
      const appliedAt = data?.appliedAt || "";
      const cvUrl = data?.cvUrl || "";
      const detailUrl = data?.detailUrl || "#";
      const jobDepartment = data?.jobDepartment || "";
      const jobType = data?.jobType || "";

      subject = `Nueva postulación - ${jobTitle || ""}${
        plantelName ? ` (${plantelName})` : ""
      }`;

      const plantelBlock =
        plantelName || plantelAddress
          ? `
            <p style="color: #475569; font-family: ${fontFamily}; font-size: 13px; margin: 8px 0 0;">
              <strong>Plantel:</strong> ${plantelName || "Sin nombre"}<br/>
              ${plantelAddress ? `<span>${plantelAddress}</span>` : ""}
            </p>
          `
          : "";

      const cvBlock = cvUrl
        ? `
            <p style="margin: 16px 0; font-family: ${fontFamily}; font-size: 13px;">
              <strong>CV del candidato:</strong>
              <a href="${cvUrl}" style="color: #2563eb; text-decoration: none;"> Ver / Descargar CV</a>
            </p>
          `
        : "";

      bodyContent = `
          <h2 style="color: #0f172a; font-family: ${fontFamily};">Nueva solicitud de empleo</h2>
          <p style="color: #475569; font-family: ${fontFamily}; font-size: 14px;">
            Se ha recibido una nueva postulación para la vacante <strong>${jobTitle || ""}</strong>.
          </p>
          ${plantelBlock}
          <ul style="padding-left: 20px; margin: 16px 0; color: #334155; font-family: ${fontFamily}; font-size: 13px;">
            <li><strong>Candidato:</strong> ${candidateName || "Sin nombre"}</li>
            <li><strong>Email:</strong> ${candidateEmail || "Sin correo"}</li>
            <li><strong>Teléfono:</strong> ${candidatePhone || "Sin teléfono"}</li>
            ${
              jobDepartment
                ? `<li><strong>Departamento:</strong> ${jobDepartment}</li>`
                : ""
            }
            ${
              jobType
                ? `<li><strong>Tipo de contrato:</strong> ${jobType}</li>`
                : ""
            }
            ${
              appliedAt
                ? `<li><strong>Fecha de postulación:</strong> ${appliedAt}</li>`
                : ""
            }
          </ul>
          ${cvBlock}
          <p style="margin: 24px 0; text-align: center;">
            <a href="${detailUrl}" 
               style="
                display: inline-block;
                padding: 12px 24px;
                background-color: ${primaryColor};
                color: #ffffff;
                font-family: ${fontFamily};
                font-size: 14px;
                font-weight: 600;
                text-decoration: none;
                border-radius: 999px;
               ">
              Ver solicitud en TalentLink
            </a>
          </p>
          <p style="color: #94a3b8; font-family: ${fontFamily}; font-size: 11px; margin-top: 8px; text-align: center;">
            Este correo es informativo y está dirigido al personal interno. No lo reenvíes al candidato.
          </p>
        `;
      break;
    }

    default:
      subject = "Notificación TalentLink";
      bodyContent = `<p style="color: #475569; font-family: ${fontFamily}; font-size: 14px;">${customMessage || ""}</p>`;
  }

  const html = `
      <!DOCTYPE html>
      <html>
      <body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: ${fontFamily}; color: #334155;">
        <table width="100%" border="0" cellSpacing="0" cellPadding="0">
          <tr>
            <td align="center" style="padding: 40px 0;">
              <table width="600" border="0" cellSpacing="0" cellPadding="0" style="background-color: white; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);">
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
