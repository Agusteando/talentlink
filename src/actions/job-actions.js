
"use server";

import { db } from "@/lib/db";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { saveFileToDisk, extractResumeData } from "@/lib/file-handler";
import { sendGmail, createCalendarEvent } from "@/lib/google";
import { generateEmailTemplate } from "@/lib/email-templates";
import { PERMISSIONS } from "@/lib/permissions";
import {
  DEFAULT_NOTIFICATION_CHANNELS,
  normalizeNotificationChannels,
} from "@/lib/notification-preferences";
import { sendUserPushNotifications } from "@/lib/push";

// helper to check plantel access
function hasPlantelAccess(session, targetPlantelId) {
  if (session.user.isGlobal) return true;
  return session.user.plantelIds?.includes(targetPlantelId);
}

/**
 * Elige la preferencia efectiva de notificación para un usuario dado
 * según la combinación plantelId + jobTitleId, con fallback a reglas más generales.
 */
function resolveEffectivePreference(userId, plantelId, jobTitleId, allPrefs) {
  const prefsForUser = allPrefs.filter((p) => p.userId === userId);

  if (prefsForUser.length === 0) return DEFAULT_NOTIFICATION_CHANNELS;

  const exact =
    prefsForUser.find(
      (p) => p.plantelId === plantelId && p.jobTitleId === jobTitleId
    ) || null;
  const plantelOnly =
    prefsForUser.find(
      (p) => p.plantelId === plantelId && p.jobTitleId === null
    ) || null;
  const jobOnly =
    prefsForUser.find(
      (p) => p.plantelId === null && p.jobTitleId === jobTitleId
    ) || null;
  const globalPref =
    prefsForUser.find(
      (p) => p.plantelId === null && p.jobTitleId === null
    ) || null;

  const chosen = exact || plantelOnly || jobOnly || globalPref;

  if (!chosen) return DEFAULT_NOTIFICATION_CHANNELS;

  return normalizeNotificationChannels(chosen);
}

// ==========================================
// JOB MANAGEMENT
// ==========================================

