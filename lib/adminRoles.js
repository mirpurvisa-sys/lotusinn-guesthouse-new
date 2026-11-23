export const adminRoles = ['admin', 'staff'];
export const staffPages = ['/admin/overview', '/admin/stays'];

export function roleHome(role) {
  return role === 'staff' ? '/admin/overview' : '/admin';
}

export function canAccessAdminPage(role, path) {
  if (!adminRoles.includes(role) || typeof path !== 'string') return false;
  const pathname = path.split('?')[0];
  if (role === 'staff') return staffPages.includes(pathname);
  return pathname === '/admin' || pathname.startsWith('/admin/');
}

export function loginDestination(role, next) {
  // Only same-site admin paths are valid login destinations.
  if (typeof next !== 'string' || /[\\#\r\n]/.test(next)) return roleHome(role);
  const pathname = next.split('?')[0];
  if (pathname === '/admin/login' || !canAccessAdminPage(role, pathname)) return roleHome(role);
  return next;
}
