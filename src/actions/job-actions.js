'use server';

import { db } from "@/lib/db";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { saveFileToDisk, extractResumeData } from "@/lib/file-handler";
import { sendEmail } from "@/lib/email";
import { generateEmailTemplate } from "@/lib/email-templates";
import { PERMISSIONS } from "@/lib/permissions";

// --- JOB MANAGEMENT ---

export async function createJob(formData) {
  const session = await auth();
  
  // PERMISSION CHECK
  if (!session?.user?.permissions?.includes(PERMISSIONS.MANAGE_JOBS)) {
      return { error: "No tienes permiso para gestionar vacantes." };
  }

  const jobTitleId = formData.get('jobTitleId');
  if (!jobTitleId) return { error: "El Puesto es obligatorio." };

  try {
    // 1. Validate Puesto and Get Name
    const jobTitle = await db.jobTitle.findUnique({ where: { id: jobTitleId } });
    if (!jobTitle) return { error: "Puesto inválido o no encontrado." };

    await db.job.create({
      data: {
        title: jobTitle.name, 
        jobTitleId: jobTitle.id,
        description: formData.get('description'),
        plantelId: formData.get('plantelId'),
        department: formData.get('department'),
        status: formData.get('status') || 'OPEN',
        type: 'Tiempo Completo',
        closingDate: formData.get('closingDate') ? new Date(formData.get('closingDate')) : null
      }
    });

    revalidatePath('/dashboard/jobs');
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: "Error de base de datos." };
  }
}

export async function updateJob(formData) {
    const session = await auth();
    
    // PERMISSION CHECK
    if (!session?.user?.permissions?.includes(PERMISSIONS.MANAGE_JOBS)) {
        return { error: "No autorizado." };
    }
    
    const jobTitleId = formData.get('jobTitleId');
    if (!jobTitleId) return { error: "El Puesto es obligatorio." };

    try {
      const jobTitle = await db.jobTitle.findUnique({ where: { id: jobTitleId } });
      if (!jobTitle) return { error: "Puesto inválido." };

      await db.job.update({
        where: { id: formData.get('jobId') },
        data: {
          title: jobTitle.name,
          jobTitleId: jobTitle.id,
          description: formData.get('description'),
          plantelId: formData.get('plantelId'),
          department: formData.get('department'),
          status: formData.get('status'),
          closingDate: formData.get('closingDate') ? new Date(formData.get('closingDate')) : null
        }
      });
      revalidatePath('/dashboard/jobs');
      return { success: true };
    } catch (error) {
      return { error: "Error DB" };
    }
}

export async function deleteJob(jobId) {
    const session = await auth();
    
    // PERMISSION CHECK
    if (!session?.user?.permissions?.includes(PERMISSIONS.MANAGE_JOBS)) {
        return { error: "No autorizado." };
    }

    try {
        await db.job.delete({ where: { id: jobId } });
        revalidatePath('/dashboard/jobs');
        return { success: true };
    } catch (e) { return { error: "Error DB" }; }
}

// --- APPLICATION PROCESS (Public) ---

export async function applyJob(formData) {
    // 1. Captcha
    const token = formData.get('g-recaptcha-response');
    if (!token) return { error: "Falta captcha." };
    
    // 2. Session (Optional)
    const session = await auth();
    
    // 3. File Handling
    const file = formData.get('cv');
    let cvUrl = "", cvText = "", detectedEmail = "";
    
    if (file && file.size > 0) {
      try {
          const savedFile = await saveFileToDisk(file);
          cvUrl = savedFile.url;
          const extracted = await extractResumeData(savedFile.buffer, file.type);
          cvText = extracted.text;
          detectedEmail = extracted.email;
      } catch (e) { return { error: "Error al procesar archivo" }; }
    }
  
    const finalEmail = formData.get('email') || detectedEmail;
  
    try {
      const job = await db.job.findUnique({ where: { id: formData.get('jobId') } });
      
      await db.application.create({
        data: {
          userId: session?.user?.id || null,
          jobId: formData.get('jobId'),
          fullName: formData.get('fullName'),
          phone: formData.get('phone'), 
          email: finalEmail,
          cvUrl: cvUrl,
          cvText: cvText
        }
      });
      
      // Confirmation Email
      if (finalEmail) {
          const t = generateEmailTemplate('CONFIRMATION', { candidateName: formData.get('fullName'), jobTitle: job.title });
          await sendEmail({ to: finalEmail, subject: t.subject, html: t.html });
      }
      
      return { success: true };
    } catch (e) { return { error: "Error DB" }; }
}

// --- CANDIDATE MANAGEMENT ---

export async function toggleApplicationFavorite(appId) {
    const session = await auth();
    
    // PERMISSION CHECK
    if (!session?.user?.permissions?.includes(PERMISSIONS.MANAGE_CANDIDATES)) {
        return { error: "Unauthorized" };
    }

    try {
        const app = await db.application.findUnique({ where: { id: appId } });
        await db.application.update({
            where: { id: appId },
            data: { isFavorite: !app.isFavorite }
        });
        revalidatePath(`/dashboard`);
        return { success: true, isFavorite: !app.isFavorite };
    } catch (e) { return { error: "Error" }; }
}

export async function getStatusEmailPreview(appId, newStatus) {
    const session = await auth();
    
    // PERMISSION CHECK
    if (!session?.user?.permissions?.includes(PERMISSIONS.MANAGE_CANDIDATES)) {
        return { error: "Unauthorized" };
    }

    const app = await db.application.findUnique({ where: { id: appId }, include: { job: true } });
    if (!app) return { error: "App not found" };

    const t = generateEmailTemplate(newStatus, { candidateName: app.fullName, jobTitle: app.job.title });
    return { success: true, html: t.html, subject: t.subject };
}

export async function updateApplicationStatus(appId, data, shouldSendEmail = false) {
    const session = await auth();
    
    // PERMISSION CHECK
    if (!session?.user?.permissions?.includes(PERMISSIONS.MANAGE_CANDIDATES)) {
        return { error: "No autorizado." };
    }
 
    try {
      const currentApp = await db.application.findUnique({ 
          where: { id: appId }, 
          include: { 
              user: true, 
              job: { include: { plantel: true } } 
          } 
      });

      if (!currentApp) return { error: "No encontrado" };
 
      // Update DB
      await db.application.update({ where: { id: appId }, data: data });
 
      // Email Logic
      if (shouldSendEmail && (data.status || data.interviewDate)) {
         const emailTarget = currentApp.email || currentApp.user?.email;
         
         if (emailTarget) {
            // Generate Map Link if Interview
            let mapLink = null;
            if (currentApp.job.plantel.lat && currentApp.job.plantel.lng) {
                mapLink = `https://www.google.com/maps?q=${currentApp.job.plantel.lat},${currentApp.job.plantel.lng}`;
            }

            const t = generateEmailTemplate(data.status || currentApp.status, { 
                candidateName: currentApp.fullName, 
                jobTitle: currentApp.job.title,
                // Interview Specifics
                interviewDate: data.interviewDate || currentApp.interviewDate,
                plantelName: currentApp.job.plantel.name,
                plantelAddress: currentApp.job.plantel.address,
                mapLink: mapLink
            });

            await sendEmail({ to: emailTarget, subject: t.subject, html: t.html });
         }
      }

      revalidatePath('/dashboard');
      revalidatePath(`/dashboard/application/${appId}`);
      return { success: true };
    } catch (error) { 
        console.error(error);
        return { error: "Error update" }; 
    }
}