
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { db } from "@/lib/db";
import { authConfig } from "@/auth.config";
import { PERMISSIONS } from "@/lib/permissions";

const ALLOWED_DOMAIN = "casitaiedis.edu.mx";

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  providers: [Google],
  callbacks: {
    async signIn({ user }) {
      const rawEmail = user?.email || "";
      const email = rawEmail.toLowerCase();

      console.log("🔐 Attempting login", { email });

      if (!email) {
        console.error("🚫 BLOCKING LOGIN: Missing email from provider payload");
        return false;
      }

      const [, domain] = email.split("@");
      const defaultAdminEmail = (process.env.DEFAULT_ADMIN_EMAIL || "").toLowerCase();
      const isAllowedDomain = domain === ALLOWED_DOMAIN;
      const isBootstrapAdmin = email === defaultAdminEmail;

      // 1) Corporate wall: only casitaiedis.edu.mx or the explicit bootstrap admin can pass
      if (!isAllowedDomain && !isBootstrapAdmin) {
        console.error("🚫 BLOCKING LOGIN: Email not in allowed domain and not bootstrap admin", {
          email,
          domain,
          allowedDomain: ALLOWED_DOMAIN,
          defaultAdminEmail,
        });
        return false;
      }

      // 2) Best-effort registration / bootstrap in DB
      try {
        let superAdminRole = null;

        // Ensure Super Admin role exists ONLY for the bootstrap admin
        if (isBootstrapAdmin) {
          const allPerms = JSON.stringify(Object.values(PERMISSIONS));

          superAdminRole = await db.role.upsert({
            where: { name: "Super Admin" },
            update: {
              isGlobal: true,
              permissions: allPerms,
            },
            create: {
              name: "Super Admin",
              isGlobal: true,
              permissions: allPerms,
            },
          });

          console.log("[Auth] Super Admin role ensured", {
            roleId: superAdminRole.id,
          });
        }

        const existingUser = await db.user.findUnique({
          where: { email },
        });

        if (!existingUser) {
          // Any @casitaiedis.edu.mx user is registered here on first login
          console.log("[Auth] Creating new user record", {
            email,
            isBootstrapAdmin,
            assignRoleId: superAdminRole?.id || null,
          });

          await db.user.create({
            data: {
              email,
              name: user.name,
              image: user.image,
              // Only the DEFAULT_ADMIN_EMAIL gets Super Admin automatically
              roleId: isBootstrapAdmin ? superAdminRole?.id || null : null,
            },
          });
        } else if (isBootstrapAdmin && !existingUser.roleId) {
          // Safety net: if bootstrap admin exists but has no role, assign Super Admin
          if (!superAdminRole) {
            const allPerms = JSON.stringify(Object.values(PERMISSIONS));
            superAdminRole = await db.role.upsert({
              where: { name: "Super Admin" },
              update: {
                isGlobal: true,
                permissions: allPerms,
              },
              create: {
                name: "Super Admin",
                isGlobal: true,
                permissions: allPerms,
              },
            });
          }

          console.log("[Auth] Fixing bootstrap admin without role", {
            email,
            roleId: superAdminRole.id,
          });

          await db.user.update({
            where: { email },
            data: { roleId: superAdminRole.id },
          });
        } else {
          console.log("[Auth] Existing user login", {
            email,
            hasRoleId: !!existingUser.roleId,
          });
        }
      } catch (error) {
        // We log the error but DO NOT block login to avoid hard lockouts
        console.error("❌ LOGIN DB BOOTSTRAP ERROR:", error);
      }

      // If we reach here, domain check passed → allow sign-in
      return true;
    },

    async session({ session }) {
      if (session.user?.email) {
        try {
          const email = session.user.email.toLowerCase();

          // 4) LOAD SESSION DATA (with 1:N planteles)
          const dbUser = await db.user.findUnique({
            where: { email },
            include: {
              role: true,
              plantels: true,
            },
          });

          if (dbUser) {
            session.user.id = dbUser.id;
            session.user.plantelIds = Array.isArray(dbUser.plantels)
              ? dbUser.plantels.map((p) => p.id)
              : [];

            // Role hydration
            if (dbUser.role) {
              session.user.roleName = dbUser.role.name;
              session.user.isGlobal = dbUser.role.isGlobal;
              try {
                session.user.permissions = JSON.parse(dbUser.role.permissions);
              } catch (e) {
                console.error("[Auth] Failed to parse role.permissions JSON", {
                  email,
                  error: e?.message,
                });
                session.user.permissions = [];
              }
            } else {
              session.user.roleName = "Sin Rol";
              session.user.permissions = [];
              session.user.isGlobal = false;
            }

            // 5) ADMIN OVERRIDE (The "User One" Safety Net)
            const defaultAdminEmail = (process.env.DEFAULT_ADMIN_EMAIL || "").toLowerCase();
            if (email === defaultAdminEmail) {
              session.user.permissions = Object.values(PERMISSIONS);
              session.user.isGlobal = true;
              session.user.roleName = "Super Admin";
            }
          } else {
            console.warn("[Auth] Session user email not found in DB", { email });
            session.user.permissions = [];
            session.user.roleName = "Sin Rol";
            session.user.isGlobal = false;
          }
        } catch (e) {
          console.error("⚠️ Session Error:", e);
          // Don't crash the session, just degrade gracefully
          session.user.permissions = [];
          session.user.roleName = "Sin Rol";
          session.user.isGlobal = false;
        }
      }
      return session;
    },
  },
});
