// --- src/auth.js ---
import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import { db } from "@/lib/db"
import { authConfig } from "@/auth.config"
import { PERMISSIONS } from "@/lib/permissions"

const ALLOWED_DOMAIN = "casitaiedis.edu.mx"; 

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [Google],
  callbacks: {
    async signIn({ user }) {
      if (!user.email) return false;

      // 1. DOMAIN CHECK
      const emailDomain = user.email.split('@')[1];
      const isAllowedDomain = emailDomain === ALLOWED_DOMAIN;
      const isAdminEmail = user.email === process.env.DEFAULT_ADMIN_EMAIL;

      if (!isAllowedDomain && !isAdminEmail) return false; 
      
      try {
        // 2. BOOTSTRAP SUPER ADMIN ROLE (If missing)
        let adminRole = await db.role.findUnique({ where: { name: 'Super Admin' } });
        
        if (!adminRole) {
            adminRole = await db.role.create({
                data: {
                    name: 'Super Admin',
                    isGlobal: true,
                    permissions: JSON.stringify(Object.values(PERMISSIONS))
                }
            });
        }

        // 3. SYNC USER
        const existingUser = await db.user.findUnique({ where: { email: user.email } });

        if (!existingUser) {
          await db.user.create({
            data: {
              email: user.email,
              name: user.name,
              image: user.image,
              roleId: adminRole.id, 
            }
          });
        } else {
             if (!existingUser.roleId) {
                 await db.user.update({
                    where: { email: user.email },
                    data: { roleId: adminRole.id }
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
        try {
            const dbUser = await db.user.findUnique({ 
                where: { email: session.user.email },
                include: { role: true, plantel: true } 
            });
            
            if (dbUser) {
                session.user.id = dbUser.id;
                session.user.plantelId = dbUser.plantelId || null;
                session.user.plantelName = dbUser.plantel?.name || null;
                
                // ROLE HYDRATION
                if (dbUser.role) {
                    session.user.roleName = dbUser.role.name; // Uses real DB name
                    session.user.isGlobal = dbUser.role.isGlobal;
                    try {
                        session.user.permissions = JSON.parse(dbUser.role.permissions);
                    } catch (e) {
                        session.user.permissions = [];
                    }
                } else {
                    session.user.roleName = "Usuario"; // Neutral fallback
                    session.user.permissions = [];
                    session.user.isGlobal = false;
                }

                // SAFETY HATCH (Transparent)
                // If you are the ENV admin, you get full permissions, but the UI
                // simply calls you "Super Admin" or respects your DB role name if it exists.
                if (session.user.email === process.env.DEFAULT_ADMIN_EMAIL) {
                    session.user.permissions = Object.values(PERMISSIONS);
                    session.user.isGlobal = true;
                    if (!session.user.roleName || session.user.roleName === "Usuario") {
                        session.user.roleName = "Super Admin";
                    }
                }
            }
        } catch (e) {
            console.error("Session Error:", e);
            session.user.permissions = [];
        }
      }
      return session;
    },
  },
})