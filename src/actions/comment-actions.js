'use server';

import { db } from "@/lib/db";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export async function addComment(formData) {
    const session = await auth();
    if (!session || session.user.role === 'CANDIDATE') {
        return { error: "Unauthorized" };
    }

    const applicationId = formData.get('applicationId');
    const text = formData.get('text');

    if (!text || text.trim() === '') return { error: "Empty comment" };

    try {
        await db.comment.create({
            data: {
                text: text,
                applicationId: applicationId,
                userId: session.user.id
            }
        });
        
        // Revalidate the specific application page to show the new comment instantly
        revalidatePath(`/dashboard/application/${applicationId}`);
        return { success: true };
    } catch (error) {
        console.error("Comment Error:", error);
        return { error: "Failed to add comment" };
    }
}ID