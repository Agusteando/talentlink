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
      console.log(`🔐 Attempting login for: ${user.email}`);

      if (!user.email) return false;

      // 1. SECURITY CHECK
      const emailDomain = user.email.split('@')[1];
      const isAllowedDomain = emailDomain === ALLOWED_DOMAIN;
      const isAdminEmail = user.email === process.env.DEFAULT_ADMIN_EMAIL;

      if (!isAllowedDomain && !isAdminEmail) {
        console.error(`🚫 BLOCKING LOGIN: ${user.email} is not in ${ALLOWED_DOMAIN} and is not the Default Admin.`);
        return false; 
      }
      
      try {
        // 2. ENSURE SUPER ADMIN ROLE EXISTS
        // We use upsert to guarantee it exists and has correct permissions
        const allPerms = JSON.stringify(Object.values(PERMISSIONS));
        
        const adminRole = await db.role.upsert({
            where: { name: 'Super Admin' },
            update: { 
                isGlobal: true, 
                permissions: allPerms // Self-heal permissions if they were empty
            },
            create: {
                name: 'Super Admin',
                isGlobal: true,
                permissions: allPerms
            }
        });

        // 3. HANDLE USER (Create or Update)
        const existingUser = await db.user.findUnique({ where: { email: user.email } });

        if (!existingUser) {
            console.log("👤 Creating New User as Super Admin");
            await db.user.create({
                data: {
                    email: user.email,
                    name: user.name,
                    image: user.image,
                    roleId: adminRole.id, // Assign Role immediately
                }
            });
        } else {
            // FIX: If user exists but has NO role (Ghost User), give them Admin
            if (!existingUser.roleId) {
                console.log("🔧 Fixing User Role (assigning Super Admin)");
                await db.user.update({
                    where: { email: user.email },
                    data: { roleId: adminRole.id }
                });
            }
        }
        
        return true;
      } catch (error) {
        console.error("❌ LOGIN CRASHED:", error);
        return false; // This causes the "Access Denied" screen
      }
    },
    async session({ session }) {
      if (session.user.email) {
        try {
            // 4. LOAD SESSION DATA (With 1:N Plantels fix)
            const dbUser = await db.user.findUnique({ 
                where: { email: session.user.email },
                include: { 
                    role: true, 
                    plantels: true // Fix: Plural
                } 
            });
            
            if (dbUser) {
                session.user.id = dbUser.id;
                // Fix: Handle array mapping safely
                session.user.plantelIds = dbUser.plantels ? dbUser.plantels.map(p => p.id) : [];
                
                // Role Hydration
                if (dbUser.role) {
                    session.user.roleName = dbUser.role.name;
                    session.user.isGlobal = dbUser.role.isGlobal;
                    try {
                        session.user.permissions = JSON.parse(dbUser.role.permissions);
                    } catch (e) {
                        session.user.permissions = [];
                    }
                } else {
                    session.user.roleName = "Sin Rol";
                    session.user.permissions = [];
                    session.user.isGlobal = false;
                }

                // 5. ADMIN OVERRIDE (The "User One" Safety Net)
                // Even if DB is corrupted, if env email matches, give full access
                if (session.user.email === process.env.DEFAULT_ADMIN_EMAIL) {
                    session.user.permissions = Object.values(PERMISSIONS);
                    session.user.isGlobal = true;
                    session.user.roleName = "Super Admin";
                }
            }
        } catch (e) {
            console.error("⚠️ Session Error:", e);
            // Don't crash the session, just degrade gracefully
            session.user.permissions = [];
        }
      }
      return session;
    },
  },
})