// --- src/auth.config.js ---
export const authConfig = {
  pages: {
    signIn: '/', // If they get kicked out, send them Home
    error: '/',  
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const role = auth?.user?.role;

      // 1. Protect Dashboard Routes (Admin/Director/RH)
      const isOnDashboard = nextUrl.pathname.startsWith('/dashboard');
      if (isOnDashboard) {
        if (!isLoggedIn) return false; // Redirect unauthenticated to Home
        if (role === 'CANDIDATE') return Response.redirect(new URL('/my-applications', nextUrl));
        return true; // Grant access
      }

      // 2. Protect Candidate Routes
      const isOnMyApps = nextUrl.pathname.startsWith('/my-applications');
      if (isOnMyApps) {
        if (!isLoggedIn) return false;
        return true;
      }

      // 3. Public Routes (Home, Apply) -> Allow everyone
      return true;
    },
  },
  providers: [], 
};