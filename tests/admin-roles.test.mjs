import test from 'node:test';
import assert from 'node:assert/strict';
import { createHmac, randomUUID } from 'node:crypto';
import { createSessionToken, getSession, adminCredentials, SESSION_MAX_AGE } from '../lib/session.js';
import { requireAdminApi, requireAdminPage } from '../lib/adminAuth.js';
import { canAccessAdminPage, loginDestination } from '../lib/adminRoles.js';
import { roomOverview } from '../lib/roomOverview.js';

function response() {
  return { setHeader() {}, status(code) { this.code = code; return this; }, json(data) { this.data = data; return this; } };
}

test('roles are signed and staff cannot upgrade, strip, or reuse another role signature', async () => {
  const saved = process.env.STAFF_PASSWORD;
  process.env.STAFF_PASSWORD = randomUUID();
  try {
    const now = Date.now();
    const staff = await createSessionToken(now, 'staff');
    const admin = await createSessionToken(now);
    assert.equal((await getSession(staff, now)).role, 'staff');
    assert.equal((await getSession(admin, now)).role, 'admin');
    assert.equal(await getSession(staff.replace('.staff.', '.admin.'), now), null);
    assert.equal(await getSession(staff.replace('.staff.', '.'), now), null);
    assert.equal(await getSession(staff, now + SESSION_MAX_AGE * 1000), null);
    process.env.STAFF_PASSWORD = randomUUID();
    assert.equal(await getSession(staff, now), null, 'Password rotation revokes staff sessions.');
    assert.equal((await getSession(admin, now)).role, 'admin', 'Staff password changes do not affect the administrator.');
    process.env.STAFF_PASSWORD = adminCredentials().password;
    await assert.rejects(createSessionToken(now, 'staff'), /not configured/);
    delete process.env.STAFF_PASSWORD;
    await assert.rejects(createSessionToken(now, 'staff'), /not configured/);
    await assert.rejects(createSessionToken(now, 'owner'), /not configured/);
  } finally { if (saved === undefined) delete process.env.STAFF_PASSWORD; else process.env.STAFF_PASSWORD = saved; }
});

test('existing administrator sessions remain administrator sessions until expiry', async () => {
  const { password, secret } = adminCredentials();
  const payload = `${Math.floor(Date.now() / 1000) + 3600}.${randomUUID()}`;
  const legacy = `${payload}.${createHmac('sha256', `${password}:${secret}`).update(payload).digest('hex')}`;
  assert.equal((await getSession(legacy)).role, 'admin');
});

test('server helpers block staff management requests without relying on middleware', async () => {
  const saved = process.env.STAFF_PASSWORD;
  process.env.STAFF_PASSWORD = randomUUID();
  try {
    const token = await createSessionToken(Date.now(), 'staff');
    for (const method of ['GET', 'POST', 'PATCH', 'DELETE']) {
      const res = response();
      assert.equal(await requireAdminApi({ method, cookies: { lotus_admin_session: token }, headers: {} }, res), false);
      assert.equal(res.code, 403);
    }
    const req = { method: 'GET', cookies: { lotus_admin_session: token }, headers: {} };
    assert.equal(await requireAdminApi(req, response(), ['staff', 'admin']), true);
    assert.equal(req.auth.role, 'staff');
    const redirect = await requireAdminPage({ req, res: response(), resolvedUrl: '/admin/images' });
    assert.equal(redirect.redirect.destination, '/admin/overview');
    assert.equal(await requireAdminPage({ req, res: response(), resolvedUrl: '/admin/stays' }), null);
  } finally { if (saved === undefined) delete process.env.STAFF_PASSWORD; else process.env.STAFF_PASSWORD = saved; }
});

test('role destinations reject forbidden, external, malformed, and lookalike paths', () => {
  assert.equal(canAccessAdminPage('staff', '/admin/overview'), true);
  assert.equal(canAccessAdminPage('staff', '/admin/stays?q=Guest'), true);
  for (const path of ['/admin', '/admin/images', '/admin/bookings', '/admin/overview/../images', '/administrator']) assert.equal(canAccessAdminPage('staff', path), false);
  for (const path of ['https://evil.test', '//evil.test', '/administrator', '/admin/login', '/admin\\evil', '/admin\r\n']) assert.equal(loginDestination('admin', path), '/admin');
  assert.equal(loginDestination('staff', '/admin/expenses'), '/admin/overview');
  assert.equal(loginDestination('staff', '/admin/stays?q=Guest'), '/admin/stays?q=Guest');
  assert.equal(canAccessAdminPage('invented', '/admin'), false);
});

test('overview counts date-based reservations, overrides, and departures without disclosing private booking data', () => {
  const rooms = [{ slug: 'deluxe', title: 'Deluxe', availability: 'Available' }, { slug: 'standard', title: 'Standard', availability: 'Maintenance' }, { slug: 'family', title: 'Family', availability: 'Hold' }, { slug: 'single', title: 'Single', availability: 'Available' }];
  const stay = { id: '1', roomSlug: 'deluxe', roomType: 'Deluxe', fullName: 'Guest', checkIn: '2026-11-23', checkOut: '2026-11-25', status: 'Confirmed', email: 'private@example.test', phone: 'private', amount: 14000, notes: 'private notes' };
  const data = roomOverview(rooms, [stay, { ...stay, id: '2', roomSlug: 'standard' }, { ...stay, id: '3', roomSlug: 'single', checkIn: '2026-11-21', checkOut: '2026-11-23' }, { ...stay, id: '4', roomSlug: 'single', status: 'Cancelled' }], '2026-11-23');
  assert.deepEqual(data.totals, { total: 4, available: 1, booked: 1, maintenance: 1, hold: 1, arrivals: 2, departures: 1 });
  assert.equal(data.rooms[0].stays[0].fullName, 'Guest');
  assert.equal(data.rooms[3].stays.length, 0, 'Checkout day does not occupy a room.');
  assert.doesNotMatch(JSON.stringify(data), /private@example|private notes|14000|"phone"/);
});
