import { ADMIN_COOKIE, SESSION_MAX_AGE, getSession } from './session.js';
import { canAccessAdminPage, roleHome } from './adminRoles.js';
export { ADMIN_COOKIE, createSessionToken, isValidSession, adminCredentials } from './session.js';

export const cookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  maxAge: SESSION_MAX_AGE,
};

export function checkRequestOrigin(req, res) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method) || !req.headers.origin) return true;
  try {
    if (new URL(req.headers.origin).host === req.headers.host) return true;
  } catch {}
  res.status(403).json({ message: 'Request origin is not allowed.' });
  return false;
}

export async function requireAdminApi(req, res, roles = ['admin']) {
  res.setHeader('Cache-Control', 'no-store');
  const session = await getSession(req.cookies?.[ADMIN_COOKIE]);
  if (!session) {
    res.status(401).json({ message: 'Admin authentication required.' });
    return false;
  }
  if (!roles.includes(session.role)) {
    res.status(403).json({ message: 'This action requires an administrator account.' });
    return false;
  }
  req.auth = session;
  return checkRequestOrigin(req, res);
}

export async function requireAdminPage(context) {
  context.res.setHeader('Cache-Control', 'no-store');
  const session = await getSession(context.req.cookies?.[ADMIN_COOKIE]);
  if (session) {
    if (canAccessAdminPage(session.role, context.resolvedUrl || '/admin')) return null;
    return { redirect: { destination: roleHome(session.role), permanent: false } };
  }
  return { redirect: { destination: `/admin/login?next=${encodeURIComponent(context.resolvedUrl || '/admin')}`, permanent: false } };
}
