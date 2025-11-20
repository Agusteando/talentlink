'use server';

import { db } from "@/lib/db";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { saveFileToDisk, extractResumeData } from "@/lib/file-handler";
import { sendEmail } from "@/lib/email";

// --- 1. CREATE JOB ---
export async function createJob(formData) {
  const session = await auth();
  if (!session || session.user.role !== 'ADMIN') {
    return { error: "Unauthorized" };
  }

  try {
    await db.job.create({
      data: {
        title: formData.get('title'),
        description: formData.get('description'),
        plantel: formData.get('plantel'),
        department: formData.get('department'),
        status: 'OPEN',
        type: 'Tiempo Completo'
      }
    });
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error) {
    console.error("Create Job Error:", error);
    return { error: "Error creando vacante" };
  }
}

// --- 2. UPDATE JOB ---
export async function updateJob(formData) {
  const session = await auth();
  if (!session || session.user.role !== 'ADMIN') {
    return { error: "Unauthorized" };
  }

  const jobId = formData.get('jobId');
  
  try {
    await db.job.update({
      where: { id: jobId },
      data: {
        title: formData.get('title'),
        description: formData.get('description'),
        plantel: formData.get('plantel'),
        department: formData.get('department'),
        status: formData.get('status'), 
      }
    });
    
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error) {
    console.error("Update Job Error:", error);
    return { error: "Error actualizando vacante" };
  }
}

// --- 3. APPLY JOB (REAL PARSING) ---
export async function applyJob(formData) {
  const session = await auth();
  if (!session) return { error: "Not authenticated" };

  const file = formData.get('cv');
  const jobId = formData.get('jobId');
  
  let cvUrl = "";
  let cvText = "";
  let detectedPhone = "";
  let detectedEmail = "";
  
  // Real File Handling
  if (file && file.size > 0) {
    try {
        // A. Save to Windows Server Disk
        const savedFile = await saveFileToDisk(file);
        cvUrl = savedFile.url;

        // B. Real Parse of PDF/Word
        const extracted = await extractResumeData(savedFile.buffer, file.type);
        cvText = extracted.text;
        detectedPhone = extracted.phone;
        detectedEmail = extracted.email;

    } catch (e) {
        console.error("Error processing file:", e);
        cvText = "Error procesando archivo.";
    }
  }

  try {
    await db.application.create({
      data: {
        userId: session.user.id,
        jobId: jobId,
        fullName: formData.get('fullName'),
        // Use Form data first, if empty use detected data
        phone: formData.get('phone') || detectedPhone, 
        email: formData.get('email') || detectedEmail,
        cvUrl: cvUrl,
        cvText: cvText,
        requirementsChecklist: {} 
      }
    });
    
    revalidatePath('/my-applications');
    return { success: true };
  } catch (error) {
    console.error("Apply Error:", error);
    return { error: "Error al aplicar" };
  }
}

// --- 4. UPDATE STATUS & SEND EMAIL ---
export async function updateApplicationStatus(appId, data) {
   const session = await auth();
   if (!session || session.user.role === 'CANDIDATE') {
      return { error: "Unauthorized" };
   }

   try {
     // 1. Get current app data to find user email BEFORE update
     const currentApp = await db.application.findUnique({
       where: { id: appId },
       include: { user: true, job: true }
     });

     if (!currentApp) return { error: "Application not found" };

     // 2. Update DB
     await db.application.update({
       where: { id: appId },
       data: data
     });

     // 3. Email Trigger Logic
     if (data.status && data.status !== currentApp.status) {
        let subject = `Actualización: ${currentApp.job.title}`;
        let html = `<p>Hola <strong>${currentApp.fullName}</strong>,</p>`;

        let shouldSend = false;

        if (data.status === 'INTERVIEW') {
           shouldSend = true;
           html += `<p>Nos complace informarte que tu perfil ha avanzado a la etapa de <strong>Entrevistas</strong>.</p>`;
           html += `<p>Pronto nos pondremos en contacto contigo para coordinar los detalles.</p>`;
        } else if (data.status === 'HIRED') {
           shouldSend = true;
           subject = "¡Felicidades! Bienvenido a IECS-IEDIS";
           html += `<p>¡Tenemos buenas noticias! Has sido seleccionado para la vacante.</p>`;
           html += `<p>El equipo de Recursos Humanos te contactará para la firma de contrato.</p>`;
        } else if (data.status === 'REJECTED') {
           shouldSend = true;
           html += `<p>Agradecemos tu interés y el tiempo dedicado a nuestro proceso de selección.</p>`;
           html += `<p>En esta ocasión hemos decidido avanzar con otros candidatos, pero conservaremos tu CV para futuras oportunidades.</p>`;
        }

        if (shouldSend) {
           await sendEmail({
              to: currentApp.user.email,
              subject: subject,
              html: html
           });
        }
     }
     
     revalidatePath('/dashboard');
     return { success: true };
   } catch (error) {
     console.error("Status Update Error:", error);
     return { error: "Error actualizando estado" };
   }
}