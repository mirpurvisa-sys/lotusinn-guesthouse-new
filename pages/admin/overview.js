import { useState } from 'react';
import Link from 'next/link';
import AdminLayout from '../../components/AdminLayout';
import SiteImage from '../../components/SiteImage';
import { useRouter } from 'next/router';

export default function OperationsOverview({ rooms, totals, today }) {
  const [filter, setFilter] = useState('All');
  const router = useRouter();
  const cards = [['Listed rooms', totals.total], ['Available', totals.available], ['Booked / reserved', totals.booked], ['Maintenance', totals.maintenance], ['On hold', totals.hold], ['Arrivals today', totals.arrivals], ['Departures today', totals.departures]];
  return <AdminLayout title="Read-only room occupancy and daily stay information.">
    <section className="operations-heading"><div><span className="admin-role-badge">ROOMS & BOOKINGS · VIEW ONLY</span><h2>Room overview</h2><p>Today in Mirpur: {today}. Counts follow the room listings configured by the administrator.</p></div><button type="button" className="admin-btn admin-btn-outline" onClick={() => router.reload()}>Refresh overview</button></section>
    <section className="operations-stats" aria-label="Room and stay totals">{cards.map(([label, count]) => <div key={label}><span>{label}</span><strong>{count}</strong></div>)}</section>
    <section className="admin-panel"><div className="admin-header-row"><div><h3>Current room status</h3><p>Active stays and the availability settings maintained by your administrator.</p></div><label className="operations-filter">Show rooms<select value={filter} onChange={event => setFilter(event.target.value)}>{['All', 'Available', 'Booked', 'Maintenance', 'Hold'].map(item => <option key={item}>{item}</option>)}</select></label></div>
      <div className="operations-room-grid">{rooms.filter(room => filter === 'All' || room.status === filter).map(room => <article className="operations-room" key={room.slug}>{room.image && <SiteImage src={room.image} alt={room.title} sizes="(max-width: 760px) 100vw, 33vw" />}<div><div className="admin-header-row"><h4>{room.title}</h4><span className={`admin-availability-pill ${room.status.toLowerCase()}`}>{room.status}</span></div>{room.roomNumber && <p>Room number: {room.roomNumber}</p>}{room.stays.length ? room.stays.map(stay => <div className="operations-stay" key={stay.id}><strong>{stay.fullName || 'Guest'}</strong><span>{stay.checkIn} → {stay.checkOut}</span><span>{stay.status}{stay.guests ? ` · ${stay.guests} guests` : ''}</span></div>) : <p>No active stay linked for today.</p>}</div></article>)}</div>
      {!rooms.some(room => filter === 'All' || room.status === filter) && <p role="status">No rooms match this status.</p>}
      <p className="operations-note">Booked / reserved includes active pending and confirmed requests. Maintenance and hold settings take priority. Room counts represent configured listings, which may be room types.</p><Link className="admin-btn" href="/admin/stays">View booking information</Link>
    </section>
  </AdminLayout>;
}
