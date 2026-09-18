import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
  pages: {
    signIn: '/login',
  },
  callbacks: {
    // The middleware builds its session from this edge-safe config only, so the
    // role written into the JWT at sign-in (see auth.ts) must be copied onto the
    // session here too — otherwise `authorized` never sees role === 'admin'.
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string | undefined;
      }
      return session;
    },
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
