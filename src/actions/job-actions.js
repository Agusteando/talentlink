// --- src\actions\job-actions.js ---
'use server';

import { db } from "@/lib/db";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { saveFileToDisk, extractResumeData } from "@/lib/file-handler";
import { sendEmail } from "@/lib/email";

// --- 1. CREATE JOB ---
export async function createJob(formData) {
  const session = await auth();
  if (!session || session.user.role !== 'ADMIN') return { error: "No tienes permisos para crear vacantes." };

  const closingDateStr = formData.get('closingDate');

  try {
    await db.job.create({
      data: {
        title: formData.get('title'),
        description: formData.get('description'),
        plantelId: formData.get('plantelId'),
        department: formData.get('department'),
        status: formData.get('status') || 'OPEN',
        type: 'Tiempo Completo',
        closingDate: closingDateStr ? new Date(closingDateStr) : null
      }
    });
    revalidatePath('/dashboard/jobs');
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: "Error de base de datos al crear la vacante." };
  }
}

// --- 2. UPDATE JOB ---
export async function updateJob(formData) {
    const session = await auth();
    if (!session || session.user.role !== 'ADMIN') return { error: "No autorizado." };
  
    const jobId = formData.get('jobId');
    const closingDateStr = formData.get('closingDate');
  
    try {
      await db.job.update({
        where: { id: jobId },
        data: {
          title: formData.get('title'),
          description: formData.get('description'),
          plantelId: formData.get('plantelId'),
          department: formData.get('department'),
          status: formData.get('status'),
          closingDate: closingDateStr ? new Date(closingDateStr) : null
        }
      });
      revalidatePath('/dashboard/jobs');
      return { success: true };
    } catch (error) {
      return { error: "Error al actualizar la vacante." };
    }
}

// --- 3. DELETE JOB ---
export async function deleteJob(jobId) {
    const session = await auth();
    if (!session || session.user.role !== 'ADMIN') return { error: "No autorizado." };

    try {
        // Check if it has applications first?
        // In this requirement, we allow forced deletion, or you could block it.
        // Prisma Cascade Delete is usually set on schema, so this deletes apps too.
        await db.job.delete({ where: { id: jobId } });
        revalidatePath('/dashboard/jobs');
        return { success: true };
    } catch (error) {
        console.error(error);
        return { error: "Error al eliminar. Es posible que tenga registros dependientes." };
    }
}

