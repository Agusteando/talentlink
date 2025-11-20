'use server'
import { db } from "@/lib/db"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"
import { writeFile } from 'fs/promises';
import path from 'path';
import { sendEmail } from "@/lib/email"; // Import the helper

// ... createJob and applyJob functions remain the same ...

export async function updateApplicationStatus(appId, data) {
   const session = await auth();
   if (session.user.role === 'CANDIDATE') return { error: "Unauthorized" };

   // Get current app data to find user email
   const currentApp = await db.application.findUnique({
     where: { id: appId },
     include: { user: true, job: true }
   });

   await db.application.update({
     where: { id: appId },
     data: data
   });

   // --- EMAIL TRIGGER LOGIC ---
   if (data.status && data.status !== currentApp.status) {
     let subject = `Actualización de tu proceso en TalentLink`;
     let html = `<p>Hola ${currentApp.fullName},</p>`;

     if (data.status === 'INTERVIEW') {
       html += `<p>Hemos revisado tu perfil para la vacante <strong>${currentApp.job.title}</strong> y nos gustaría invitarte a una entrevista.</p>`;
       html += `<p>Pronto te contactaremos para agendar.</p>`;
     } else if (data.status === 'HIRED') {
        subject = "¡Felicidades! Bienvenido a IECS-IEDIS";
        html += `<p>Nos complace informarte que has sido seleccionado para la vacante.</p>`;
     } else if (data.status === 'REJECTED') {
        html += `<p>Gracias por tu interés. En esta ocasión no continuaremos con tu proceso, pero guardaremos tu CV para futuras oportunidades.</p>`;
     }

     // Send the email asynchronously (don't await it to keep UI fast, or await if strictly needed)
     if (data.status !== 'NEW') {
        await sendEmail({
          to: currentApp.user.email,
          subject: subject,
          html: html
        });
     }
   }

   revalidatePath('/dashboard');
}

export async function updateJob(formData) {
  const session = await auth();
  if (!session || session.user.role !== 'ADMIN') return { error: "Unauthorized" };

  const jobId = formData.get('jobId');
  
  await db.job.update({
    where: { id: jobId },
    data: {
      title: formData.get('title'),
      description: formData.get('description'),
      plantel: formData.get('plantel'),
      department: formData.get('department'),
      status: formData.get('status'), // OPEN or CLOSED
      type: formData.get('type'),
    }
  });
  
  revalidatePath('/dashboard');
  return { success: true };
}