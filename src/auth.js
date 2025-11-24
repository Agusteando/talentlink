
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { db } from "@/lib/db";
import { authConfig } from "@/auth.config";
import { PERMISSIONS } from "@/lib/permissions";

const ALLOWED_DOMAIN = "casitaiedis.edu.mx";
const DEFAULT_STAFF_ROLE_NAME = "Staff Básico";

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
        console.error(
          "🚫 BLOCKING LOGIN: Email not in allowed domain and not bootstrap admin",
          {
            email,
            domain,
            allowedDomain: ALLOWED_DOMAIN,
            defaultAdminEmail,
          }
        );
        return false;
      }

      // 2) Best-effort registration / bootstrap in DB
      try {
        let superAdminRole = null;
        let basicStaffRole = null;

        const allPermissionValues = Object.values(PERMISSIONS);
        const basicPermissionValues = [PERMISSIONS.VIEW_DASHBOARD];

        // Ensure Super Admin role exists ONLY for the bootstrap admin
        if (isBootstrapAdmin) {
          const allPermsJson = JSON.stringify(allPermissionValues);

          superAdminRole = await db.role.upsert({
            where: { name: "Super Admin" },
            update: {
              isGlobal: true,
              permissions: allPermsJson,
            },
            create: {
              name: "Super Admin",
              isGlobal: true,
              permissions: allPermsJson,
            },
          });

          console.log("[Auth] Super Admin role ensured", {
            roleId: superAdminRole.id,
          });
        }

        // Ensure default basic staff role exists for regular users
        const basicPermsJson = JSON.stringify(basicPermissionValues);
        basicStaffRole = await db.role.upsert({
          where: { name: DEFAULT_STAFF_ROLE_NAME },
          update: {
            isGlobal: false,
            permissions: basicPermsJson,
          },
          create: {
            name: DEFAULT_STAFF_ROLE_NAME,
            isGlobal: false,
            permissions: basicPermsJson,
          },
        });

        console.log("[Auth] Basic staff role ensured", {
          roleId: basicStaffRole.id,
          permissions: basicPermissionValues,
        });

        const existingUser = await db.user.findUnique({
          where: { email },
        });

        if (!existingUser) {
          // Any @casitaiedis.edu.mx user is registered here on first login
          const assignedRoleId = isBootstrapAdmin
            ? superAdminRole?.id || null
            : basicStaffRole.id;

          console.log("[Auth] Creating new user record", {
            email,
            isBootstrapAdmin,
            assignRoleId: assignedRoleId,
          });

          await db.user.create({
            data: {
              email,
              name: user.name,
              image: user.image,
              // DEFAULT_ADMIN_EMAIL -> Super Admin, otherwise Staff Básico
              roleId: assignedRoleId,
            },
          });
        } else if (isBootstrapAdmin && !existingUser.roleId) {
          // Safety net: if bootstrap admin exists but has no role, assign Super Admin
          if (!superAdminRole) {
            const allPermsJson = JSON.stringify(allPermissionValues);
            superAdminRole = await db.role.upsert({
              where: { name: "Super Admin" },
              update: {
                isGlobal: true,
                permissions: allPermsJson,
              },
              create: {
                name: "Super Admin",
                isGlobal: true,
                permissions: allPermsJson,
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
        } else if (!isBootstrapAdmin && !existingUser.roleId) {
          // Safety net for legacy users without role: assign basic staff role
          console.log("[Auth] Assigning basic staff role to existing user without role", {
            email,
            roleId: basicStaffRole.id,
          });

          await db.user.update({
            where: { email },
            data: { roleId: basicStaffRole.id },
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
            const defaultAdminEmail =
              (process.env.DEFAULT_ADMIN_EMAIL || "").toLowerCase();
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
