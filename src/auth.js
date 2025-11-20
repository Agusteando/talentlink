import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import { db } from "@/lib/db"
import { authConfig } from "@/auth.config"

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [Google],
  callbacks: {
    // 1. SignIn Logic: Create user if they don't exist
    async signIn({ user, account, profile }) {
      if (!user.email) return false;
      
      try {
        const existingUser = await db.user.findUnique({ where: { email: user.email } });
        
        // Check for Super Admin environment variable
        const isAdminEmail = user.email === process.env.DEFAULT_ADMIN_EMAIL;
        const roleToAssign = isAdminEmail ? "ADMIN" : "CANDIDATE";

        if (!existingUser) {
          await db.user.create({
            data: {
              email: user.email,
              name: user.name,
              image: user.image,
              role: roleToAssign,
              plantel: isAdminEmail ? 'ALL' : null 
            }
          });
        } else {
          // Ensure Admin role is enforced if it matches the env var
          if (isAdminEmail && existingUser.role !== 'ADMIN') {
             await db.user.update({
                where: { email: user.email },
                data: { role: 'ADMIN' }
             });
          }
        }
        return true;
      } catch (error) {
        console.error("Error in signIn callback:", error);
        return false;
      }
    },
    // 2. Session Logic: Attach Role and Plantel to the session object
    async session({ session }) {
      if (session.user.email) {
        try {
            const dbUser = await db.user.findUnique({ where: { email: session.user.email } });
            if (dbUser) {
                session.user.id = dbUser.id;
                session.user.role = dbUser.role;
                session.user.plantel = dbUser.plantel;
            }
        } catch (error) {
            console.error("Error fetching user session data:", error);
        }
      }
      return session;
    },
  },
})