import { NextResponse } from 'next/server';
import { ADMIN_COOKIE, getSession } from './lib/session.js';
import { canAccessAdminPage, roleHome } from './lib/adminRoles.js';

export async function middleware(request) {
  const { pathname } = request.nextUrl;
  if (pathname === '/admin/login' || pathname === '/api/admin/login') return NextResponse.next();

  const token = request.cookies.get(ADMIN_COOKIE)?.value;
  const session = await getSession(token);
  if (session) {
    if (pathname.startsWith('/api/admin/')) {
      const shared = ['/api/admin/session', '/api/admin/page', '/api/admin/logout'];
      if (session.role === 'staff' && !shared.includes(pathname)) return NextResponse.json({ message: 'This action requires an administrator account.' }, { status: 403 });
      return NextResponse.next();
    }
    if (canAccessAdminPage(session.role, pathname)) return NextResponse.next();
    return NextResponse.redirect(new URL(roleHome(session.role), request.url));
  }

  if (pathname.startsWith('/api/admin/')) {
    return NextResponse.json({ message: 'Admin authentication required.' }, { status: 401 });
  }

  const loginUrl = new URL('/admin/login', request.url);
  loginUrl.searchParams.set('next', pathname + request.nextUrl.search);
  return NextResponse.redirect(loginUrl);
}

export const config = { matcher: ['/admin/:path*', '/api/admin/:path*'] };