// --- 4. APPLY JOB (With Google ReCAPTCHA) ---
export async function applyJob(formData) {
  const token = formData.get('g-recaptcha-response');

  // 1. Verify Captcha with Google
  if (!token) return { error: "Por favor completa el captcha de seguridad." };

  try {
    const verifyRes = await fetch('https://www.google.com/recaptcha/api/siteverify', {
        method: 'POST',
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${token}`,
    });
    const verifyJson = await verifyRes.json();
    
    if (!verifyJson.success) {
        return { error: "Validación de seguridad fallida. Intenta de nuevo." };
    }
  } catch (err) {
    console.error("Captcha Error:", err);
    return { error: "Error de conexión con el servicio de seguridad." };
  }

  // 2. Process Application
  const session = await auth();
  const file = formData.get('cv');
  const jobId = formData.get('jobId');
  
  let cvUrl = "";
  let cvText = "";
  let detectedPhone = "";
  let detectedEmail = "";
  
  if (file && file.size > 0) {
    try {
        const savedFile = await saveFileToDisk(file);
        cvUrl = savedFile.url;
        const extracted = await extractResumeData(savedFile.buffer, file.type);
        cvText = extracted.text;
        detectedPhone = extracted.phone;
        detectedEmail = extracted.email;
    } catch (e) {
        console.error("File Error:", e);
        return { error: "Error al subir el archivo. Asegúrate que es un PDF válido." };
    }
  }

  const finalEmail = formData.get('email') || detectedEmail;
  const finalPhone = formData.get('phone') || detectedPhone;

  try {
    await db.application.create({
      data: {
        userId: session?.user?.id || null, // Null if guest
        jobId: jobId,
        fullName: formData.get('fullName'),
        phone: finalPhone, 
        email: finalEmail,
        cvUrl: cvUrl,
        cvText: cvText
      }
    });
    
    // Send Confirmation Email
    if (finalEmail) {
        await sendEmail({
            to: finalEmail,
            subject: "Confirmación de Postulación - TalentLink",
            html: `
                <div style="font-family: 'Arial', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
                    <div style="text-align: center; margin-bottom: 20px;">
                        <h2 style="color: #1e293b;">Confirmación de Recepción</h2>
                    </div>
                    <p style="color: #475569; font-size: 16px;">Hola <strong>${formData.get('fullName')}</strong>,</p>
                    <p style="color: #475569; line-height: 1.6;">Tu CV ha sido recibido exitosamente en nuestra plataforma <strong>TalentLink</strong>.</p>
                    <p style="color: #475569; line-height: 1.6;">Nuestro equipo de adquisición de talento revisará tu perfil. Si tu experiencia se alinea con los requerimientos de la vacante, nos pondremos en contacto contigo para coordinar una entrevista.</p>
                    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #f1f5f9; font-size: 12px; color: #94a3b8; text-align: center;">
                        © 2025 IECS-IEDIS. Todos los derechos reservados.
                    </div>
                </div>
            `
        });
    }

    // If user was logged in, revalidate their applications list
    if(session?.user?.id) revalidatePath('/my-applications');
    
    return { success: true, isGuest: !session?.user?.id };
  } catch (error) {
    console.error("Apply Database Error:", error);
    return { error: "Error interno al guardar tu solicitud." };
  }
}

// --- 5. UPDATE APPLICATION STATUS ---
export async function updateApplicationStatus(appId, data) {
    const session = await auth();
    if (!session || session.user.role === 'CANDIDATE') {
       return { error: "No autorizado." };
    }
 
    try {
      const currentApp = await db.application.findUnique({
        where: { id: appId },
        include: { user: true, job: true }
      });
 
      if (!currentApp) return { error: "Aplicación no encontrada." };
 
      await db.application.update({
        where: { id: appId },
        data: data
      });
 
      // Status Change Notifications
      if (data.status && data.status !== currentApp.status) {
         const emailTarget = currentApp.email || currentApp.user?.email;
         
         if (emailTarget) {
            let subject = `Actualización de Estado: ${currentApp.job.title}`;
            let message = "";

            if (data.status === 'INTERVIEW') {
                message = `<p>Nos complace informarte que tu perfil ha avanzado a la etapa de <strong>Entrevistas</strong>. Pronto te contactaremos para agendar.</p>`;
            } else if (data.status === 'HIRED') {
                subject = "¡Felicidades! Bienvenido a IECS-IEDIS";
                message = `<p>¡Tenemos buenas noticias! Has sido seleccionado para la vacante.</p>`;
            } else if (data.status === 'REJECTED') {
                message = `<p>Agradecemos tu interés. En esta ocasión hemos decidido avanzar con otros candidatos, pero mantendremos tu CV en nuestra base de datos para futuras oportunidades.</p>`;
            }

            if (message) {
                await sendEmail({ 
                    to: emailTarget, 
                    subject, 
                    html: `
                        <div style="font-family: sans-serif;">
                            <p>Hola <strong>${currentApp.fullName}</strong>,</p>
                            ${message}
                            <hr style="border:0; border-top:1px solid #eee; margin: 20px 0;" />
                            <small style="color: #888;">TalentLink - Reclutamiento</small>
                        </div>
                    ` 
                });
            }
         }
      }
      
      revalidatePath('/dashboard');
      revalidatePath(`/dashboard/application/${appId}`);
      return { success: true };
    } catch (error) {
      console.error(error);
      return { error: "Error al actualizar estado." };
    }
}