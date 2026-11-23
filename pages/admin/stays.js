import AdminLayout from '../../components/AdminLayout';

export default function StaffBookings({ items, today }) {
  return <AdminLayout title="Read-only booking information for the guest house team.">
    <section className="admin-panel"><span className="admin-role-badge">ROOMS & BOOKINGS · VIEW ONLY</span><h2>Booking information</h2><p>Review guest names, rooms, stay dates, and booking status. For changes or cancellations, contact the administrator.</p><p>Today in Mirpur: {today}</p>
      <div className="operations-table-wrap"><table className="admin-table"><thead><tr><th>Guest</th><th>Room</th><th>Check-in</th><th>Check-out</th><th>Guests</th><th>Status</th></tr></thead><tbody>{items.length ? items.map(item => <tr key={item.id}><td>{item.fullName || 'Guest'}</td><td>{item.roomType}</td><td>{item.checkIn}</td><td>{item.checkOut}</td><td>{item.guests}</td><td>{item.status || 'Pending'}</td></tr>) : <tr><td colSpan="6">No bookings found.</td></tr>}</tbody></table></div>
    </section>
  </AdminLayout>;
}
