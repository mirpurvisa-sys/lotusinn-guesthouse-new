import { requireAdminApi } from '../../../lib/adminAuth.js';

export default async function handler(req, res) {
  if (!await requireAdminApi(req, res, ['admin', 'staff'])) return;
  if (req.method !== 'GET') { res.setHeader('Allow', 'GET'); return res.status(405).end(); }
  return res.status(200).json({ role: req.auth.role });
}
