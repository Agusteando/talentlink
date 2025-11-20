// src/auth.config.js
export const authConfig = {
  pages: {
    signIn: '/', 
    error: '/',  
  },
  callbacks: {
    // FIX: Destructure 'nextUrl' directly from the 'request' object
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnDashboard = nextUrl.pathname.startsWith('/dashboard');

      if (isOnDashboard) {
        if (isLoggedIn) return true;
        return false; // Redirect unauthenticated users to login page
      }
      
      // Allow access to all other routes
      return true;
    },
  },
  providers: [], 
};