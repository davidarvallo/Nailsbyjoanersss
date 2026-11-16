import {test} from 'node:test';
import assert from 'node:assert/strict';
import {dayKey,monthCells,shiftMonth,effectiveStatus,appointmentMetrics,appointmentsForDay,filterAppointments} from '../admin-dashboard.js';
const now=new Date('2026-11-16T18:00:00Z');
const row=(id,status,start,more={})=>({
 id,status,start_at:start,end_at:new Date(new Date(start).getTime()+7200000).toISOString(),
 expires_at:'2026-11-17T08:00:00Z',
 data:{name:id,service:'short-acrylic-set',phone:'9095550100',...more}
});
const bookings=[
 row('Joane Pending','pending','2026-11-17T17:00:00Z'),
 row('Client Confirmed','confirmed','2026-11-19T16:30:00Z',{phone:'9095550199'}),
 row('Past Client','confirmed','2026-11-12T18:30:00Z'),
 row('Canceled Client','canceled','2026-11-20T18:30:00Z'),
 row('Time off','blocked','2026-11-18T18:30:00Z'),
 {...row('Expired Request','pending','2026-11-20T19:30:00Z'),expires_at:'2026-11-16T09:00:00Z'}
];
test('dashboard uses Pacific dates including DST and consistent calendar boundaries',()=>{
 assert.equal(dayKey('2026-11-17T07:30:00Z'),'2026-11-16');
 assert.equal(dayKey('2026-11-17T08:30:00Z'),'2026-11-17');
 assert.equal(shiftMonth('2026-12',1),'2027-01');
 assert.equal(shiftMonth('2026-01',-1),'2025-12');
 const cells=monthCells('2026-11');
 assert.equal(cells.length,42);
 assert.equal(cells[0].date,'2026-11-01');
 assert.equal(cells.at(-1).date,'2026-12-12');
 assert.equal(cells.find(c=>c.date==='2026-11-19')?.inMonth,true);
 assert.throws(()=>monthCells('2026-13'));
});
test('dashboard counts upcoming pending and confirmed, not canceled or expired holds',()=>{
 const m=appointmentMetrics(bookings,now);
 assert.deepEqual(m,{pending:1,confirmed:1,today:0,week:2});
 assert.equal(effectiveStatus(bookings.at(-1),now),'expired');
});
test('upcoming filter defaults to appointments, not just pending, and history stays accessible',()=>{
 assert.deepEqual(filterAppointments(bookings,{now}).map(b=>b.id),['Joane Pending','Client Confirmed']);
 assert.deepEqual(filterAppointments(bookings,{filter:'pending',now}).map(b=>b.id),['Joane Pending']);
 assert.deepEqual(filterAppointments(bookings,{filter:'confirmed',now}).map(b=>b.id),['Past Client','Client Confirmed']);
 assert.deepEqual(filterAppointments(bookings,{filter:'history',now}).map(b=>b.id),['Expired Request','Canceled Client','Past Client']);
 assert.deepEqual(filterAppointments(bookings,{filter:'blocked',now}).map(b=>b.id),['Time off']);
 assert.deepEqual(filterAppointments(bookings,{filter:'all',query:'9095550199',now}).map(b=>b.id),['Client Confirmed']);
 assert.deepEqual(appointmentsForDay(bookings,'2026-11-19').map(b=>b.id),['Client Confirmed']);
});
