'use server'
import { db } from "@/lib/db"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"
import { saveFileToDisk, extractResumeData } from "@/lib/file-handler"; // Import our new real logic

// --- Job Management ---
export async function createJob(formData) {
  const session = await auth();
  if (session.user.role !== 'ADMIN') return { error: "Unauthorized" };

  await db.job.create({
    data: {
      title: formData.get('title'),
      description: formData.get('description'),
      plantel: formData.get('plantel'),
      department: formData.get('department'),
    }
  });
  revalidatePath('/dashboard');
  return { success: true };
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
      status: formData.get('status'), 
    }
  });
  
  revalidatePath('/dashboard');
  return { success: true };
}

// --- Application Handling (REAL PARSING) ---
export async function applyJob(formData) {
  const session = await auth();
  if (!session) return { error: "Not authenticated" };

  const file = formData.get('cv');
  const jobId = formData.get('jobId');
  
  let cvUrl = "";
  let cvText = "";
  let detectedPhone = "";
  let detectedEmail = "";
  
  // 1. Real File Handling
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
        // Fail gracefully: allow application but note the error
        cvText = "Error procesando archivo.";
    }
  }

  // 2. Save to DB (Merge Form Data with Detected Data)
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
}

export async function updateApplicationStatus(appId, data) {
   const session = await auth();
   if (session.user.role === 'CANDIDATE') return { error: "Unauthorized" };

   await db.application.update({
     where: { id: appId },
     data: data
   });
   
   // Email trigger logic removed for brevity, can be re-added here
   revalidatePath('/dashboard');
}