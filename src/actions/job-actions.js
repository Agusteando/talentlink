// --- src\actions\job-actions.js ---
'use server';

import { db } from "@/lib/db";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { saveFileToDisk, extractResumeData } from "@/lib/file-handler";
import { sendEmail } from "@/lib/email";

// --- 1. CREATE JOB (Dynamic Plantel) ---
export async function createJob(formData) {
  const session = await auth();
  if (!session || session.user.role !== 'ADMIN') return { error: "Unauthorized" };

  const closingDateStr = formData.get('closingDate');

  try {
    await db.job.create({
      data: {
        title: formData.get('title'),
        description: formData.get('description'),
        plantelId: formData.get('plantelId'), // Relational ID
        department: formData.get('department'),
        status: 'OPEN',
        closingDate: closingDateStr ? new Date(closingDateStr) : null
      }
    });
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: "Error creando vacante" };
  }
}

// --- 2. UPDATE JOB ---
export async function updateJob(formData) {
    const session = await auth();
    if (!session || session.user.role !== 'ADMIN') return { error: "Unauthorized" };
  
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
      revalidatePath('/dashboard');
      return { success: true };
    } catch (error) {
      return { error: "Error actualizando" };
    }
}

// --- 3. APPLY JOB (Guest + Captcha) ---
export async function applyJob(formData) {
  // 1. Server-side Captcha Validation (Math Challenge)
  const captchaAnswer = formData.get('captcha');
  const expectedCaptcha = formData.get('expectedCaptcha');
  
  if (captchaAnswer !== expectedCaptcha) {
      return { error: "Captcha incorrecto. Intenta de nuevo." };
  }

  // 2. Auth is optional now
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
    }
  }

  // Prioritize form data, fallback to AI extracted data
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
    
    // Notification Email to Candidate
    if (finalEmail) {
        await sendEmail({
            to: finalEmail,
            subject: "Postulación Recibida - TalentLink",
            html: `
                <div style="font-family: sans-serif; color: #333;">
                    <h1>¡Gracias por postularte!</h1>
                    <p>Hemos recibido tus datos correctamente para la vacante.</p>
                    <p>Nuestro equipo de Recursos Humanos revisará tu perfil. Si cumples con los requisitos, nos pondremos en contacto contigo.</p>
                    <hr />
                    <small>TalentLink - IECS IEDIS</small>
                </div>
            `
        });
    }

    // If logged in, revalidate their list
    if(session?.user?.id) revalidatePath('/my-applications');
    
    // Return flag so UI knows where to redirect
    return { success: true, isGuest: !session?.user?.id };
  } catch (error) {
    console.error("Apply Error:", error);
    return { error: "Error al procesar tu solicitud." };
  }
}

// --- 4. UPDATE STATUS ---
export async function updateApplicationStatus(appId, data) {
    const session = await auth();
    if (!session || session.user.role === 'CANDIDATE') {
       return { error: "Unauthorized" };
    }
 
    try {
      const currentApp = await db.application.findUnique({
        where: { id: appId },
        include: { user: true, job: true }
      });
 
      if (!currentApp) return { error: "Application not found" };
 
      await db.application.update({
        where: { id: appId },
        data: data
      });
 
      if (data.status && data.status !== currentApp.status) {
         let subject = `Actualización: ${currentApp.job.title}`;
         let html = `<p>Hola <strong>${currentApp.fullName}</strong>,</p>`;
         let shouldSend = false;

         // Note: Guests might not have a User relation, so use app.email directly
         const emailTarget = currentApp.email || currentApp.user?.email;
 
         if (data.status === 'INTERVIEW') {
            shouldSend = true;
            html += `<p>Nos complace informarte que tu perfil ha avanzado a la etapa de <strong>Entrevistas</strong>.</p>`;
         } else if (data.status === 'HIRED') {
            shouldSend = true;
            subject = "¡Felicidades! Bienvenido a IECS-IEDIS";
            html += `<p>¡Tenemos buenas noticias! Has sido seleccionado para la vacante.</p>`;
         } else if (data.status === 'REJECTED') {
            shouldSend = true;
            html += `<p>Agradecemos tu interés. En esta ocasión hemos decidido avanzar con otros candidatos.</p>`;
         }
 
         if (shouldSend && emailTarget) {
            await sendEmail({ to: emailTarget, subject, html });
         }
      }
      
      revalidatePath('/dashboard');
      return { success: true };
    } catch (error) {
      console.error("Status Update Error:", error);
      return { error: "Error actualizando estado" };
    }
 }