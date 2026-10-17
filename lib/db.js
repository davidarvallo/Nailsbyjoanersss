import {neon} from '@neondatabase/serverless';
let client;
export function configured(){return Boolean(process.env.DATABASE_URL&&process.env.ADMIN_PASSWORD_HASH&&process.env.SESSION_SECRET);}
export function db(){if(!process.env.DATABASE_URL)throw Object.assign(new Error('Booking setup is still in progress. Please text Joane.'),{status:503});return client ||= neon(process.env.DATABASE_URL);}
export async function limit(key,max=10){
 const rows=await db().query(`INSERT INTO booking_rate_limits(key,hits,reset_at) VALUES($1,1,now()+interval '15 minutes') ON CONFLICT(key) DO UPDATE SET hits=CASE WHEN booking_rate_limits.reset_at<now() THEN 1 ELSE booking_rate_limits.hits+1 END, reset_at=CASE WHEN booking_rate_limits.reset_at<now() THEN now()+interval '15 minutes' ELSE booking_rate_limits.reset_at END RETURNING hits`,[key]);
 if(rows[0].hits>max)throw Object.assign(new Error('Too many attempts. Please try again in 15 minutes.'),{status:429});
}
export async function settings(){const rows=await db().query('SELECT data FROM booking_settings WHERE id=1');return rows[0]?.data||{};}
