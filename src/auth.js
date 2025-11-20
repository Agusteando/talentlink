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
        
        // Auto-detect Super Admin from Env
        const isAdminEmail = user.email === process.env.DEFAULT_ADMIN_EMAIL;

        if (!existingUser) {
          // NEW USER: Register as CANDIDATE by default
          await db.user.create({
            data: {
              email: user.email,
              name: user.name,
              image: user.image,
              role: isAdminEmail ? "ADMIN" : "CANDIDATE",
              allowedPlantels: isAdminEmail ? "ALL" : null
            }
          });
        } else {
          // Existing User: Sync Admin status if needed
          if (isAdminEmail && existingUser.role !== 'ADMIN') {
             await db.user.update({
                where: { email: user.email },
                data: { role: 'ADMIN', allowedPlantels: 'ALL' }
             });
          }
        }
        return true;
      } catch (error) {
        console.error("SignIn Error:", error);
        return false;
      }
    },
    async session({ session }) {
      if (session.user.email) {
        const dbUser = await db.user.findUnique({ where: { email: session.user.email } });
        if (dbUser) {
            session.user.id = dbUser.id;
            session.user.role = dbUser.role;
            // Pass the comma-separated list to the frontend/session
            session.user.allowedPlantels = dbUser.allowedPlantels || ""; 
        }
      }
      return session;
    },
  },
})