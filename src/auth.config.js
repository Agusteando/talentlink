
export const authConfig = {
  pages: {
    signIn: '/', // If they get kicked out, send them Home
    error: '/',  
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const role = auth?.user?.role;

      const isOnDashboard = nextUrl.pathname.startsWith('/dashboard');
      if (isOnDashboard) {
        // Allow only authenticated, non-candidate users; redirection handled by NextAuth/pages
        return isLoggedIn && role !== 'CANDIDATE';
      }

      const isOnMyApps = nextUrl.pathname.startsWith('/my-applications');
      if (isOnMyApps) {
        return isLoggedIn;
      }

      // Public Routes (Home, Apply) -> Allow everyone
      return true;
    },
  },
  providers: [], 
};