export async function createJob(formData) {
  const session = await auth();

  if (!session?.user?.permissions?.includes(PERMISSIONS.MANAGE_JOBS)) {
    return { error: "No tienes permiso para gestionar vacantes." };
  }

  const jobTitleId = formData.get("jobTitleId");
  const plantelId = formData.get("plantelId");

  if (!jobTitleId) return { error: "El Puesto es obligatorio." };
  if (!plantelId) return { error: "El Plantel es obligatorio." };

  if (!hasPlantelAccess(session, plantelId)) {
    return { error: "No tienes acceso a este plantel." };
  }

  try {
    const jobTitle = await db.jobTitle.findUnique({ where: { id: jobTitleId } });
    if (!jobTitle) return { error: "Puesto inválido." };

    await db.job.create({
      data: {
        title: jobTitle.name,
        jobTitleId: jobTitle.id,
        description: formData.get("description"),
        plantelId: plantelId,
        department: formData.get("department"),
        status: formData.get("status") || "OPEN",
        type: formData.get("type") || "Tiempo Completo",
        salaryRange: formData.get("salaryRange") || null,
        closingDate: formData.get("closingDate")
          ? new Date(formData.get("closingDate"))
          : null,
      },
    });

    revalidatePath("/dashboard/jobs");
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

  const jobTitleId = formData.get("jobTitleId");
  const plantelId = formData.get("plantelId");

  if (!hasPlantelAccess(session, plantelId)) {
    return { error: "No tienes acceso a este plantel." };
  }

  try {
    const jobTitle = await db.jobTitle.findUnique({ where: { id: jobTitleId } });
    if (!jobTitle) return { error: "Puesto inválido." };

    await db.job.update({
      where: { id: formData.get("jobId") },
      data: {
        title: jobTitle.name,
        jobTitleId: jobTitle.id,
        description: formData.get("description"),
        plantelId: plantelId,
        department: formData.get("department"),
        status: formData.get("status"),
        type: formData.get("type"),
        salaryRange: formData.get("salaryRange") || null,
        closingDate: formData.get("closingDate")
          ? new Date(formData.get("closingDate"))
          : null,
      },
    });
    revalidatePath("/dashboard/jobs");
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
    await db.job.delete({ where: { id: jobId } });
    revalidatePath("/dashboard/jobs");
    return { success: true };
  } catch (e) {
    return { error: "Error DB" };
  }
}

// ==========================================
// APPLICATION (Public Side)
// ==========================================

export async function applyJob(formData) {
  const token = formData.get("g-recaptcha-response");
  if (!token) return { error: "Falta captcha." };

  const session = await auth();
  const file = formData.get("cv");
  let cvUrl = "";
  let cvText = "";
  let detectedEmail = "";

  console.log("[applyJob] Invoked", {
    jobId: formData.get("jobId"),
    hasFile: !!file && file.size > 0,
    isAuthenticated: !!session?.user?.id,
  });

  if (file && file.size > 0) {
    try {
      const savedFile = await saveFileToDisk(file);
      cvUrl = savedFile.url;
      const extracted = await extractResumeData(savedFile.buffer, file.type);
      cvText = extracted.text;
      detectedEmail = extracted.email;
    } catch (e) {
      console.error("[applyJob] File processing error", e);
      return { error: "Error al procesar archivo" };
    }
  }

  const finalEmail = formData.get("email") || detectedEmail;

  try {
    const jobId = formData.get("jobId");
    const job = await db.job.findUnique({
      where: { id: jobId },
      include: { plantel: true, jobTitle: true },
    });

    if (!job) {
      console.error("[applyJob] Job not found", { jobId });
      return { error: "Vacante no encontrada" };
    }

    const app = await db.application.create({
      data: {
        userId: session?.user?.id || null,
        jobId: jobId,
        fullName: formData.get("fullName"),
        phone: formData.get("phone"),
        email: finalEmail,
        cvUrl: cvUrl,
        cvText: cvText,
      },
    });

    // Email de confirmación al candidato
    if (finalEmail) {
      const t = generateEmailTemplate("CONFIRMATION", {
        candidateName: formData.get("fullName"),
        jobTitle: job.title,
      });
      const candidateRes = await sendGmail({
        to: finalEmail,
        subject: t.subject,
        html: t.html,
      });
      console.log("[applyJob] Candidate email result", {
        to: finalEmail,
        success: candidateRes?.success,
      });
    }

    // Notificaciones internas a staff (correo, panel y push según preferencias)
    try {
      const baseEnv =
        process.env.NEXT_PUBLIC_BASE_URL ||
        process.env.APP_BASE_URL ||
        process.env.VERCEL_URL ||
        "";
      let baseUrl = baseEnv || "";
      if (baseUrl && !baseUrl.startsWith("http")) {
        baseUrl = `https://${baseUrl}`;
      }
      const normalizedBase = baseUrl.replace(/\/+$/, "");

      const detailUrl = normalizedBase
        ? `${normalizedBase}/dashboard/application/${app.id}`
        : `/dashboard/application/${app.id}`;

      const cvAbsoluteUrl =
        cvUrl && normalizedBase ? `${normalizedBase}${cvUrl}` : cvUrl;

      const staffUsers = await db.user.findMany({
        where: {
          OR: [
            { role: { isGlobal: true } },
            { plantels: { some: { id: job.plantelId } } },
          ],
        },
        include: { role: true },
      });

      const staffUserIds = staffUsers.map((u) => u.id);
      const allPrefs =
        staffUserIds.length > 0
          ? await db.notificationPreference.findMany({
              where: { userId: { in: staffUserIds } },
            })
          : [];

      console.log("[applyJob] Staff notification planning", {
        jobId: job.id,
        plantelId: job.plantelId,
        staffCount: staffUsers.length,
        prefCount: allPrefs.length,
        hasBaseUrl: !!normalizedBase,
      });

      const emailPromises = [];
      const notificationOps = [];

      for (const user of staffUsers) {
        const pref = resolveEffectivePreference(
          user.id,
          job.plantelId,
          job.jobTitleId,
          allPrefs
        );

        // In-app
        if (pref.inAppNewEntries) {
          notificationOps.push(
            db.notification.create({
              data: {
                userId: user.id,
                type: "NEW_APPLICATION",
                title: "Nueva postulación",
                message: `${app.fullName} se postuló a "${job.title}"`,
                link: detailUrl,
                applicationId: app.id,
                jobId: job.id,
                plantelId: job.plantelId,
              },
            })
          );
        }

        // Email staff
        if (pref.emailNewEntries && user.email) {
          const staffTemplate = generateEmailTemplate("NEW_APPLICATION_STAFF", {
            candidateName: app.fullName,
            candidateEmail: finalEmail || "",
            candidatePhone: app.phone || "",
            jobTitle: job.title,
            jobDepartment: job.department || "",
            jobType: job.type || "",
            plantelName: job.plantel?.name || "",
            plantelAddress: job.plantel?.address || "",
            appliedAt: app.createdAt.toLocaleString("es-MX"),
            cvUrl: cvAbsoluteUrl || "",
            detailUrl,
          });

          emailPromises.push(
            sendGmail({
              to: user.email,
              subject: staffTemplate.subject,
              html: staffTemplate.html,
            })
          );
        }

        // Push
        if (pref.pushNewEntries) {
          sendUserPushNotifications(user.id, {
            title: "Nueva postulación",
            body: `${app.fullName} - ${job.title}`,
            url: detailUrl,
          }).catch((err) =>
            console.error("[applyJob] push error for user", user.id, err)
          );
        }
      }

      if (notificationOps.length > 0) {
        await db.$transaction(notificationOps);
      }
      if (emailPromises.length > 0) {
        await Promise.allSettled(emailPromises);
      }

      console.log("[applyJob] Staff notifications completed", {
        createdNotifications: notificationOps.length,
        staffUsers: staffUsers.length,
      });
    } catch (notifyError) {
      console.error("[applyJob] Staff notification error", notifyError);
    }

    return { success: true };
  } catch (e) {
    console.error("[applyJob] DB error", e);
    return { error: "Error DB" };
  }
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
      data: { isFavorite: !app.isFavorite },
    });
    revalidatePath(`/dashboard`);
    revalidatePath(`/dashboard/application/${appId}`);
    return { success: true, isFavorite: !app.isFavorite };
  } catch (e) {
    return { error: "Error" };
  }
}

