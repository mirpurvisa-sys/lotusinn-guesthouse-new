import { occupiesRoom } from './booking.js';

export function roomOverview(rooms, bookings, today) {
  const items = rooms.map(room => {
    const active = bookings.filter(booking => occupiesRoom(booking, room, today));
    const manual = ['Available', 'Booked', 'Maintenance', 'Hold'].includes(room.availability) ? room.availability : 'Available';
    const status = active.length && !['Maintenance', 'Hold'].includes(manual) ? 'Booked' : manual;
    return {
      slug: room.slug, title: room.title, roomNumber: room.roomNumber || '', image: room.image || '', status,
      // Staff sees stay details, never payment, contact information, or private notes.
      stays: active.map(booking => ({ id: booking.id, fullName: booking.fullName || '', checkIn: booking.checkIn, checkOut: booking.checkOut, guests: booking.guests || '', status: booking.status || 'Pending' })),
    };
  });
  return { today, rooms: items, totals: {
    total: items.length,
    available: items.filter(room => room.status === 'Available').length,
    booked: items.filter(room => room.status === 'Booked').length,
    maintenance: items.filter(room => room.status === 'Maintenance').length,
    hold: items.filter(room => room.status === 'Hold').length,
    arrivals: bookings.filter(booking => booking.checkIn === today && ['Pending', 'Confirmed', 'Checked In'].includes(booking.status || 'Pending')).length,
    departures: bookings.filter(booking => booking.checkOut === today && ['Confirmed', 'Checked In', 'Checked Out'].includes(booking.status)).length,
  } };
}
