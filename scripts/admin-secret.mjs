import {randomBytes,scryptSync} from 'node:crypto';
// This prints fresh server configuration; it never writes a password into source control.
const password=randomBytes(18).toString('base64url');const salt=randomBytes(16).toString('hex');
console.log('Temporary studio password:',password);
console.log('ADMIN_PASSWORD_HASH='+salt+':'+scryptSync(password,salt,64).toString('hex'));
console.log('SESSION_SECRET='+randomBytes(48).toString('base64url'));
console.log('Store these only in Vercel encrypted environment variables. Give the password to Joane privately.');
