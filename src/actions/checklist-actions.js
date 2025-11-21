// --- src\actions\checklist-actions.js ---
'use server';

import { db } from "@/lib/db";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

// ADMIN: Manage Templates
export async function createChecklistItem(formData) {
    const session = await auth();
    if (session?.user?.role !== 'ADMIN') return { error: "Unauthorized" };
    
    await db.checklistTemplate.create({
        data: {
            name: formData.get('name'),
            type: formData.get('type'),
            isActive: true
        }
    });
    revalidatePath('/dashboard/settings/checklists');
    return { success: true };
}

export async function deleteChecklistItem(id) {
    const session = await auth();
    if (session?.user?.role !== 'ADMIN') return { error: "Unauthorized" };
    
    await db.checklistTemplate.delete({ where: { id } });
    revalidatePath('/dashboard/settings/checklists');
    return { success: true };
}

export async function toggleChecklistItem(id, currentStatus) {
    const session = await auth();
    if (session?.user?.role !== 'ADMIN') return { error: "Unauthorized" };
    
    await db.checklistTemplate.update({
        where: { id },
        data: { isActive: !currentStatus }
    });
    revalidatePath('/dashboard/settings/checklists');
    return { success: true };
}

// RECRUITER: Save Values
export async function saveChecklistValues(applicationId, valuesObj) {
    const session = await auth();
    if (session?.user?.role === 'CANDIDATE') return { error: "Unauthorized" };

    try {
        // valuesObj is { templateId: value, templateId2: value }
        const operations = Object.entries(valuesObj).map(([templateId, value]) => {
            return db.checklistValue.upsert({
                where: {
                    applicationId_templateId: {
                        applicationId,
                        templateId
                    }
                },
                update: { value: value.toString() },
                create: {
                    applicationId,
                    templateId,
                    value: value.toString()
                }
            });
        });

        await db.$transaction(operations);
        revalidatePath(`/dashboard/application/${applicationId}`);
        return { success: true };
    } catch (e) {
        console.error(e);
        return { error: "Database Error" };
    }
}