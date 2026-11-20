import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {ADDITIONAL_SERVICES,depositForBooking} from '../booking-config.js';
const text=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');

test('each service requires its own $20 deposit, with the $15 early fee charged only once',()=>{
 const cases=[
  ['11:30','',20,1],
  ['06:00','',35,1],
  ['11:30','pedi1',40,2],
  ['06:00','pedi2',55,2],
  ['06:00','pedi3',55,2]
 ];
 for(const [time,pedicure,total,count] of cases){
  const b=depositForBooking(time,pedicure);
  assert.equal(b.total,total);
  assert.equal(b.serviceCount,count);
  assert.equal(b.serviceDeposits,20*count);
  assert.equal(b.earlyFee,time==='06:00'?15:0);
 }
});

test('new acrylic sets have bookable IDs but clearly unconfirmed prices and durations',()=>{
 for(const [id,name] of [['xl-acrylic-set','XL Acrylic Set'],['xxl-plus-acrylic-set','XXL+ Acrylic Set']]){
  const service=ADDITIONAL_SERVICES.find(x=>x.id===id);
  assert.ok(service,id+' not registered');
  assert.equal(service.name,name);
  assert.equal(service.price,null);
  assert.equal(service.estimate,true);
 }
});

test('booker and backend use the same deposit helper and store both preferences',()=>{
 const book=text('book.html'),js=text('booking.js'),api=text('api/booking.js'),admin=text('admin.js');
 assert.match(book,/name="silentAppointment"/);
 assert.match(book,/name="freestyleDesign"/);
 assert.match(book,/id="deposit-breakdown"/);
 assert.match(js,/depositForBooking\(chosenTime,data\.pedicure\)/);
 assert.match(js,/['"]silentAppointment['"],['"]freestyleDesign['"]/);
 assert.match(api,/deposit:depositForBooking\(time,pedicure\)\.total/);
 assert.match(api,/freestyleDesign&&tier==='none'/);
 assert.match(api,/silentAppointment,freestyleDesign/);
 assert.match(api,/silentAppointment:b\.data\.silentAppointment/);
 assert.match(admin,/Silent \/ minimal conversation/);
 assert.match(admin,/Freestyle · artist chooses/);
});

test('policies, customer receipts and homepage match new deposits and Joane first-person voice',()=>{
 const book=text('book.html'),homepage=text('index.html'),js=text('booking.js');
 for(const html of [book,homepage]){
  assert.match(html,/I (?:require|charge).*?\$20|Deposits are \$20/i);
  assert.match(html,/\$55/);
  assert.match(html,/I (?:may decline|don't perform)/);
  assert.doesNotMatch(html,/Joane (?:may decline|does not perform|manually verifies|will contact)/);
 }
 assert.match(book,/Silent visits &amp; freestyle designs/);
 assert.match(js,/AWAITING APPROVAL/);
 assert.match(js,/approved your visit and verified your deposit/);
 assert.doesNotMatch(js,/deposit===35/);
});

test('newer photo archive explicitly separates four fingernail sets from pedicures',()=>{
 const importer=text('scripts/import-joane-archive.mjs');
 for(const f of ['image10.jpg','image15.jpg','image6.jpg','image9.jpg'])assert.ok(importer.includes("'"+f+"'"));
 assert.match(importer,/isNails\?'nails':'pedicures'/);
 assert.match(importer,/handSets\.length!==4/);
});
