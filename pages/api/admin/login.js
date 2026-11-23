import crypto from 'node:crypto';
import { ADMIN_COOKIE, adminCredentials, createSessionToken, cookieOptions, checkRequestOrigin } from '../../../lib/adminAuth.js';
import { adminRoles, loginDestination } from '../../../lib/adminRoles.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed.' });
  res.setHeader('Cache-Control', 'no-store');
  if (!checkRequestOrigin(req, res)) return;
  const role = req.body?.role ?? 'admin';
  if (!adminRoles.includes(role)) return res.status(400).json({ message: 'Choose a valid login profile.' });
  const { password: adminPassword, secret } = adminCredentials();
  if (!adminPassword || !secret) return res.status(503).json({ message: 'Set ADMIN_PASSWORD and ADMIN_SESSION_SECRET before signing in.' });
  const expectedPassword = role === 'staff' ? process.env.STAFF_PASSWORD : adminPassword;
  if (!expectedPassword || (role === 'staff' && expectedPassword === adminPassword)) return res.status(503).json({ message: 'Staff access is not configured. Ask the administrator to set a separate STAFF_PASSWORD.' });
  const password = req.body?.password;
  if (typeof password !== 'string' || !password || password.length > 1024) return res.status(400).json({ message: 'Please enter a valid password.' });
  const digest = value => crypto.createHash('sha256').update(value).digest();
  if (!crypto.timingSafeEqual(digest(password), digest(expectedPassword))) return res.status(401).json({ message: 'Incorrect password for this profile.' });

  res.setHeader('Set-Cookie', `${ADMIN_COOKIE}=${await createSessionToken(Date.now(), role)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${cookieOptions.maxAge}${cookieOptions.secure ? '; Secure' : ''}`);
  return res.status(200).json({ success: true, role, destination: loginDestination(role, req.body?.next) });
}
