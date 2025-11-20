'use server';

import { db } from "@/lib/db";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
// Ensure this path matches where you put the file-handler.js
import { saveFileToDisk, extractResumeData } from "@/lib/file-handler"; 

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

        // B. Real Parse of PDF
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

// --- 4. UPDATE STATUS ---
export async function updateApplicationStatus(appId, data) {
   const session = await auth();
   if (!session || session.user.role === 'CANDIDATE') {
      return { error: "Unauthorized" };
   }

   try {
     await db.application.update({
       where: { id: appId },
       data: data
     });
     revalidatePath('/dashboard');
     return { success: true };
   } catch (error) {
     console.error("Status Update Error:", error);
     return { error: "Error actualizando estado" };
   }
}