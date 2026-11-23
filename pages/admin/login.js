import SiteImage from '../../components/SiteImage';
import Head from 'next/head';
import { useState } from 'react';
import { resetAdminSession } from '../../lib/adminClient.js';

export default function AdminLogin() {
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('admin');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (event) => {
    event.preventDefault();
    if (!password) return setError('Please enter the password for your selected profile.');
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, role, next: new URLSearchParams(window.location.search).get('next') }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || 'Unable to sign in.');
      resetAdminSession();
      window.location.href = data.destination;
    } catch (err) {
      setError(err.message || 'Unable to sign in.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head><title>Admin Login | Lotus Inn</title></Head>
      <main className="admin-login-page">
        <div className="admin-login-card">
          <div className="admin-login-brand">
            <SiteImage src="/images/LotusInnLogo.png" alt="Lotus Inn Guest House" onError={(e) => { e.currentTarget.src = '/images/lotusinn-logo.png'; }} />
            <span>LOTUS INN GUEST HOUSE</span>
          </div>
          <span className="admin-login-eyebrow">SECURE TEAM ACCESS</span>
          <h1>Welcome back</h1>
          <p className="admin-login-intro">Choose your profile to continue to Lotus Inn.</p>
          <form onSubmit={submit} className="admin-login-form">
            <fieldset className="admin-login-profiles" disabled={loading}><legend>Login profile</legend>{[
              { value: 'staff', title: 'Rooms & bookings', text: 'View room status, occupancy and booking information.' },
              { value: 'admin', title: 'Administrator', text: 'Full access to rooms, images, bookings and all management tools.' },
            ].map(profile => <label key={profile.value} className={role === profile.value ? 'selected' : ''}><input type="radio" name="profile" value={profile.value} checked={role === profile.value} onChange={() => { setRole(profile.value); setPassword(''); setError(''); }} /><span><strong>{profile.title}</strong><small>{profile.text}</small></span></label>)}</fieldset>
            <label htmlFor="admin-password">{role === 'staff' ? 'Staff password' : 'Administrator password'}</label>
            <div className="admin-password-wrap">
              <input id="admin-password" type={show ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" autoComplete="current-password" required maxLength={1024} disabled={loading} />
              <button type="button" onClick={() => setShow((v) => !v)} aria-label={show ? 'Hide password' : 'Show password'}><i className={show ? 'fa-solid fa-eye-slash' : 'fa-solid fa-eye'} /></button>
            </div>
            {error && <div className="admin-login-error" role="alert"><i className="fa-solid fa-circle-exclamation" />{error}</div>}
            <button className="admin-login-submit" type="submit" disabled={loading}>{loading ? 'Signing in…' : role === 'staff' ? 'Open rooms & bookings' : 'Open administrator panel'} <i className="fa-solid fa-arrow-right" /></button>
          </form>
          <a className="admin-login-back" href="/">← Back to website</a>
        </div>
      </main>
    </>
  );
}