export async function getStatusEmailPreview(appId, newStatus) {
  const session = await auth();
  if (!session?.user?.permissions?.includes(PERMISSIONS.MANAGE_CANDIDATES)) {
    return { error: "Unauthorized" };
  }

  const app = await db.application.findUnique({
    where: { id: appId },
    include: { job: { include: { plantel: true } } },
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
    mapLink: mapLink,
  });

  return { success: true, html: t.html, subject: t.subject };
}

export async function updateApplicationStatus(
  appId,
  data,
  shouldSendEmail = false
) {
  const session = await auth();

  if (!session?.user?.permissions?.includes(PERMISSIONS.MANAGE_CANDIDATES)) {
    return { error: "No autorizado." };
  }

  try {
    const currentApp = await db.application.findUnique({
      where: { id: appId },
      include: {
        user: true,
        job: { include: { plantel: true, jobTitle: true } },
      },
    });

    if (!currentApp) return { error: "No encontrado" };

    const previousStatus = currentApp.status;
    const nextStatus = data.status || previousStatus;
    const isStatusChange =
      typeof data.status === "string" && data.status !== previousStatus;

    // 1. Update Database
    const updatedApp = await db.application.update({
      where: { id: appId },
      data: data,
    });

    // 2. Google Calendar Integration
    if (
      data.interviewDate &&
      data.interviewDate.getTime() !== currentApp.interviewDate?.getTime()
    ) {
      const start = new Date(data.interviewDate);
      const end = new Date(start.getTime() + 60 * 60 * 1000); // 1 Hour default

      await createCalendarEvent({
        title: `Entrevista: ${currentApp.fullName} - ${currentApp.job.title}`,
        description: `Candidato: ${currentApp.fullName}\nPuesto: ${currentApp.job.title}\nPlantel: ${currentApp.job.plantel.name}\n\nVer Perfil: ${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/application/${appId}`,
        startTime: start,
        endTime: end,
        location: currentApp.job.plantel.address || "Sede Central",
        attendees: [currentApp.email || currentApp.user?.email].filter(Boolean),
      });
    }

    // 3. Email al candidato (opcional)
    if (shouldSendEmail) {
      const emailTarget = currentApp.email || currentApp.user?.email;
      const targetStatus = nextStatus;

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
          mapLink: mapLink,
        });

        await sendGmail({ to: emailTarget, subject: t.subject, html: t.html });
      }
    }

    // 4. Staff notifications para STATUS_UPDATE
    if (isStatusChange) {
      try {
        const baseEnv =
          process.env.NEXT_PUBLIC_BASE_URL ||
          process.env.APP_BASE_URL ||
          process.env.VERCEL_URL ||
          "";
        let baseUrl = baseEnv || "";
        if (baseUrl && !baseUrl.startsWith("http")) {
          baseUrl = `https://${baseUrl}`;
        }
        const normalizedBase = baseUrl.replace(/\/+$/, "");

        const detailUrl = normalizedBase
          ? `${normalizedBase}/dashboard/application/${appId}`
          : `/dashboard/application/${appId}`;

        const staffUsers = await db.user.findMany({
          where: {
            OR: [
              { role: { isGlobal: true } },
              { plantels: { some: { id: currentApp.job.plantelId } } },
            ],
          },
          include: { role: true },
        });

        const staffUserIds = staffUsers.map((u) => u.id);
        const allPrefs =
          staffUserIds.length > 0
            ? await db.notificationPreference.findMany({
                where: { userId: { in: staffUserIds } },
              })
            : [];

        console.log("[StatusUpdate] Staff notify planning", {
          appId,
          previousStatus,
          nextStatus,
          staffCount: staffUsers.length,
          prefCount: allPrefs.length,
        });

        const notificationOps = [];
        const emailPromises = [];

        for (const user of staffUsers) {
          const pref = resolveEffectivePreference(
            user.id,
            currentApp.job.plantelId,
            currentApp.job.jobTitleId,
            allPrefs
          );

          // In-app
          if (pref.inAppStatusUpdates) {
            notificationOps.push(
              db.notification.create({
                data: {
                  userId: user.id,
                  type: "STATUS_UPDATE",
                  title: "Actualización de estado",
                  message: `El candidato ${updatedApp.fullName} cambió a estado "${nextStatus}".`,
                  link: detailUrl,
                  applicationId: updatedApp.id,
                  jobId: currentApp.job.id,
                  plantelId: currentApp.job.plantelId,
                },
              })
            );
          }

          // Email
          if (pref.emailStatusUpdates && user.email) {
            const staffTemplate = generateEmailTemplate(
              "NEW_APPLICATION_STAFF",
              {
                candidateName: updatedApp.fullName,
                candidateEmail: updatedApp.email || "",
                candidatePhone: updatedApp.phone || "",
                jobTitle: currentApp.job.title,
                jobDepartment: currentApp.job.department || "",
                jobType: currentApp.job.type || "",
                plantelName: currentApp.job.plantel?.name || "",
                plantelAddress: currentApp.job.plantel?.address || "",
                appliedAt: updatedApp.updatedAt.toLocaleString("es-MX"),
                cvUrl: updatedApp.cvUrl || "",
                detailUrl,
              }
            );

            emailPromises.push(
              sendGmail({
                to: user.email,
                subject: `Estatus actualizado - ${currentApp.job.title}: ${nextStatus}`,
                html: staffTemplate.html,
              })
            );
          }

          // Push
          if (pref.pushStatusUpdates) {
            sendUserPushNotifications(user.id, {
              title: "Cambio de estado",
              body: `${updatedApp.fullName} → ${nextStatus}`,
              url: detailUrl,
            }).catch((err) =>
              console.error("[StatusUpdate] push error for user", user.id, err)
            );
          }
        }

        if (notificationOps.length > 0) {
          await db.$transaction(notificationOps);
        }
        if (emailPromises.length > 0) {
          await Promise.allSettled(emailPromises);
        }

        console.log("[StatusUpdate] Staff notifications completed", {
          createdNotifications: notificationOps.length,
        });
      } catch (notifyErr) {
        console.error("[StatusUpdate] staff notify error", notifyErr);
      }
    }

    revalidatePath("/dashboard");
    revalidatePath(`/dashboard/application/${appId}`);
    revalidatePath("/dashboard/kanban");
    revalidatePath("/dashboard/calendar");
    return { success: true };
  } catch (error) {
    console.error("Update Status Error:", error);
    return { error: "Error al actualizar." };
  }
}
