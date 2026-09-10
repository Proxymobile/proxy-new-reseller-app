import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
  pages: {
    signIn: '/login',
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const role = (auth?.user as { role?: string } | undefined)?.role;
      const isAdminPath = nextUrl.pathname.startsWith('/admin');
      const isDashboard = nextUrl.pathname.startsWith('/dashboard');
      const isAuthPage = nextUrl.pathname === '/login' || nextUrl.pathname === '/register';

      // Defense-in-depth: the admin area requires the admin role at the edge,
      // not merely a valid session. (The admin layout also re-checks server-side.)
      if (isAdminPath) {
        if (!isLoggedIn) return false;
        if (role !== 'admin') return Response.redirect(new URL('/dashboard', nextUrl));
        return true;
      }

      if (isDashboard) {
        return isLoggedIn;
      }

      if (isAuthPage && isLoggedIn) {
        return Response.redirect(new URL('/dashboard', nextUrl));
      }

      return true;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
