// --- src\auth.js ---
import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import { db } from "@/lib/db"
import { authConfig } from "@/auth.config"

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [Google],
  callbacks: {
    async signIn({ user }) {
      if (!user.email) return false;
      
      try {
        const existingUser = await db.user.findUnique({ where: { email: user.email } });
        const isAdminEmail = user.email === process.env.DEFAULT_ADMIN_EMAIL;

        if (!existingUser) {
          await db.user.create({
            data: {
              email: user.email,
              name: user.name,
              image: user.image,
              role: isAdminEmail ? "ADMIN" : "CANDIDATE",
            }
          });
        } else if (isAdminEmail && existingUser.role !== 'ADMIN') {
             await db.user.update({
                where: { email: user.email },
                data: { role: 'ADMIN' }
             });
        }
        return true;
      } catch (error) {
        console.error("SignIn Error:", error);
        return false;
      }
    },
    async session({ session }) {
      if (session.user.email) {
        // Fetch fresh user data including the Plantel Relation
        const dbUser = await db.user.findUnique({ 
            where: { email: session.user.email },
            include: { plantel: true } 
        });
        
        if (dbUser) {
            session.user.id = dbUser.id;
            session.user.role = dbUser.role;
            // CRITICAL: Pass the Plantel ID to the session for the Dashboard to use
            session.user.plantelId = dbUser.plantelId || null;
            session.user.plantelName = dbUser.plantel?.name || null;
        }
      }
      return session;
    },
  },
})