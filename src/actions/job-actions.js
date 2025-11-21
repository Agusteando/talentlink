'use server';

import { db } from "@/lib/db";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { saveFileToDisk, extractResumeData } from "@/lib/file-handler";
import { sendGmail, createCalendarEvent } from "@/lib/google"; 
import { generateEmailTemplate } from "@/lib/email-templates";
import { PERMISSIONS } from "@/lib/permissions";

// helper to check plantel access
function hasPlantelAccess(session, targetPlantelId) {
    if (session.user.isGlobal) return true;
    return session.user.plantelIds?.includes(targetPlantelId);
}

// ==========================================
// JOB MANAGEMENT
// ==========================================

export async function createJob(formData) {
  const session = await auth();
  
  // 1. Permission Check
  if (!session?.user?.permissions?.includes(PERMISSIONS.MANAGE_JOBS)) {
      return { error: "No tienes permiso para gestionar vacantes." };
  }

  const jobTitleId = formData.get('jobTitleId');
  const plantelId = formData.get('plantelId');

  if (!jobTitleId) return { error: "El Puesto es obligatorio." };
  if (!plantelId) return { error: "El Plantel es obligatorio." };

  // 2. Scope Check (1:N Security)
  if (!hasPlantelAccess(session, plantelId)) {
      return { error: "No tienes acceso a este plantel." };
  }

  try {
    // 3. Validate Puesto
    const jobTitle = await db.jobTitle.findUnique({ where: { id: jobTitleId } });
    if (!jobTitle) return { error: "Puesto inválido." };

    // 4. Create
    await db.job.create({
      data: {
        title: jobTitle.name, 
        jobTitleId: jobTitle.id,
        description: formData.get('description'),
        plantelId: plantelId,
        department: formData.get('department'),
        status: formData.get('status') || 'OPEN',
        type: formData.get('type') || 'Tiempo Completo',
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
    
    if (!session?.user?.permissions?.includes(PERMISSIONS.MANAGE_JOBS)) {
        return { error: "No autorizado." };
    }
    
    const jobTitleId = formData.get('jobTitleId');
    const plantelId = formData.get('plantelId');

    if (!hasPlantelAccess(session, plantelId)) {
        return { error: "No tienes acceso a este plantel." };
    }

    try {
      const jobTitle = await db.jobTitle.findUnique({ where: { id: jobTitleId } });
      if (!jobTitle) return { error: "Puesto inválido." };

      await db.job.update({
        where: { id: formData.get('jobId') },
        data: {
          title: jobTitle.name,
          jobTitleId: jobTitle.id,
          description: formData.get('description'),
          plantelId: plantelId,
          department: formData.get('department'),
          status: formData.get('status'),
          type: formData.get('type'),
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
    if (!session?.user?.permissions?.includes(PERMISSIONS.MANAGE_JOBS)) {
        return { error: "No autorizado." };
    }

    try {
        // Check ownership before delete if strict scoping needed
        // For now, relying on Dashboard filter to prevent seeing it
        await db.job.delete({ where: { id: jobId } });
        revalidatePath('/dashboard/jobs');
        return { success: true };
    } catch (e) { return { error: "Error DB" }; }
}

// ==========================================
// APPLICATION (Public Side)
// ==========================================

export async function applyJob(formData) {
    const token = formData.get('g-recaptcha-response');
    if (!token) return { error: "Falta captcha." };
    
    const session = await auth();
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
      
      if (finalEmail) {
          const t = generateEmailTemplate('CONFIRMATION', { 
              candidateName: formData.get('fullName'), 
              jobTitle: job.title 
          });
          await sendGmail({ to: finalEmail, subject: t.subject, html: t.html });
      }
      return { success: true };
    } catch (e) { return { error: "Error DB" }; }
}

// ==========================================
// CANDIDATE MANAGEMENT (Recruiter)
// ==========================================

export async function toggleApplicationFavorite(appId) {
    const session = await auth();
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
        revalidatePath(`/dashboard/application/${appId}`);
        return { success: true, isFavorite: !app.isFavorite };
    } catch (e) { return { error: "Error" }; }
}

export async function getStatusEmailPreview(appId, newStatus) {
    const session = await auth();
    if (!session?.user?.permissions?.includes(PERMISSIONS.MANAGE_CANDIDATES)) {
        return { error: "Unauthorized" };
    }

    const app = await db.application.findUnique({ 
        where: { id: appId }, 
        include: { job: { include: { plantel: true } } } 
    });
    if (!app) return { error: "App not found" };

    let mapLink = null;
    if (app.job.plantel?.lat && app.job.plantel?.lng) {
        mapLink = `https://www.google.com/maps?q=${app.job.plantel.lat},${app.job.plantel.lng}`;
    }

    const t = generateEmailTemplate(newStatus, { 
        candidateName: app.fullName, 
        jobTitle: app.job.title,
        plantelName: app.job.plantel.name,
        plantelAddress: app.job.plantel.address,
        interviewDate: app.interviewDate || new Date(),
        mapLink: mapLink
    });
    
    return { success: true, html: t.html, subject: t.subject };
}

export async function updateApplicationStatus(appId, data, shouldSendEmail = false) {
    const session = await auth();
    
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
 
      // 1. Update Database
      await db.application.update({ where: { id: appId }, data: data });

      // 2. Google Calendar Integration
      // Trigger only if a NEW valid date is set
      if (data.interviewDate && data.interviewDate.getTime() !== currentApp.interviewDate?.getTime()) {
          const start = new Date(data.interviewDate);
          const end = new Date(start.getTime() + 60 * 60 * 1000); // 1 Hour default

          await createCalendarEvent({
              title: `Entrevista: ${currentApp.fullName} - ${currentApp.job.title}`,
              description: `Candidato: ${currentApp.fullName}\nPuesto: ${currentApp.job.title}\nPlantel: ${currentApp.job.plantel.name}\n\nVer Perfil: ${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/application/${appId}`,
              startTime: start,
              endTime: end,
              location: currentApp.job.plantel.address || "Sede Central",
              attendees: [currentApp.email || currentApp.user?.email].filter(Boolean)
          });
      }
 
      // 3. Email Notification
      if (shouldSendEmail) {
         const emailTarget = currentApp.email || currentApp.user?.email;
         const targetStatus = data.status || currentApp.status;
         
         if (emailTarget) {
            let mapLink = null;
            if (currentApp.job.plantel.lat && currentApp.job.plantel.lng) {
                mapLink = `https://www.google.com/maps?q=${currentApp.job.plantel.lat},${currentApp.job.plantel.lng}`;
            }

            const t = generateEmailTemplate(targetStatus, { 
                candidateName: currentApp.fullName, 
                jobTitle: currentApp.job.title,
                interviewDate: data.interviewDate || currentApp.interviewDate,
                plantelName: currentApp.job.plantel.name,
                plantelAddress: currentApp.job.plantel.address,
                mapLink: mapLink
            });

            await sendGmail({ to: emailTarget, subject: t.subject, html: t.html });
         }
      }

      revalidatePath('/dashboard');
      revalidatePath(`/dashboard/application/${appId}`);
      revalidatePath('/dashboard/kanban');
      revalidatePath('/dashboard/calendar');
      return { success: true };
    } catch (error) { 
        console.error("Update Status Error:", error);
        return { error: "Error al actualizar." }; 
    }
}