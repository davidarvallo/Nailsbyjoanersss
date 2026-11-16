import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const source=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const booking=source('book.html'),admin=source('admin.html'),styles=source('studio-refresh.css');
test('booking redesign loads visual enhancements without replacing reservation logic',()=>{
 assert.match(booking,/class="booking-page review-theme studio-redesign"/);
 assert.match(booking,/href="\/studio-refresh\.css"/);
 assert.match(booking,/src="\/booking-experience\.js"/);
 assert.doesNotMatch(booking,/src="\/booking\.js"/);
 const enhancement=source('booking-experience.js');
 assert.match(enhancement,/import '\.\/booking\.js'/);
 assert.match(enhancement,/service-accordion/);
 assert.match(enhancement,/booking-note-details/);
 assert.match(enhancement,/MutationObserver/);
 assert.match(enhancement,/aria-current/);
 assert.match(booking,/name="location" value="San Bernardino"/);
});
test('studio redesign keeps authenticated appointment management and settings',()=>{
 assert.match(admin,/class="booking-page review-theme studio-redesign"/);
 assert.match(admin,/href="\/studio-refresh\.css"/);
 assert.match(admin,/src="\/admin\.js"/);
 assert.match(admin,/src="\/studio-admin-ui\.js"/);
 for(const name of ['studio-mode','stats','calendar-grid','day-appointments','requests','settings-form','block-form','reschedule-form','login-form','logout']){
  assert.ok(admin.includes('id="'+name+'"'),name);
 }
 assert.match(admin,/class="studio-quick-nav"/);
 assert.match(admin,/id="admin-settings"/);
 assert.match(admin,/id="admin-block-time"/);
 const nav=source('studio-admin-ui.js');
 assert.match(nav,/target\.open=true/);
});
test('responsive design retains accessible focus targets and reduced motion',()=>{
 assert.match(styles,/@media\(prefers-reduced-motion:reduce\)/);
 assert.match(styles,/:focus-visible/);
 assert.match(styles,/\.service-accordion/);
 assert.match(styles,/\.admin-calendar-layout/);
 assert.match(styles,/\.admin-management-panels/);
 assert.match(styles,/@view-transition/);
 assert.match(styles,/@media\(max-width:640px\)/);
});
